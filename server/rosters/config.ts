import { Position } from '../../types';
import { RosterStatus } from '../../engine/rosterTypes';

/**
 * All roster pipeline assumptions live here. Nothing in normalize.ts,
 * ratings.ts or contracts.ts may hard code a rate, weight or mapping.
 */

/** The 32 team IDs the game uses. Requests for anything else are rejected. */
export const TEAM_IDS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
] as const;

export type TeamId = (typeof TEAM_IDS)[number];

/**
 * Game team ID → NFL.com abbreviation, only where they differ.
 * Verified: ATL, AZ (provider contract and live call, 14 Nov 2026).
 * LAR and WAS appear in the provider contract. The rest are assumed identical
 * and are confirmed the first time `npm run rosters:snapshot` runs.
 */
export const PROVIDER_TEAM_CODE: Partial<Record<TeamId, string>> = {
  ARI: 'AZ'
};

/** NFL.com status code → game status. Codes not listed map to 'unknown' and are skipped and reported. */
export const STATUS_MAP: Record<string, RosterStatus> = {
  ACT: 'active',
  RES: 'reserve',
  PUP: 'reserve',
  DEV: 'practice_squad',
  CUT: 'departed',
  TRD: 'departed'
  // Seen but undocumented, deliberately unmapped: TRC, TRT, RSN, RSR
};

/** Statuses that become game roster players. */
export const IMPORT_STATUSES: RosterStatus[] = ['active', 'reserve'];

/** NFL.com position code → game position. Codes not listed are skipped and reported, never guessed. */
export const POSITION_MAP: Record<string, Position> = {
  QB: Position.QB,
  RB: Position.RB, HB: Position.RB, FB: Position.RB,
  WR: Position.WR,
  TE: Position.TE,
  OL: Position.OL, OT: Position.OL, T: Position.OL, G: Position.OL, OG: Position.OL, C: Position.OL, LS: Position.OL,
  DL: Position.DL, DE: Position.DL, DT: Position.DL, NT: Position.DL,
  LB: Position.LB, OLB: Position.LB, ILB: Position.LB, MLB: Position.LB,
  CB: Position.CB, DB: Position.CB,
  S: Position.S, FS: Position.S, SS: Position.S, SAF: Position.S,
  K: Position.K, P: Position.K
};

export interface RatingsConfig {
  /** Overall for an average veteran at the position before adjustments. */
  baseOverall: Record<Position, number>;
  /** Overall adjustment by accrued seasons. Index = seasons, last entry applies to all higher values. */
  experienceCurve: number[];
  /** Age after which a player loses `declinePerYear` overall each year. */
  peakAge: Record<Position, number>;
  declinePerYear: number;
  /** Adjustment for players on a reserve list. */
  reserveAdjustment: number;
  /** Half width of the seeded per player variance. */
  varianceSpread: number;
  minOverall: number;
  /** Ceiling for modelled players. Higher ratings come only from curated overrides. */
  maxModelledOverall: number;
  devTraitThresholds: { xFactor: number; superstar: number; star: number };
  /** A player at or below this age gets potential one tier above the development trait. */
  youngPotentialAge: number;
  defaultArchetype: Record<Position, string>;
  defaultMorale: number;
  defaultFatigue: number;
}

export const RATINGS_CONFIG: RatingsConfig = {
  baseOverall: {
    [Position.QB]: 72, [Position.RB]: 73, [Position.WR]: 73, [Position.TE]: 72, [Position.OL]: 73,
    [Position.DL]: 73, [Position.LB]: 73, [Position.CB]: 73, [Position.S]: 73, [Position.K]: 75
  },
  experienceCurve: [-4, -2, 0, 2, 4, 4, 4, 4, 3],
  peakAge: {
    [Position.QB]: 33, [Position.RB]: 27, [Position.WR]: 29, [Position.TE]: 30, [Position.OL]: 31,
    [Position.DL]: 30, [Position.LB]: 29, [Position.CB]: 29, [Position.S]: 30, [Position.K]: 36
  },
  declinePerYear: 1,
  reserveAdjustment: 0,
  varianceSpread: 6,
  minOverall: 60,
  maxModelledOverall: 88,
  devTraitThresholds: { xFactor: 92, superstar: 86, star: 79 },
  youngPotentialAge: 25,
  defaultArchetype: {
    [Position.QB]: 'Field General', [Position.RB]: 'Elusive Back', [Position.WR]: 'Route Technician',
    [Position.TE]: 'Possession', [Position.OL]: 'Pass Protector', [Position.DL]: 'Power Rusher',
    [Position.LB]: 'Run Stopper', [Position.CB]: 'Zone Corner', [Position.S]: 'Zone Safety', [Position.K]: 'Accurate'
  },
  defaultMorale: 80,
  defaultFatigue: 100
};

export interface ContractConfig {
  /** Modelled average per year (USD millions) for a 99 overall at the position. Game assumption, not league data. */
  topApyM: Record<Position, number>;
  /** Modelled league minimum salary (USD millions). Game assumption, not league data. */
  minimumSalaryM: number;
  /** Overall at which the modelled APY bottoms out at the minimum salary. */
  floorOverall: number;
  ceilingOverall: number;
  /** Curve steepness. Higher values concentrate money in the top ratings. */
  apyExponent: number;
  /** Players with this many accrued seasons or fewer are treated as on a rookie deal. */
  rookieDealMaxExperience: number;
  /** Share of market APY a rookie deal pays. */
  rookieDealApyShare: number;
  rookieDealYears: number;
  /** Contract length by age band, first match wins. */
  yearsByAge: { maxAge: number; years: number }[];
  /** Signing bonus as a share of total value. */
  bonusShare: number;
  /** Guaranteed money as a share of total value. */
  guaranteedShare: number;
}

export const CONTRACT_CONFIG: ContractConfig = {
  topApyM: {
    [Position.QB]: 55, [Position.RB]: 15, [Position.WR]: 32, [Position.TE]: 18, [Position.OL]: 25,
    [Position.DL]: 30, [Position.LB]: 20, [Position.CB]: 25, [Position.S]: 20, [Position.K]: 6
  },
  minimumSalaryM: 0.9,
  floorOverall: 65,
  ceilingOverall: 99,
  apyExponent: 2.2,
  rookieDealMaxExperience: 3,
  rookieDealApyShare: 0.35,
  rookieDealYears: 4,
  yearsByAge: [
    { maxAge: 25, years: 4 },
    { maxAge: 29, years: 3 },
    { maxAge: 32, years: 2 },
    { maxAge: 99, years: 1 }
  ],
  bonusShare: 0.25,
  guaranteedShare: 0.45
};
