import { PlayInput, PlayOutcome } from './types';

interface Rng {
  next: () => number; // 0..1
}

export class SeededRng implements Rng {
  constructor(private seed: number) {}

  next() {
    this.seed = (1664525 * this.seed + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function simulatePlay(input: PlayInput, rng: Rng): PlayOutcome {
  const notes: string[] = [];

  const runnerValue =
    input.ballCarrier.physical.speed * 0.35 +
    input.ballCarrier.physical.agility * 0.25 +
    (input.ballCarrier.positionSkills.routeRunning ?? 50) * 0.15 +
    input.ballCarrier.footballIQ.awareness * 0.25;

  const defenderValue =
    input.tackler.physical.strength * 0.3 +
    input.tackler.physical.agility * 0.2 +
    (input.tackler.positionSkills.tackling ?? 50) * 0.35 +
    input.tackler.footballIQ.playRecognition * 0.15;

  const fatiguePenalty = (input.offenseFatigue - input.defenseFatigue) * 0.12;
  const moraleDelta = (input.offense.morale - input.defense.morale) * 0.08;
  const chemistryDelta = (input.offense.chemistry - input.defense.chemistry) * 0.05;
  const coachingDelta =
    input.offense.coachingModifiers.playSuccessBonus -
    input.defense.coachingModifiers.playSuccessBonus;

  const baseEdge =
    runnerValue - defenderValue + moraleDelta + chemistryDelta + coachingDelta;

  const environmentalDelta = input.weatherImpact - fatiguePenalty;
  const variance = (rng.next() - 0.5) * 14;

  const rawYards = baseEdge * 0.12 + environmentalDelta * 0.1 + variance;
  const yardsGained = Math.round(clamp(rawYards, -8, 60));

  const turnoverRisk = clamp(0.06 - coachingDelta * 0.001 + input.weatherImpact * 0.0015, 0.01, 0.2);
  const penaltyRisk = clamp(0.08 - input.offense.coachingModifiers.disciplineBonus * 0.001, 0.02, 0.18);
  const injuryRisk = clamp(
    0.03 + (input.offenseFatigue / 100) * 0.03 - input.offense.coachingModifiers.injuryReduction * 0.001,
    0.005,
    0.2,
  );

  const turnover = rng.next() < turnoverRisk;
  const penalty = rng.next() < penaltyRisk;
  const injury = rng.next() < injuryRisk;

  if (yardsGained >= 20) notes.push('Explosive play');
  if (yardsGained < 0) notes.push('Play blown up in backfield');
  if (turnover) notes.push('Turnover committed');
  if (penalty) notes.push('Penalty on offense');
  if (injury) notes.push('Potential injury on play');

  const momentumDelta = clamp(
    Math.round(yardsGained * 0.4 + (turnover ? -20 : 0) + (injury ? -6 : 0) + (penalty ? -4 : 0)),
    -25,
    25,
  );

  return {
    yardsGained,
    turnover,
    penalty,
    injury,
    momentumDelta,
    notes,
  };
}

export function runExamplePlay(): PlayOutcome {
  const rng = new SeededRng(2026);
  return simulatePlay(
    {
      down: 1,
      yardsToGo: 10,
      offenseFormation: 'Shotgun Trips',
      defenseAlignment: 'Nickel Over',
      weatherImpact: -2,
      offenseFatigue: 20,
      defenseFatigue: 28,
      ballCarrier: {
        physical: { speed: 90, strength: 74, agility: 88, stamina: 87 },
        footballIQ: { awareness: 82, playRecognition: 75, discipline: 78 },
        positionSkills: { routeRunning: 85 },
        developmentTraits: { workEthic: 88, durability: 80, leadership: 70 },
      },
      tackler: {
        physical: { speed: 84, strength: 86, agility: 80, stamina: 85 },
        footballIQ: { awareness: 79, playRecognition: 83, discipline: 81 },
        positionSkills: { tackling: 87 },
        developmentTraits: { workEthic: 82, durability: 84, leadership: 76 },
      },
      offense: {
        franchiseId: 'offense-team',
        morale: 68,
        chemistry: 70,
        coachingModifiers: { playSuccessBonus: 6, injuryReduction: 4, disciplineBonus: 5 },
      },
      defense: {
        franchiseId: 'defense-team',
        morale: 60,
        chemistry: 66,
        coachingModifiers: { playSuccessBonus: 3, injuryReduction: 5, disciplineBonus: 4 },
      },
    },
    rng,
  );
}
