import { CapEntry, TeamContractSnapshot } from '../../engine/rosterTypes';

/**
 * Parser for a Spotrac team cap page fetched as markdown (tables only).
 * Pure and deterministic: no LLM. The page exposes player name and current season cap hit;
 * it does not expose contract length, bonus or guarantees.
 */

// | ![](headshot)[Name](https://www.spotrac.com/nfl/player/_/id/14415/slug "Name") LT | $16,784,253 |
const PLAYER_ROW = /\[([^\]]+)\]\(https:\/\/www\.spotrac\.com\/nfl\/player\/_\/id\/(\d+)\/[^)]*\)[^|]*\|\s*(-?)\$([\d,]+)\s*\|/;
const CAP_ROW = /\|\s*\d{4} NFL Salary Cap\s*\|\s*\$([\d,]+)\s*\|/;

const dollarsToMillions = (digits: string) => Math.round(Number(digits.replace(/,/g, '')) / 10_000) / 100;

export interface ParsedCapPage {
  salaryCapM: number | null;
  entries: CapEntry[];
}

export function parseSpotracCap(markdown: string): ParsedCapPage {
  // Tables are separated by blank lines. Player tables start with a "| Player" header.
  const tables = markdown.split(/\n\s*\n/).filter(block => block.trimStart().startsWith('| Player'));
  // The page lists roster tables first (active, reserve lists, practice squad) and dead money last.
  // Dead money rows belong to players who left, so the last player table is dropped.
  const rosterTables = tables.length > 1 ? tables.slice(0, -1) : tables;

  const entries: CapEntry[] = [];
  const seen = new Set<string>();
  for (const table of rosterTables) {
    for (const line of table.split('\n')) {
      const match = PLAYER_ROW.exec(line);
      if (!match) continue;
      const [, name, sourceId, negative, digits] = match;
      if (seen.has(sourceId)) continue; // first listing wins
      seen.add(sourceId);
      entries.push({ sourceId, name: name.trim(), capHitM: (negative ? -1 : 1) * dollarsToMillions(digits) });
    }
  }

  const cap = CAP_ROW.exec(markdown);
  return { salaryCapM: cap ? dollarsToMillions(cap[1]) : null, entries };
}

export function toContractSnapshot(teamId: string, season: number, sourceUrl: string, markdown: string, fetchedAt: string): TeamContractSnapshot {
  return { teamId, season, fetchedAt, sourceUrl, ...parseSpotracCap(markdown) };
}

const SUFFIX = /\b(jr|sr|ii|iii|iv|v)\b\.?/g;
const clean = (value: string) => value.toLowerCase().replace(/[’']/g, '').replace(SUFFIX, '').replace(/[^a-z ]/g, ' ').trim();

/** "Gervon Dexter Sr." → "gervondexter" */
export const fullNameKey = (name: string) => clean(name).replace(/\s+/g, '');

/** "Cameron Thomas" and "Cam Thomas" → "c|thomas". Used only when it is unique on the team. */
export const initialKey = (name: string) => {
  const parts = clean(name).split(/\s+/).filter(Boolean);
  return parts.length < 2 ? '' : `${parts[0][0]}|${parts[parts.length - 1]}`;
};

/**
 * Builds a lookup from roster name to cap entry for one team.
 * Exact normalized name first; then first initial plus last name, but only where that key is
 * unique among the cap entries, so two players never share one cap hit.
 */
export function createCapLookup(entries: CapEntry[]): (rosterName: string) => CapEntry | undefined {
  const byFull = new Map<string, CapEntry>();
  const byInitial = new Map<string, CapEntry | null>();
  for (const entry of entries) {
    if (!byFull.has(fullNameKey(entry.name))) byFull.set(fullNameKey(entry.name), entry);
    const key = initialKey(entry.name);
    if (key) byInitial.set(key, byInitial.has(key) ? null : entry);
  }
  const used = new Set<string>();
  return rosterName => {
    const entry = byFull.get(fullNameKey(rosterName)) ?? byInitial.get(initialKey(rosterName)) ?? undefined;
    if (!entry || used.has(entry.sourceId)) return undefined;
    used.add(entry.sourceId);
    return entry;
  };
}
