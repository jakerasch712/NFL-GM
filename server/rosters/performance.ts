import { Position } from '../../types';
import { PlayerRatingInput } from '../../engine/rosterTypes';
import { DEPTH_SLOT_MAP, POSITION_MAP, PRODUCTION_CONFIG, ProductionConfig } from './config';

/** A row of an nflverse `stats_player_reg_<season>.csv` file. All values are strings. */
export type StatsRow = Record<string, string | undefined>;

/** A row of an nflverse `depth_charts_<season>.csv` file. */
export interface DepthRow {
  dt: string;
  gsis_id: string;
  pos_abb: string;
  pos_rank: string;
}

interface SeasonProduction {
  percentile: number;
  games: number;
}

const num = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * One season of stats → production percentile per player, ranked within the game position.
 * Pure. Players below the qualifier or the minimum games are left out.
 */
export function seasonProduction(rows: StatsRow[], config: ProductionConfig = PRODUCTION_CONFIG): Map<string, SeasonProduction> {
  const byPosition = new Map<Position, { id: string; value: number; games: number }[]>();

  for (const row of rows) {
    const id = (row.player_id ?? '').trim();
    const position = POSITION_MAP[(row.position ?? '').toUpperCase().trim()];
    const metric = position ? config.metrics[position] : undefined;
    if (!id || !position || !metric) continue;

    const games = Math.min(config.maxGamesPerSeason, Math.floor(num(row.games)));
    if (games < config.minGames || num(row[metric.qualifier.column]) < metric.qualifier.min) continue;

    // Metric = Σ(stat × weight) ÷ games, or ÷ the named stat column for rate metrics such as field goal percentage.
    const total = Object.entries(metric.weights).reduce((sum, [column, weight]) => sum + num(row[column]) * weight, 0);
    const divisor = metric.per === 'game' ? games : num(row[metric.per]);
    if (divisor <= 0) continue;

    byPosition.set(position, [...(byPosition.get(position) ?? []), { id, value: total / divisor, games }]);
  }

  const result = new Map<string, SeasonProduction>();
  for (const group of byPosition.values()) {
    const sorted = group.map(g => g.value).sort((a, b) => a - b);
    for (const entry of group) {
      // Percentile = (players strictly below + half of the ties) ÷ group size (mid rank method).
      const below = sorted.findIndex(v => v >= entry.value);
      const ties = sorted.filter(v => v === entry.value).length;
      result.set(entry.id, { percentile: (below + ties / 2) / sorted.length, games: entry.games });
    }
  }
  return result;
}

/**
 * Latest depth chart snapshot → best rank per player at a base position. Pure.
 * The file holds one snapshot per `dt`; only rows of the newest `dt` are used.
 */
export function latestDepthRanks(rows: Iterable<DepthRow>): { asOf: string | null; ranks: Map<string, number> } {
  let asOf: string | null = null;
  let ranks = new Map<string, number>();
  for (const row of rows) {
    if (!row.dt) continue;
    if (asOf === null || row.dt > asOf) { asOf = row.dt; ranks = new Map(); }
    if (row.dt !== asOf || !row.gsis_id || !DEPTH_SLOT_MAP[row.pos_abb]) continue;
    const rank = Math.floor(num(row.pos_rank));
    if (rank < 1) continue;
    ranks.set(row.gsis_id, Math.min(rank, ranks.get(row.gsis_id) ?? Infinity));
  }
  return { asOf, ranks };
}

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Combines seasons (newest first) and depth ranks into the compact per player inputs. Pure.
 * Percentile = average of season percentiles weighted by games × season weight.
 * Sample = Σ(games × season weight) ÷ fullSampleGames, capped at 1.
 */
export function buildRatingInputs(
  seasonsNewestFirst: StatsRow[][],
  depthRanks: Map<string, number>,
  config: ProductionConfig = PRODUCTION_CONFIG
): Record<string, PlayerRatingInput> {
  const weighted = new Map<string, { sum: number; weight: number }>();
  seasonsNewestFirst.forEach((rows, index) => {
    const seasonWeight = config.seasonWeights[index] ?? 0;
    if (seasonWeight <= 0) return;
    for (const [id, production] of seasonProduction(rows, config)) {
      const weight = production.games * seasonWeight;
      const entry = weighted.get(id) ?? { sum: 0, weight: 0 };
      weighted.set(id, { sum: entry.sum + production.percentile * weight, weight: entry.weight + weight });
    }
  });

  const players: Record<string, PlayerRatingInput> = {};
  for (const [id, entry] of weighted) {
    players[id] = { p: round3(entry.sum / entry.weight), s: round3(Math.min(1, entry.weight / config.fullSampleGames)) };
  }
  for (const [id, rank] of depthRanks) players[id] = { ...players[id], d: rank };
  return players;
}
