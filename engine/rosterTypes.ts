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
}
