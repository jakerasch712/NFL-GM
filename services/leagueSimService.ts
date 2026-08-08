import { Player, ScheduleMatch } from '../types';
import { approvalAfterGame } from './approvalService';

export interface GameResult {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

const HOME_FIELD_ADVANTAGE = 1.5;

// Average overall of the team's top 22 players; falls back to team unit ratings
// when the roster is empty (e.g. seed-data edge cases).
export const teamStrength = (
  teamId: string,
  teams: Record<string, any>,
  allPlayers: Player[]
): number => {
  const roster = allPlayers.filter(p => p.teamId === teamId);
  if (roster.length === 0) {
    const t = teams[teamId];
    return t ? (t.stats.off + t.stats.def + t.stats.st) / 3 : 75;
  }
  const top22 = [...roster].sort((a, b) => b.overall - a.overall).slice(0, 22);
  return top22.reduce((sum, p) => sum + p.overall, 0) / top22.length;
};

export const simulateGame = (
  homeTeamId: string,
  awayTeamId: string,
  teams: Record<string, any>,
  allPlayers: Player[]
): { homeScore: number; awayScore: number } => {
  const diff = teamStrength(homeTeamId, teams, allPlayers) + HOME_FIELD_ADVANTAGE
    - teamStrength(awayTeamId, teams, allPlayers);
  const score = (edge: number) =>
    Math.max(0, Math.min(52, Math.round(21 + edge * 0.7 + (Math.random() * 20 - 10))));

  let homeScore = score(diff);
  let awayScore = score(-diff);

  // Overtime. Real ties are roughly one a season, so all but a small fraction
  // of level games get decided rather than left drawn.
  if (homeScore === awayScore && Math.random() < 0.94) {
    if (Math.random() < 0.5 + diff * 0.01) homeScore += 3;
    else awayScore += 3;
  }

  return { homeScore, awayScore };
};

export const applyResultToRecord = (record: string, outcome: 'W' | 'L' | 'T'): string => {
  const [w = 0, l = 0, t = 0] = (record || '0-0-0').split('-').map(Number);
  if (outcome === 'W') return `${w + 1}-${l}-${t}`;
  if (outcome === 'L') return `${w}-${l + 1}-${t}`;
  return `${w}-${l}-${t + 1}`;
};

const applyGameToTeams = (
  teams: Record<string, any>,
  result: GameResult
): Record<string, any> => {
  const next = { ...teams };
  const home = next[result.homeTeamId];
  const away = next[result.awayTeamId];
  if (!home || !away) return next;
  const homeOutcome = result.homeScore > result.awayScore ? 'W' : result.homeScore < result.awayScore ? 'L' : 'T';
  const awayOutcome = homeOutcome === 'W' ? 'L' : homeOutcome === 'L' ? 'W' : 'T';
  const diff = result.homeScore - result.awayScore;

  next[result.homeTeamId] = {
    ...home,
    record: applyResultToRecord(home.record, homeOutcome),
    ...approvalAfterGame(home, homeOutcome === 'W', homeOutcome === 'T', diff),
  };
  next[result.awayTeamId] = {
    ...away,
    record: applyResultToRecord(away.record, awayOutcome),
    ...approvalAfterGame(away, awayOutcome === 'W', awayOutcome === 'T', -diff),
  };
  return next;
};

// Marks a single game complete with a known score and updates both records.
export const applyCompletedGame = (
  schedule: ScheduleMatch[],
  teams: Record<string, any>,
  result: GameResult
): { schedule: ScheduleMatch[]; teams: Record<string, any> } => {
  const nextSchedule = schedule.map(m =>
    m.week === result.week && m.homeTeamId === result.homeTeamId && m.awayTeamId === result.awayTeamId && !m.isCompleted
      ? { ...m, isCompleted: true, score: { home: result.homeScore, away: result.awayScore } }
      : m
  );
  return { schedule: nextSchedule, teams: applyGameToTeams(teams, result) };
};

// Resolves every not-yet-completed game of the given week. Pure: returns new
// schedule/teams objects plus the teams that played, so the caller can roll
// injuries against the freshest player state. The !isCompleted filter is the
// double-sim guard.
export const simulateWeek = (
  week: number,
  schedule: ScheduleMatch[],
  teams: Record<string, any>,
  allPlayers: Player[]
): {
  schedule: ScheduleMatch[];
  teams: Record<string, any>;
  results: GameResult[];
  playedTeams: string[];
} => {
  let nextTeams = teams;
  const results: GameResult[] = [];
  const playedTeams: string[] = [];

  const nextSchedule = schedule.map(m => {
    if (m.week !== week || m.isCompleted) return m;
    const { homeScore, awayScore } = simulateGame(m.homeTeamId, m.awayTeamId, teams, allPlayers);
    const result: GameResult = { week, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, homeScore, awayScore };
    results.push(result);
    playedTeams.push(m.homeTeamId, m.awayTeamId);
    nextTeams = applyGameToTeams(nextTeams, result);
    return { ...m, isCompleted: true, score: { home: homeScore, away: awayScore } };
  });

  return { schedule: nextSchedule, teams: nextTeams, results, playedTeams };
};
