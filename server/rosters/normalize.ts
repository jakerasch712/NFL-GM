import { RosterRecord, SkippedRecord, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { POSITION_MAP, STATUS_MAP } from './config';

/** Shape of `data` in an NFL.com `sports-league-data/team_roster` result. Every field is treated as optional. */
export interface ProviderRosterPayload {
  players?: ProviderPlayer[];
  roster_size?: number;
  season?: number;
  observed_at_ms?: number;
  source_url?: string;
}

export interface ProviderPlayer {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gsis_id?: string | null;
  position?: string | null;
  status?: string | null;
  jersey_number?: string | number | null;
  birth_date?: string | null;
  nfl_experience?: number | null;
  height_in?: number | null;
  weight_lb?: number | null;
  college_names?: string[] | null;
  headshot_url?: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const finiteOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/**
 * Provider payload → normalized snapshot. Pure: no clock, no randomness, no I/O.
 * Players that cannot be mapped are listed in `skipped` with a reason, never guessed.
 */
export function normalizeTeamRoster(teamId: string, payload: ProviderRosterPayload, fallbackFetchedAt: string): TeamRosterSnapshot {
  const records: RosterRecord[] = [];
  const skipped: SkippedRecord[] = [];
  const seen = new Set<string>();

  for (const raw of payload.players ?? []) {
    const name = (raw.display_name || `${raw.first_name ?? ''} ${raw.last_name ?? ''}`).trim();
    const gsisId = (raw.gsis_id ?? '').trim();
    const providerPosition = (raw.position ?? '').toUpperCase().trim();
    const providerStatus = (raw.status ?? '').toUpperCase().trim();

    if (!gsisId || !name) {
      skipped.push({ name: name || '(no name)', reason: 'missing_id', detail: 'No gsis_id or name' });
      continue;
    }
    if (seen.has(gsisId)) {
      skipped.push({ name, reason: 'duplicate', detail: gsisId });
      continue;
    }
    const status = STATUS_MAP[providerStatus] ?? 'unknown';
    if (status === 'unknown') {
      skipped.push({ name, reason: 'unknown_status', detail: providerStatus || '(empty)' });
      continue;
    }
    const position = POSITION_MAP[providerPosition];
    if (!position) {
      skipped.push({ name, reason: 'unknown_position', detail: providerPosition || '(empty)' });
      continue;
    }

    seen.add(gsisId);
    records.push({
      gsisId,
      name,
      position,
      providerPosition,
      status,
      providerStatus,
      jerseyNumber: raw.jersey_number === null || raw.jersey_number === undefined ? null : String(raw.jersey_number),
      birthDate: raw.birth_date && ISO_DATE.test(raw.birth_date) ? raw.birth_date : null,
      experience: Math.max(0, finiteOrNull(raw.nfl_experience) ?? 0),
      heightIn: finiteOrNull(raw.height_in),
      weightLb: finiteOrNull(raw.weight_lb),
      college: raw.college_names?.[0] ?? null,
      headshotUrl: raw.headshot_url ?? null
    });
  }

  const observed = finiteOrNull(payload.observed_at_ms);
  return {
    teamId,
    season: finiteOrNull(payload.season),
    fetchedAt: observed ? new Date(observed).toISOString() : fallbackFetchedAt,
    sourceUrl: payload.source_url ?? null,
    providerRosterSize: finiteOrNull(payload.roster_size) ?? (payload.players?.length ?? 0),
    records,
    skipped
  };
}
