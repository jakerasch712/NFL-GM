/**
 * Builds data/snapshots/ratings-inputs.json from nflverse release files (free, no key).
 * Usage: npm run ratings:inputs            (current season = this calendar year)
 *        RATINGS_SEASON=2026 npm run ratings:inputs
 * Run weekly in season. The depth chart file is large (about 75 MB) and is streamed.
 */
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { RatingsInputs } from '../engine/rosterTypes';
import { readRosterEnv } from '../server/rosters/bootstrap';
import { PRODUCTION_CONFIG } from '../server/rosters/config';
import { buildRatingInputs, DepthRow, latestDepthRanks, StatsRow } from '../server/rosters/performance';

const BASE = 'https://github.com/nflverse/nflverse-data/releases/download';

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

const parseCsv = <T>(text: string): T[] => Papa.parse<T>(text, { header: true, skipEmptyLines: true }).data;

/** Streams the depth chart CSV line by line so the whole file is never held as parsed objects. */
async function* depthRows(url: string): AsyncGenerator<DepthRow> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url} returned ${res.status}`);
  const decoder = new TextDecoder();
  let buffer = '';
  let header: string[] | null = null;
  const emit = function* (line: string): Generator<DepthRow> {
    if (!line) return;
    const cells = Papa.parse<string[]>(line).data[0];
    if (!cells) return;
    if (!header) { header = cells; return; }
    const row: Record<string, string> = {};
    header.forEach((name, index) => { row[name] = cells[index] ?? ''; });
    yield row as unknown as DepthRow;
  };
  for await (const chunk of res.body as any) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      yield* emit(buffer.slice(0, newline).replace(/\r$/, ''));
      buffer = buffer.slice(newline + 1);
    }
  }
  yield* emit(buffer);
}

async function main() {
  const current = Number(process.env.RATINGS_SEASON) || new Date().getUTCFullYear();
  const seasons = PRODUCTION_CONFIG.seasonWeights.map((_, index) => current - index);

  const statsBySeason: StatsRow[][] = [];
  const usedSeasons: number[] = [];
  for (const season of seasons) {
    const text = await fetchText(`${BASE}/stats_player/stats_player_reg_${season}.csv`);
    if (text === null) { console.warn(`No stats file for ${season}; skipping.`); statsBySeason.push([]); continue; }
    statsBySeason.push(parseCsv<StatsRow>(text));
    usedSeasons.push(season);
  }

  const collected: DepthRow[] = [];
  let newest = '';
  for await (const row of depthRows(`${BASE}/depth_charts/depth_charts_${current}.csv`)) {
    // Keep only rows of the newest snapshot seen so far.
    if (row.dt > newest) { newest = row.dt; collected.length = 0; }
    if (row.dt === newest) collected.push(row);
  }
  const depth = latestDepthRanks(collected);

  const output: RatingsInputs = {
    generatedAt: new Date().toISOString(),
    seasons: usedSeasons,
    depthChartAsOf: depth.asOf,
    players: buildRatingInputs(statsBySeason, depth.ranks)
  };
  const file = readRosterEnv().ratingInputsFile;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(output));
  const all = Object.values(output.players);
  console.log(`Wrote ${all.length} players to ${file}: ${all.filter(p => p.p !== undefined).length} with production, ${all.filter(p => p.d !== undefined).length} with depth rank. Depth chart as of ${depth.asOf}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
