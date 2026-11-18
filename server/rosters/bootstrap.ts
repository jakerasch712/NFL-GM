import { readFileSync } from 'fs';
import path from 'path';
import { REAL_NFL_PLAYERS } from '../../data/nflRosters';
import { RatingsInputs, TeamContractSnapshot, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { createFirecrawlClient } from '../providers/firecrawl';
import { createFileStore, createSnapshotSectionStore } from './cache';
import { createRosterService } from './service';

const positiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Reads all roster settings from the environment. See .env.example. */
export function readRosterEnv(env: NodeJS.ProcessEnv = process.env) {
  const season = positiveNumber(env.ROSTER_SEASON, 0) || undefined;
  const snapshotDir = path.join(process.cwd(), 'data', 'snapshots');
  return {
    apiKey: env.FIRECRAWL_API_KEY || undefined,
    season,
    cacheTtlHours: positiveNumber(env.ROSTER_CACHE_TTL_HOURS, 168),
    cacheDir: env.ROSTER_CACHE_DIR || path.join(process.cwd(), '.cache', 'rosters'),
    snapshotFile: env.ROSTER_SNAPSHOT_FILE || path.join(snapshotDir, 'rosters.json'),
    ratingInputsFile: env.RATING_INPUTS_FILE || path.join(snapshotDir, 'ratings-inputs.json'),
    contractsEnabled: (env.ROSTER_CONTRACT_SOURCE || 'spotrac').toLowerCase() !== 'none',
    adminToken: env.ROSTER_ADMIN_TOKEN || undefined
  };
}

function loadRatingInputs(file: string): RatingsInputs | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as RatingsInputs;
  } catch {
    return null;
  }
}

export function createRosterServiceFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const settings = readRosterEnv(env);
  const ratingInputs = loadRatingInputs(settings.ratingInputsFile);
  const service = createRosterService({
    client: settings.apiKey ? createFirecrawlClient({ apiKey: settings.apiKey }) : null,
    cache: createFileStore<TeamRosterSnapshot>(settings.cacheDir),
    snapshot: createSnapshotSectionStore<TeamRosterSnapshot>(settings.snapshotFile, 'teams'),
    contractCache: createFileStore<TeamContractSnapshot>(path.join(settings.cacheDir, 'contracts')),
    contractSnapshot: createSnapshotSectionStore<TeamContractSnapshot>(settings.snapshotFile, 'contracts'),
    contractsEnabled: settings.contractsEnabled,
    curated: REAL_NFL_PLAYERS,
    ratingInputs: ratingInputs?.players,
    season: settings.season,
    cacheTtlMs: settings.cacheTtlHours * 3_600_000,
    now: () => new Date()
  });
  return { service, settings, ratingInputs };
}
