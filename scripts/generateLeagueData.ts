// Generates data/leaguePlayers.json and data/leagueSchedule.json from nflverse
// releases. Run with: npm run generate:data
// Deterministic: re-running against the same CSVs must produce identical output.
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { Player, ScheduleMatch } from '../types';
import { TEAMS_DB } from '../constants';
import {
  RosterCsvRow, LEAGUE_YEAR, SALARY_CAP,
  buildPlayer, assignDepth, top51Total, normalizeTeamCap,
} from './lib/derivePlayer';

const ROSTER_URL = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${LEAGUE_YEAR}.csv`;
const GAMES_URL = 'https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv';

// nflverse abbreviations that differ from TEAMS_DB keys
const TEAM_ABBR_MAP: Record<string, string> = { LA: 'LAR', WSH: 'WAS' };
const mapTeam = (abbr: string): string => TEAM_ABBR_MAP[abbr] ?? abbr;

// Roster statuses that mean the player is no longer with the team
const EXCLUDED_STATUSES = new Set(['RET', 'CUT']);

const fail = (msg: string): never => {
  console.error(`FATAL: ${msg}`);
  process.exit(1);
};

const fetchCsv = async <T>(url: string): Promise<T[]> => {
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) fail(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
};

const buildPlayers = (rows: RosterCsvRow[]): Player[] => {
  const players: Player[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.full_name || EXCLUDED_STATUSES.has(row.status)) continue;
    const teamId = row.team ? mapTeam(row.team) : 'FA';
    if (teamId !== 'FA' && !TEAMS_DB[teamId]) fail(`Unknown team abbr '${row.team}' for ${row.full_name}`);
    const player = buildPlayer(row, teamId);
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    players.push(player);
  }
  players.sort((a, b) => a.id.localeCompare(b.id));
  assignDepth(players);
  return players;
};

const buildSchedule = (games: any[]): ScheduleMatch[] => {
  const season = games.filter(g => g.season === String(LEAGUE_YEAR) && g.game_type === 'REG');
  if (season.length !== 272) fail(`Expected 272 REG games for ${LEAGUE_YEAR}, got ${season.length}`);
  const schedule: ScheduleMatch[] = season.map(g => {
    const homeTeamId = mapTeam(g.home_team);
    const awayTeamId = mapTeam(g.away_team);
    if (!TEAMS_DB[homeTeamId]) fail(`Unknown home team abbr '${g.home_team}'`);
    if (!TEAMS_DB[awayTeamId]) fail(`Unknown away team abbr '${g.away_team}'`);
    return { week: parseInt(g.week), homeTeamId, awayTeamId, isCompleted: false };
  });
  schedule.sort((a, b) => a.week - b.week || a.homeTeamId.localeCompare(b.homeTeamId));
  return schedule;
};

const selfCheck = (players: Player[], schedule: ScheduleMatch[]): void => {
  console.log('\nTEAM            ROSTER  TOP-51 ($M)  CAP SPACE ($M)');
  for (const teamId of Object.keys(TEAMS_DB)) {
    const roster = players.filter(p => p.teamId === teamId);
    const total = top51Total(roster);
    const space = SALARY_CAP - total;
    console.log(`${teamId.padEnd(16)}${String(roster.length).padEnd(8)}${total.toFixed(1).padEnd(13)}${space.toFixed(1)}`);
    if (roster.length < 46) fail(`${teamId} has only ${roster.length} players`);
    if (space < 0) fail(`${teamId} is over the cap by $${(-space).toFixed(1)}M`);
  }
  for (const p of players) {
    const c = p.contract;
    const nums = [p.age, p.overall, c.salary, c.bonus, c.capHit, c.deadCap, c.guaranteed, c.totalValue];
    if (nums.some(n => typeof n !== 'number' || isNaN(n))) fail(`NaN field on player ${p.id} (${p.name})`);
  }
  const weeks = new Set(schedule.map(m => m.week));
  if (weeks.size !== 18) fail(`Schedule covers ${weeks.size} weeks, expected 18`);
  console.log(`\nOK: ${players.length} players, ${schedule.length} games across 18 weeks.`);
};

const main = async () => {
  const [rosterRows, gameRows] = await Promise.all([
    fetchCsv<RosterCsvRow>(ROSTER_URL),
    fetchCsv<any>(GAMES_URL),
  ]);

  const players = buildPlayers(rosterRows);
  const schedule = buildSchedule(gameRows);

  const capTarget = 0.95 * SALARY_CAP;
  for (const teamId of Object.keys(TEAMS_DB)) {
    normalizeTeamCap(players.filter(p => p.teamId === teamId), capTarget);
  }

  selfCheck(players, schedule);

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  // One entity per line: readable diffs, no giant single line.
  const writeJson = (file: string, items: object[]) => {
    const body = items.map(i => JSON.stringify(i)).join(',\n');
    fs.writeFileSync(path.join(dataDir, file), `[\n${body}\n]\n`);
    console.log(`Wrote data/${file}`);
  };
  writeJson('leaguePlayers.json', players);
  writeJson('leagueSchedule.json', schedule);
};

main();
