import { Player, Position } from '../../types';
import { CapEntry, PlayerRatingInput, RosterRecord, TeamRosterSnapshot } from '../../engine/rosterTypes';
import { IMPORT_STATUSES, RATINGS_CONFIG, RatingsConfig, CONTRACT_CONFIG, ContractConfig, PRODUCTION_CONFIG, ProductionConfig } from './config';
import { contractFromCapHit, modelContract } from './contracts';
import { createCapLookup } from './spotrac';
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
 * Modelled overall. Deterministic.
 *
 * 1. Baseline = position base + experience adjustment + age decline + seeded variance.
 * 2. With production data: blend the baseline with a production rating taken from the
 *    player's percentile at the position, weighted by sample size.
 * 3. Add the depth chart adjustment (starter, backup, reserve).
 *
 * Without production or depth data the result is capped at maxModelledOverall, because the
 * baseline alone cannot identify stars.
 */
export function modelOverall(
  record: RosterRecord,
  age: number,
  season: number,
  input: PlayerRatingInput | undefined = undefined,
  config: RatingsConfig = RATINGS_CONFIG,
  production: ProductionConfig = PRODUCTION_CONFIG
): number {
  const curve = config.experienceCurve;
  // Experience adjustment: lookup by accrued seasons, capped at the last curve entry.
  const experienceAdj = curve[Math.min(record.experience, curve.length - 1)];
  // Age decline: declinePerYear for each year past the position peak age.
  const ageAdj = -Math.max(0, age - config.peakAge[record.position]) * config.declinePerYear;
  const statusAdj = record.status === 'reserve' ? config.reserveAdjustment : 0;
  // Seeded variance: uniform in [−spread, +spread], fixed per player and season.
  const variance = (seededUnit(`${record.gsisId}:${season}:overall`) * 2 - 1) * config.varianceSpread;
  const baseline = config.baseOverall[record.position] + experienceAdj + ageAdj + statusAdj + variance;

  const hasProduction = input?.p !== undefined && (input.s ?? 0) > 0;
  let rating = baseline;
  if (hasProduction) {
    // Production rating = floor + (ceiling − floor) × percentile ^ shape.
    const productionRating = production.productionFloor
      + (production.productionCeiling - production.productionFloor) * Math.pow(input!.p!, production.percentileShape);
    // Blend weight = sample weight × productionWeight. Small samples lean on the baseline.
    const weight = input!.s! * production.productionWeight;
    rating = baseline * (1 - weight) + productionRating * weight;
  }

  if (input?.d !== undefined) {
    // Depth adjustment by rank. Positions without box score production (OL) lean harder on depth.
    const table = production.metrics[record.position] ? production.depthAdjustment.withProduction : production.depthAdjustment.withoutProduction;
    rating += table[Math.min(input.d, table.length) - 1];
  }

  const ceiling = hasProduction || input?.d !== undefined ? production.maxOverall : config.maxModelledOverall;
  return Math.round(Math.min(ceiling, Math.max(config.minOverall, rating)));
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
  /** nflverse production and depth chart inputs keyed by gsis ID. */
  ratingInputs?: Record<string, PlayerRatingInput>;
  /** Real cap hits for this team. Wins over curated and modelled contracts. */
  capEntries?: CapEntry[];
  ratingsConfig?: RatingsConfig;
  contractConfig?: ContractConfig;
  productionConfig?: ProductionConfig;
}

/**
 * Normalized snapshot → game players for one team. Pure and deterministic.
 * Depth order: depth chart rank where known, then overall.
 */
export function buildTeamPlayers(snapshot: TeamRosterSnapshot, options: BuildOptions): Player[] {
  const ratingsConfig = options.ratingsConfig ?? RATINGS_CONFIG;
  const contractConfig = options.contractConfig ?? CONTRACT_CONFIG;
  const productionConfig = options.productionConfig ?? PRODUCTION_CONFIG;
  const findCapEntry = createCapLookup(options.capEntries ?? []);
  const depthRank = new Map<string, number>();
  const curatedByName = new Map<string, Player>();
  for (const p of options.curated ?? []) curatedByName.set(normalizeName(p.name), p);

  const players: Player[] = snapshot.records
    .filter(record => IMPORT_STATUSES.includes(record.status))
    .map(record => {
      const curated = curatedByName.get(normalizeName(record.name));
      const fallbackAge = 22 + record.experience;
      const age = ageForSeason(record.birthDate, options.season, fallbackAge);
      const input = options.ratingInputs?.[record.gsisId];
      if (input?.d !== undefined) depthRank.set(record.gsisId, input.d);
      const overall = curated ? curated.overall : modelOverall(record, age, options.season, input, ratingsConfig, productionConfig);
      const developmentTrait = curated ? curated.developmentTrait : devTraitFor(overall, ratingsConfig);
      const potential = curated
        ? curated.potential
        : age <= ratingsConfig.youngPotentialAge
          ? TRAIT_ORDER[Math.min(TRAIT_ORDER.length - 1, TRAIT_ORDER.indexOf(developmentTrait) + 1)]
          : developmentTrait;

      // Contract precedence: real cap hit → curated (only while still on the curated team) → model.
      const contractInput = { gsisId: record.gsisId, position: record.position, overall, age, experience: record.experience, season: options.season };
      const capEntry = findCapEntry(record.name);
      const contractSource: Player['contractSource'] = capEntry ? 'cap_hit' : curated && curated.teamId === snapshot.teamId ? 'curated' : 'modelled';
      const contract = capEntry
        ? contractFromCapHit(contractInput, capEntry.capHitM, contractConfig)
        : contractSource === 'curated' ? curated!.contract : modelContract(contractInput, contractConfig);

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
        contractSource,
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

  // Depth = depth chart rank where known (unknown ranks last), then overall; ties broken by ID so the order is stable.
  const byPosition = new Map<Position, Player[]>();
  for (const p of players) byPosition.set(p.position, [...(byPosition.get(p.position) ?? []), p]);
  for (const group of byPosition.values()) {
    group.sort((a, b) => (depthRank.get(a.id) ?? 99) - (depthRank.get(b.id) ?? 99) || b.overall - a.overall || a.id.localeCompare(b.id));
    group.forEach((p, index) => { p.depth = index + 1; });
  }
  return players;
}
