import { Player } from '../../types';
import { RosterSource, TeamRosterResponse, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { AlexandriaCall, ALEXANDRIA_MAX_BATCH, FirecrawlClient } from '../providers/firecrawl';
import { RosterStore } from './cache';
import { PROVIDER_TEAM_CODE, TEAM_IDS, TeamId } from './config';
import { normalizeTeamRoster, ProviderRosterPayload } from './normalize';
import { buildTeamPlayers } from './ratings';

export class RosterUnavailableError extends Error {
  constructor(teamId: string) {
    super(`No roster source available for ${teamId}`);
    this.name = 'RosterUnavailableError';
  }
}

export const isTeamId = (value: string): value is TeamId => (TEAM_IDS as readonly string[]).includes(value);

export interface RosterServiceDeps {
  /** Null when no FIRECRAWL_API_KEY is configured. */
  client: FirecrawlClient | null;
  cache: RosterStore;
  snapshot: Pick<RosterStore, 'read'>;
  curated: Player[];
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
  const inFlight = new Map<string, Promise<TeamRosterSnapshot>>();

  async function fetchLive(teamId: TeamId): Promise<TeamRosterSnapshot> {
    // Concurrent requests for the same team share one provider call.
    const pending = inFlight.get(teamId);
    if (pending) return pending;
    const job = (async () => {
      const [result] = await deps.client!.runBatch<ProviderRosterPayload>([rosterCall(teamId, deps.season)]);
      if (result.error || !result.data) throw new Error(result.error ?? 'Empty provider result');
      const snapshot = normalizeTeamRoster(teamId, result.data, deps.now().toISOString());
      if (snapshot.records.length === 0) throw new Error('Provider returned no usable players');
      await deps.cache.write(snapshot);
      return snapshot;
    })().finally(() => inFlight.delete(teamId));
    inFlight.set(teamId, job);
    return job;
  }

  const isFresh = (snapshot: TeamRosterSnapshot) =>
    deps.now().getTime() - new Date(snapshot.fetchedAt).getTime() < deps.cacheTtlMs;

  function respond(snapshot: TeamRosterSnapshot, source: RosterSource): TeamRosterResponse {
    const season = snapshot.season ?? deps.season ?? deps.now().getUTCFullYear();
    return {
      success: true,
      teamId: snapshot.teamId,
      season: snapshot.season,
      source,
      fetchedAt: snapshot.fetchedAt,
      sourceUrl: snapshot.sourceUrl,
      providerRosterSize: snapshot.providerRosterSize,
      players: buildTeamPlayers(snapshot, { season, curated: deps.curated }),
      skipped: snapshot.skipped
    };
  }

  /**
   * Fallback chain: fresh cache → Firecrawl → stale cache → committed snapshot.
   * Spend is bounded: at most one provider call per team per TTL unless `forceRefresh` is set.
   */
  async function getTeamRoster(teamId: TeamId, options: { forceRefresh?: boolean } = {}): Promise<TeamRosterResponse> {
    const cached = await deps.cache.read(teamId);
    if (cached && isFresh(cached) && !options.forceRefresh) return respond(cached, 'cache');

    if (deps.client) {
      try {
        return respond(await fetchLive(teamId), 'firecrawl');
      } catch (err) {
        console.warn(`[rosters] Live fetch failed for ${teamId}:`, (err as Error).message);
      }
    }
    if (cached) return respond(cached, 'stale_cache');
    const committed = await deps.snapshot.read(teamId);
    if (committed) return respond(committed, 'snapshot');
    throw new RosterUnavailableError(teamId);
  }

  /** Refreshes every team in batches of 10. Returns the normalized snapshots and per team errors. */
  async function refreshLeague(): Promise<{ snapshots: TeamRosterSnapshot[]; errors: Record<string, string> }> {
    if (!deps.client) throw new Error('FIRECRAWL_API_KEY is not configured');
    const snapshots: TeamRosterSnapshot[] = [];
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
        await deps.cache.write(snapshot);
        snapshots.push(snapshot);
      }
    }
    return { snapshots, errors };
  }

  /**
   * Every team available without spending provider credits: cache first, then the committed snapshot.
   * Used to seed a new league at startup.
   */
  async function getStoredLeague(): Promise<TeamRosterResponse[]> {
    const teams: TeamRosterResponse[] = [];
    for (const teamId of TEAM_IDS) {
      const cached = await deps.cache.read(teamId);
      if (cached) { teams.push(respond(cached, isFresh(cached) ? 'cache' : 'stale_cache')); continue; }
      const committed = await deps.snapshot.read(teamId);
      if (committed) teams.push(respond(committed, 'snapshot'));
    }
    return teams;
  }

  return { getTeamRoster, refreshLeague, getStoredLeague };
}

export type RosterService = ReturnType<typeof createRosterService>;
