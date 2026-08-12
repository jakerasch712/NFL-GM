import { InjuryRecord, Player, PlayerInjury } from '../types';

interface InjuryTemplate {
  type: string;
  severity: PlayerInjury['severity'];
  minWeeks: number;
  maxWeeks: number;
  weight: number;
}

// Weighted so most injuries are short; season-enders are rare.
const INJURY_TABLE: InjuryTemplate[] = [
  { type: 'Ankle Sprain', severity: 'Minor', minWeeks: 1, maxWeeks: 2, weight: 20 },
  { type: 'Hamstring Strain', severity: 'Minor', minWeeks: 1, maxWeeks: 3, weight: 18 },
  { type: 'Shoulder Contusion', severity: 'Minor', minWeeks: 1, maxWeeks: 2, weight: 14 },
  { type: 'Concussion Protocol', severity: 'Moderate', minWeeks: 1, maxWeeks: 3, weight: 12 },
  { type: 'High Ankle Sprain', severity: 'Moderate', minWeeks: 3, maxWeeks: 5, weight: 10 },
  { type: 'MCL Sprain', severity: 'Moderate', minWeeks: 3, maxWeeks: 6, weight: 9 },
  { type: 'Broken Hand', severity: 'Moderate', minWeeks: 4, maxWeeks: 6, weight: 6 },
  { type: 'Torn Labrum', severity: 'Severe', minWeeks: 6, maxWeeks: 10, weight: 5 },
  { type: 'Achilles Tear', severity: 'Severe', minWeeks: 12, maxWeeks: 18, weight: 3 },
  { type: 'Torn ACL', severity: 'Severe', minWeeks: 14, maxWeeks: 18, weight: 3 },
];
const TOTAL_WEIGHT = INJURY_TABLE.reduce((s, t) => s + t.weight, 0);

const rollTemplate = (): InjuryTemplate => {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const t of INJURY_TABLE) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return INJURY_TABLE[0];
};

/**
 * `depth` is a rank *within a position group*, so a cutoff like 24 would expose
 * essentially the whole 90-man roster. Only the top few at each position see
 * meaningful snaps.
 */
const CONTRIBUTOR_DEPTH = 4;

/**
 * Tuned so the league sees roughly 12-18 new injuries a week across 32 games,
 * which is in the right order of magnitude for a real NFL week.
 */
const BASE_INJURY_CHANCE = 0.011;

export const isAvailable = (player: Player): boolean => !player.injury || player.injury.weeksOut <= 0;

/**
 * Rolls injuries for the players who took part in a game. `fatigue` is
 * inverted (100 = fresh), so a tired, less durable player is likelier to go
 * down. Only depth-chart contributors are exposed.
 */
export const rollGameInjuries = (
  players: Player[],
  teamIds: string[],
  week: number,
  season: number
): Player[] => {
  const affected = new Set(teamIds);
  return players.map(player => {
    if (!affected.has(player.teamId) || !isAvailable(player)) return player;
    if ((player.depth ?? 99) > CONTRIBUTOR_DEPTH) return player; // deep reserves do not play

    const durability = player.durability ?? 80;
    const fatigueFactor = 1 + (100 - (player.fatigue ?? 100)) / 100;
    const chance = BASE_INJURY_CHANCE * (1 + (85 - durability) / 100) * fatigueFactor;
    if (Math.random() > chance) return player;

    const template = rollTemplate();
    const weeksOut = template.minWeeks + Math.floor(Math.random() * (template.maxWeeks - template.minWeeks + 1));
    return {
      ...player,
      injury: { type: template.type, severity: template.severity, weeksOut, occurredWeek: week, season },
    };
  });
};

/**
 * Ticks every injury clock by one week. Injuries sustained during
 * `completedWeek` are skipped so a "2 weeks out" injury actually costs the
 * player the next two games rather than one.
 */
export const advanceInjuryClocks = (players: Player[], completedWeek: number): Player[] =>
  players.map(player => {
    const injury = player.injury;
    if (!injury) return player;
    if (injury.occurredWeek >= completedWeek) return player;

    const weeksOut = injury.weeksOut - 1;
    if (weeksOut > 0) return { ...player, injury: { ...injury, weeksOut } };

    // Recovered: archive it and clear the active injury
    const record: InjuryRecord = {
      id: `inj-${player.id}-${injury.season}-${injury.occurredWeek}`,
      season: injury.season,
      injury: injury.type,
      weeksOut: injury.weeksOut,
      devImpact: injury.severity === 'Severe' ? 'Development slowed' : 'No lasting impact',
    };
    return {
      ...player,
      injury: undefined,
      injuryHistory: [...(player.injuryHistory ?? []), record],
    };
  });

/** Currently injured players across the league, most severe first. */
export const leagueInjuryReport = (players: Player[], limit = 12): Player[] =>
  players
    .filter(p => p.teamId !== 'FA' && !isAvailable(p))
    .sort((a, b) => {
      const severity = (p: Player) => (p.injury?.severity === 'Severe' ? 2 : p.injury?.severity === 'Moderate' ? 1 : 0);
      return severity(b) - severity(a) || b.overall - a.overall;
    })
    .slice(0, limit);
