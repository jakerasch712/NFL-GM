export type Rating = number; // 0-100

export interface PlayerRatings {
  physical: {
    speed: Rating;
    strength: Rating;
    agility: Rating;
    stamina: Rating;
  };
  footballIQ: {
    awareness: Rating;
    playRecognition: Rating;
    discipline: Rating;
  };
  positionSkills: {
    throwingPower?: Rating;
    routeRunning?: Rating;
    passBlocking?: Rating;
    tackling?: Rating;
  };
  developmentTraits: {
    workEthic: Rating;
    durability: Rating;
    leadership: Rating;
  };
}

export interface TeamContext {
  franchiseId: string;
  morale: number; // 0-100
  chemistry: number; // 0-100
  coachingModifiers: {
    playSuccessBonus: number;
    injuryReduction: number;
    disciplineBonus: number;
  };
}

export interface PlayInput {
  down: 1 | 2 | 3 | 4;
  yardsToGo: number;
  offenseFormation: string;
  defenseAlignment: string;
  weatherImpact: number; // -20..+20
  offenseFatigue: number; // 0..100
  defenseFatigue: number; // 0..100
  ballCarrier: PlayerRatings;
  tackler: PlayerRatings;
  offense: TeamContext;
  defense: TeamContext;
}

export interface PlayOutcome {
  yardsGained: number;
  turnover: boolean;
  penalty: boolean;
  injury: boolean;
  momentumDelta: number;
  notes: string[];
}
