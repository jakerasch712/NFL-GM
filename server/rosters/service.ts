import { Player } from '../../types';
import { PlayerRatingInput, RosterSource, TeamContractSnapshot, TeamRosterResponse, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { AlexandriaCall, ALEXANDRIA_MAX_BATCH, FirecrawlClient } from '../providers/firecrawl';
import { TeamStore } from './cache';
import { PROVIDER_TEAM_CODE, spotracCapUrl, TEAM_IDS, TeamId } from './config';
import { normalizeTeamRoster, ProviderRosterPayload } from './normalize';
import { buildTeamPlayers } from './ratings';
import { toContractSnapshot } from './spotrac';

export class RosterUnavailableError extends Error {
  constructor(teamId: string) {
    super(`No roster source available for ${teamId}`);
    this.name = 'RosterUnavailableError';
  }
}

export const isTeamId = (value: string): value is TeamId => (TEAM_IDS as readonly string[]).includes(value);

type ReadOnly<T> = Pick<TeamStore<T>, 'read'>;

export interface RosterServiceDeps {
  /** Null when no FIRECRAWL_API_KEY is configured. */
  client: Pick<FirecrawlClient, 'runBatch' | 'scrapeTables'> | null;
  cache: TeamStore<TeamRosterSnapshot>;
  snapshot: ReadOnly<TeamRosterSnapshot>;
  contractCache: TeamStore<TeamContractSnapshot>;
  contractSnapshot: ReadOnly<TeamContractSnapshot>;
  /** False turns the Spotrac cap page fetch off; contracts are then modelled. */
  contractsEnabled: boolean;
  curated: Player[];
  /** nflverse production and depth inputs, or undefined when the file has not been built. */
  ratingInputs?: Record<string, PlayerRatingInput>;
  /** Season to request. Undefined lets the provider use the current league season. */
  season?: number;
  cacheTtlMs: number;
  now: () => Date;
}

const rosterCall = (teamId: TeamId, season?: number): AlexandriaCall => ({
  provider: 'nfl-com',
  capability: 'sports-league-data/team_roster',
  options: { team: PROVIDER_TEAM_CODE[teamId] ?? teamId, ...(season ? { season } : {}) }
});

export function createRosterService(deps: RosterServiceDeps) {
  const inFlight = new Map<string, Promise<unknown>>();

  /** Concurrent requests for the same key share one provider call. */
  function once<T>(key: string, run: () => Promise<T>): Promise<T> {
    const pending = inFlight.get(key) as Promise<T> | undefined;
    if (pending) return pending;
    const job = run().finally(() => inFlight.delete(key));
    inFlight.set(key, job);
    return job;
  }

  const isFresh = (fetchedAt: string) => deps.now().getTime() - new Date(fetchedAt).getTime() < deps.cacheTtlMs;
  const seasonOf = (snapshot: TeamRosterSnapshot) => snapshot.season ?? deps.season ?? deps.now().getUTCFullYear();

  const fetchLiveRoster = (teamId: TeamId) => once(`roster:${teamId}`, async () => {
    const [result] = await deps.client!.runBatch<ProviderRosterPayload>([rosterCall(teamId, deps.season)]);
    if (result.error || !result.data) throw new Error(result.error ?? 'Empty provider result');
    const snapshot = normalizeTeamRoster(teamId, result.data, deps.now().toISOString());
    if (snapshot.records.length === 0) throw new Error('Provider returned no usable players');
    await deps.cache.write(teamId, snapshot);
    return snapshot;
  });

  const fetchLiveContracts = (teamId: TeamId, season: number) => once(`contracts:${teamId}`, async () => {
    const url = spotracCapUrl(teamId, season);
    const snapshot = toContractSnapshot(teamId, season, url, await deps.client!.scrapeTables(url), deps.now().toISOString());
    if (snapshot.entries.length === 0) throw new Error('Cap page had no player rows');
    await deps.contractCache.write(teamId, snapshot);
    return snapshot;
  });

  /**
   * Contract chain: fresh cache → Spotrac page → stale cache → committed snapshot → null.
   * Never throws: without cap data the roster still loads with modelled contracts.
   */
  async function getTeamContracts(teamId: TeamId, season: number, options: { forceRefresh?: boolean; storedOnly?: boolean } = {}): Promise<TeamContractSnapshot | null> {
    if (!deps.contractsEnabled) return null;
    const cached = await deps.contractCache.read(teamId);
    const usable = cached && cached.season === season ? cached : null;
    if (usable && (options.storedOnly || (isFresh(usable.fetchedAt) && !options.forceRefresh))) return usable;
    if (deps.client && !options.storedOnly) {
      try {
        return await fetchLiveContracts(teamId, season);
      } catch (err) {
        console.warn(`[rosters] Contract fetch failed for ${teamId}:`, (err as Error).message);
      }
    }
    if (usable) return usable;
    const committed = await deps.contractSnapshot.read(teamId);
    return committed && committed.season === season ? committed : null;
  }

  function respond(snapshot: TeamRosterSnapshot, source: RosterSource, contracts: TeamContractSnapshot | null): TeamRosterResponse {
    const players = buildTeamPlayers(snapshot, {
      season: seasonOf(snapshot),
      curated: deps.curated,
      ratingInputs: deps.ratingInputs,
      capEntries: contracts?.entries
    });
    return {
      success: true,
      teamId: snapshot.teamId,
      season: snapshot.season,
      source,
      fetchedAt: snapshot.fetchedAt,
      sourceUrl: snapshot.sourceUrl,
      providerRosterSize: snapshot.providerRosterSize,
      players,
      skipped: snapshot.skipped,
      salaryCapM: contracts?.salaryCapM ?? null,
      contracts: {
        matched: players.filter(p => p.contractSource === 'cap_hit').length,
        total: players.length,
        fetchedAt: contracts?.fetchedAt ?? null
      }
    };
  }

  async function resolveRoster(teamId: TeamId, forceRefresh: boolean): Promise<{ snapshot: TeamRosterSnapshot; source: RosterSource }> {
    const cached = await deps.cache.read(teamId);
    if (cached && isFresh(cached.fetchedAt) && !forceRefresh) return { snapshot: cached, source: 'cache' };
    if (deps.client) {
      try {
        return { snapshot: await fetchLiveRoster(teamId), source: 'firecrawl' };
      } catch (err) {
        console.warn(`[rosters] Live fetch failed for ${teamId}:`, (err as Error).message);
      }
    }
    if (cached) return { snapshot: cached, source: 'stale_cache' };
    const committed = await deps.snapshot.read(teamId);
    if (committed) return { snapshot: committed, source: 'snapshot' };
    throw new RosterUnavailableError(teamId);
  }

  /**
   * Roster chain: fresh cache → Firecrawl → stale cache → committed snapshot.
   * Spend is bounded: per team and TTL at most one roster call and one cap page, unless `forceRefresh` is set.
   */
  async function getTeamRoster(teamId: TeamId, options: { forceRefresh?: boolean } = {}): Promise<TeamRosterResponse> {
    const { snapshot, source } = await resolveRoster(teamId, !!options.forceRefresh);
    const contracts = await getTeamContracts(teamId, seasonOf(snapshot), options);
    return respond(snapshot, source, contracts);
  }

  /** Refreshes every team: rosters in batches of 10, then one cap page per team. Returns snapshots and per team errors. */
  async function refreshLeague(): Promise<{ snapshots: TeamRosterSnapshot[]; contracts: TeamContractSnapshot[]; errors: Record<string, string> }> {
    if (!deps.client) throw new Error('FIRECRAWL_API_KEY is not configured');
    const snapshots: TeamRosterSnapshot[] = [];
    const contracts: TeamContractSnapshot[] = [];
    const errors: Record<string, string> = {};
    for (let i = 0; i < TEAM_IDS.length; i += ALEXANDRIA_MAX_BATCH) {
      const batch = TEAM_IDS.slice(i, i + ALEXANDRIA_MAX_BATCH);
      const results = await deps.client.runBatch<ProviderRosterPayload>(batch.map(teamId => rosterCall(teamId, deps.season)));
      for (let j = 0; j < batch.length; j++) {
        const teamId = batch[j];
        const result = results[j];
        if (result.error || !result.data) { errors[teamId] = result.error ?? 'Empty provider result'; continue; }
        const snapshot = normalizeTeamRoster(teamId, result.data, deps.now().toISOString());
        if (snapshot.records.length === 0) { errors[teamId] = 'No usable players'; continue; }
        await deps.cache.write(teamId, snapshot);
        snapshots.push(snapshot);
      }
    }
    if (deps.contractsEnabled) {
      // Sequential on purpose: one page at a time keeps load on the source site low.
      for (const snapshot of snapshots) {
        const teamId = snapshot.teamId as TeamId;
        try {
          contracts.push(await fetchLiveContracts(teamId, seasonOf(snapshot)));
        } catch (err) {
          errors[`${teamId}:contracts`] = (err as Error).message;
        }
      }
    }
    return { snapshots, contracts, errors };
  }

  /**
   * Every team available without spending provider credits: cache first, then the committed snapshot.
   * Used to seed a new league at startup.
   */
  async function getStoredLeague(): Promise<TeamRosterResponse[]> {
    const teams: TeamRosterResponse[] = [];
    for (const teamId of TEAM_IDS) {
      const cached = await deps.cache.read(teamId);
      const committed = cached ? null : await deps.snapshot.read(teamId);
      const snapshot = cached ?? committed;
      if (!snapshot) continue;
      const source: RosterSource = cached ? (isFresh(cached.fetchedAt) ? 'cache' : 'stale_cache') : 'snapshot';
      teams.push(respond(snapshot, source, await getTeamContracts(teamId, seasonOf(snapshot), { storedOnly: true })));
    }
    return teams;
  }

  return { getTeamRoster, refreshLeague, getStoredLeague };
}

export type RosterService = ReturnType<typeof createRosterService>;
