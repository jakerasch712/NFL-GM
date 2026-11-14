import { Player, Position } from '../../types';
import { RosterRecord, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { IMPORT_STATUSES, RATINGS_CONFIG, RatingsConfig, CONTRACT_CONFIG, ContractConfig } from './config';
import { modelContract } from './contracts';
import { seededUnit } from './seed';

export const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '').replace(/[^a-z]/g, '');

/** Whole years between the birth date and 1 September of the season (the season reference date). */
export function ageForSeason(birthDate: string | null, season: number, fallbackAge: number): number {
  if (!birthDate) return fallbackAge;
  const [year, month, day] = birthDate.split('-').map(Number);
  const hadBirthday = month < 9 || (month === 9 && day <= 1);
  return season - year - (hadBirthday ? 0 : 1);
}

/**
 * Modelled overall. Deterministic: position baseline + experience + age decline + seeded variance.
 * It has no production data behind it, so it separates veterans from rookies but cannot
 * identify stars. Curated overrides supply star ratings.
 */
export function modelOverall(record: RosterRecord, age: number, season: number, config: RatingsConfig = RATINGS_CONFIG): number {
  const curve = config.experienceCurve;
  // Experience adjustment: lookup by accrued seasons, capped at the last curve entry.
  const experienceAdj = curve[Math.min(record.experience, curve.length - 1)];
  // Age decline: declinePerYear for each year past the position peak age.
  const ageAdj = -Math.max(0, age - config.peakAge[record.position]) * config.declinePerYear;
  const statusAdj = record.status === 'reserve' ? config.reserveAdjustment : 0;
  // Seeded variance: uniform in [−spread, +spread], fixed per player and season.
  const variance = (seededUnit(`${record.gsisId}:${season}:overall`) * 2 - 1) * config.varianceSpread;

  const raw = config.baseOverall[record.position] + experienceAdj + ageAdj + statusAdj + variance;
  return Math.round(Math.min(config.maxModelledOverall, Math.max(config.minOverall, raw)));
}

type DevTrait = Player['developmentTrait'];
const TRAIT_ORDER: DevTrait[] = ['Normal', 'Star', 'Superstar', 'X-Factor'];

function devTraitFor(overall: number, config: RatingsConfig): DevTrait {
  const t = config.devTraitThresholds;
  return overall >= t.xFactor ? 'X-Factor' : overall >= t.superstar ? 'Superstar' : overall >= t.star ? 'Star' : 'Normal';
}

export interface BuildOptions {
  /** Season used for age, seeding and contract years. */
  season: number;
  /** Hand tuned players. Matched by normalized name; their ratings win over the model. */
  curated?: Player[];
  ratingsConfig?: RatingsConfig;
  contractConfig?: ContractConfig;
}

/**
 * Normalized snapshot → game players for one team. Pure and deterministic.
 * Depth is the rank by overall within each position (the provider has no depth order).
 */
export function buildTeamPlayers(snapshot: TeamRosterSnapshot, options: BuildOptions): Player[] {
  const ratingsConfig = options.ratingsConfig ?? RATINGS_CONFIG;
  const contractConfig = options.contractConfig ?? CONTRACT_CONFIG;
  const curatedByName = new Map<string, Player>();
  for (const p of options.curated ?? []) curatedByName.set(normalizeName(p.name), p);

  const players: Player[] = snapshot.records
    .filter(record => IMPORT_STATUSES.includes(record.status))
    .map(record => {
      const curated = curatedByName.get(normalizeName(record.name));
      const fallbackAge = 22 + record.experience;
      const age = ageForSeason(record.birthDate, options.season, fallbackAge);
      const overall = curated ? curated.overall : modelOverall(record, age, options.season, ratingsConfig);
      const developmentTrait = curated ? curated.developmentTrait : devTraitFor(overall, ratingsConfig);
      const potential = curated
        ? curated.potential
        : age <= ratingsConfig.youngPotentialAge
          ? TRAIT_ORDER[Math.min(TRAIT_ORDER.length - 1, TRAIT_ORDER.indexOf(developmentTrait) + 1)]
          : developmentTrait;

      // A curated contract is kept only while the player is still on the curated team.
      const contract = curated && curated.teamId === snapshot.teamId
        ? curated.contract
        : modelContract({ gsisId: record.gsisId, position: record.position, overall, age, experience: record.experience, season: options.season }, contractConfig);

      return {
        id: record.gsisId,
        gsisId: record.gsisId,
        name: record.name,
        position: record.position,
        age,
        overall,
        schemeOvr: curated ? curated.schemeOvr : overall,
        morale: curated ? curated.morale : ratingsConfig.defaultMorale,
        fatigue: ratingsConfig.defaultFatigue,
        archetype: curated ? curated.archetype : ratingsConfig.defaultArchetype[record.position],
        personality: curated ? curated.personality : 'Normal',
        scheme: curated ? curated.scheme : 'Balanced',
        developmentTrait,
        potential,
        stats: curated ? curated.stats : { gamesPlayed: 0 },
        contract,
        teamId: snapshot.teamId,
        jerseyNumber: record.jerseyNumber ?? undefined,
        rosterStatus: record.status === 'reserve' ? 'reserve' : 'active',
        headshotUrl: record.headshotUrl ?? undefined,
        college: record.college ?? undefined,
        heightIn: record.heightIn ?? undefined,
        weightLb: record.weightLb ?? undefined,
        experience: record.experience,
        dataSource: 'live'
      } satisfies Player;
    });

  // Depth = rank by overall within the position; ties broken by ID so the order is stable.
  const byPosition = new Map<Position, Player[]>();
  for (const p of players) byPosition.set(p.position, [...(byPosition.get(p.position) ?? []), p]);
  for (const group of byPosition.values()) {
    group.sort((a, b) => b.overall - a.overall || a.id.localeCompare(b.id));
    group.forEach((p, index) => { p.depth = index + 1; });
  }
  return players;
}
