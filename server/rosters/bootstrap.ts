import path from 'path';
import { REAL_NFL_PLAYERS } from '../../data/nflRosters';
import { createFirecrawlClient } from '../providers/firecrawl';
import { createFileRosterStore, createSnapshotFileStore } from './cache';
import { createRosterService } from './service';

const positiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Reads all roster settings from the environment. See .env.example. */
export function readRosterEnv(env: NodeJS.ProcessEnv = process.env) {
  const season = positiveNumber(env.ROSTER_SEASON, 0) || undefined;
  return {
    apiKey: env.FIRECRAWL_API_KEY || undefined,
    season,
    cacheTtlHours: positiveNumber(env.ROSTER_CACHE_TTL_HOURS, 168),
    cacheDir: env.ROSTER_CACHE_DIR || path.join(process.cwd(), '.cache', 'rosters'),
    snapshotFile: env.ROSTER_SNAPSHOT_FILE || path.join(process.cwd(), 'data', 'snapshots', 'rosters.json'),
    adminToken: env.ROSTER_ADMIN_TOKEN || undefined
  };
}

export function createRosterServiceFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const settings = readRosterEnv(env);
  const service = createRosterService({
    client: settings.apiKey ? createFirecrawlClient({ apiKey: settings.apiKey }) : null,
    cache: createFileRosterStore(settings.cacheDir),
    snapshot: createSnapshotFileStore(settings.snapshotFile),
    curated: REAL_NFL_PLAYERS,
    season: settings.season,
    cacheTtlMs: settings.cacheTtlHours * 3_600_000,
    now: () => new Date()
  });
  return { service, settings };
}
