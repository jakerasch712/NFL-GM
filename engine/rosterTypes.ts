import { Player, Position } from '../types';

/** Roster status after mapping provider codes. */
export type RosterStatus = 'active' | 'reserve' | 'practice_squad' | 'departed' | 'unknown';

/** One provider player, normalized. No ratings, no contract. Safe to cache. */
export interface RosterRecord {
  gsisId: string;
  name: string;
  position: Position;
  providerPosition: string;
  status: RosterStatus;
  providerStatus: string;
  jerseyNumber: string | null;
  birthDate: string | null; // ISO date
  experience: number;
  heightIn: number | null;
  weightLb: number | null;
  college: string | null;
  headshotUrl: string | null;
}

export interface SkippedRecord {
  name: string;
  reason: 'missing_id' | 'unknown_position' | 'unknown_status' | 'departed' | 'practice_squad' | 'duplicate';
  detail: string;
}

/** Normalized team roster as stored in the cache and the snapshot file. */
export interface TeamRosterSnapshot {
  teamId: string;
  season: number | null;
  fetchedAt: string; // ISO timestamp of the provider fetch
  sourceUrl: string | null;
  providerRosterSize: number;
  records: RosterRecord[];
  skipped: SkippedRecord[];
}

export type RosterSource = 'firecrawl' | 'cache' | 'stale_cache' | 'snapshot';

/** Response of GET /api/rosters/:team */
export interface TeamRosterResponse {
  success: true;
  teamId: string;
  season: number | null;
  source: RosterSource;
  fetchedAt: string;
  sourceUrl: string | null;
  providerRosterSize: number;
  players: Player[];
  skipped: SkippedRecord[];
  /** Real league salary cap in USD millions, when the contract source reported it. */
  salaryCapM: number | null;
  /** How many imported players got a real cap hit, and when that data was fetched. */
  contracts: { matched: number; total: number; fetchedAt: string | null };
}

/** One row of a team cap table. */
export interface CapEntry {
  sourceId: string; // Spotrac player ID
  name: string;
  capHitM: number; // Current season cap hit, USD millions
}

/** Parsed team cap page as stored in the cache and the snapshot file. */
export interface TeamContractSnapshot {
  teamId: string;
  season: number;
  fetchedAt: string;
  sourceUrl: string;
  salaryCapM: number | null;
  entries: CapEntry[];
}

/** Per player rating inputs built from nflverse by scripts/buildRatingsInputs.ts. */
export interface PlayerRatingInput {
  /** Production percentile within the position, 0 to 1. Absent when the player never qualified. */
  p?: number;
  /** Sample weight, 0 to 1: weighted games divided by the full sample size. */
  s?: number;
  /** Best depth chart rank at a base position, 1 = starter. */
  d?: number;
}

export interface RatingsInputs {
  generatedAt: string;
  seasons: number[];
  depthChartAsOf: string | null;
  players: Record<string, PlayerRatingInput>;
}
