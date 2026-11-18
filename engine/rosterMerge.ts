import { Player } from '../types';

export const FREE_AGENT_TEAM_ID = 'FA';

export interface RosterChange {
  id: string;
  name: string;
  position: string;
  overall: number;
  /** Previous team for `arrived`, new position for `updated`. */
  detail?: string;
}

export interface RosterDiff {
  /** New to the save. */
  added: RosterChange[];
  /** Already in the save on another team or in free agency. */
  arrived: RosterChange[];
  /** On the team in the save and still on it. */
  kept: RosterChange[];
  /** On the team in the save but not on the incoming roster. Moved to free agency, never deleted. */
  released: RosterChange[];
  /** Generated placeholder players removed because real players replace them. */
  placeholdersRemoved: number;
}

export interface RosterMergeResult {
  players: Player[];
  diff: RosterDiff;
}

const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '').replace(/[^a-z]/g, '');

/** Name fallback also requires the same position, so namesakes at different positions never merge. */
const nameKey = (p: Player) => `${normalizeName(p.name)}|${p.position}`;

const isPlaceholder = (p: Player) => p.id.startsWith('gen_');

const change = (p: Player, detail?: string): RosterChange => ({ id: p.id, name: p.name, position: p.position, overall: p.overall, detail });

/**
 * Merges an incoming team roster into the full league player list. Pure.
 *
 * Matching order: gsisId, then ID (nflverse players already use the gsis ID as their ID),
 * then normalized name plus position for legacy hand curated players.
 *
 * A matched player keeps everything the save owns (ID, ratings, contract, progression, morale,
 * stats) and takes only identity and roster facts from the incoming record.
 */
export function mergeTeamRoster(allPlayers: Player[], incoming: Player[], teamId: string): RosterMergeResult {
  const byGsis = new Map<string, Player>();
  const byName = new Map<string, Player>();
  for (const p of allPlayers) {
    if (isPlaceholder(p)) continue;
    if (p.gsisId) byGsis.set(p.gsisId, p);
    byGsis.set(p.id, byGsis.get(p.id) ?? p);
    const key = nameKey(p);
    // Prefer a name match on the target team when two players share a name and position.
    if (!byName.has(key) || p.teamId === teamId) byName.set(key, p);
  }

  const diff: RosterDiff = { added: [], arrived: [], kept: [], released: [], placeholdersRemoved: 0 };
  const replacements = new Map<string, Player>(); // existing ID → merged player
  const additions: Player[] = [];
  const claimed = new Set<string>();

  for (const next of incoming) {
    const gsisId = next.gsisId ?? next.id;
    let existing = byGsis.get(gsisId) ?? byName.get(nameKey(next));
    if (existing && claimed.has(existing.id)) existing = undefined;

    if (!existing) {
      additions.push({ ...next, teamId });
      diff.added.push(change(next));
      continue;
    }

    claimed.add(existing.id);
    const merged: Player = {
      ...existing,
      gsisId,
      teamId,
      name: next.name,
      position: next.position,
      jerseyNumber: next.jerseyNumber,
      rosterStatus: next.rosterStatus,
      headshotUrl: next.headshotUrl,
      college: next.college,
      heightIn: next.heightIn,
      weightLb: next.weightLb,
      experience: next.experience,
      depth: next.depth
    };
    replacements.set(existing.id, merged);
    if (existing.teamId === teamId) diff.kept.push(change(merged, existing.position !== next.position ? `${existing.position} → ${next.position}` : undefined));
    else diff.arrived.push(change(merged, existing.teamId || FREE_AGENT_TEAM_ID));
  }

  const players: Player[] = [];
  for (const p of allPlayers) {
    const merged = replacements.get(p.id);
    if (merged) { players.push(merged); continue; }
    if (p.teamId !== teamId) { players.push(p); continue; }
    if (isPlaceholder(p)) { diff.placeholdersRemoved++; continue; }
    players.push({ ...p, teamId: FREE_AGENT_TEAM_ID, depth: undefined, rosterStatus: undefined });
    diff.released.push(change(p));
  }
  players.push(...additions);
  return { players, diff };
}

/**
 * Seeds a brand new league with stored live rosters. Pure.
 * Unlike mergeTeamRoster there is no save state to protect, so covered teams are replaced outright
 * and any base copy of an incoming player (on any team) is dropped to avoid duplicates.
 * Teams without a stored roster keep their base players.
 */
export function seedLeagueRosters(basePlayers: Player[], teams: { teamId: string; players: Player[] }[]): Player[] {
  if (teams.length === 0) return basePlayers;
  const covered = new Set(teams.map(t => t.teamId));
  const incoming = teams.flatMap(t => t.players);
  const incomingIds = new Set(incoming.map(p => p.gsisId ?? p.id));
  const incomingNames = new Set(incoming.map(nameKey));
  const kept = basePlayers.filter(p =>
    !covered.has(p.teamId) && !incomingIds.has(p.gsisId ?? p.id) && !incomingNames.has(nameKey(p))
  );
  return [...kept, ...incoming];
}
