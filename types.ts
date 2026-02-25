export enum Position {
  QB = 'QB',
  RB = 'RB',
  WR = 'WR',
  TE = 'TE',
  OL = 'OL',
  DL = 'DL',
  LB = 'LB',
  CB = 'CB',
  S = 'S',
  K = 'K'
}

export interface Contract {
  years: number;
  salary: number; // Millions per year
  bonus: number; // Total signing bonus (Millions)
  guaranteed: number; // Total guaranteed money
  yearsLeft: number;
  totalValue: number;
  capHit: number;
  deadCap: number;
  voidYears: number; // 0 to 4 years
  startYear: number;
  totalLength: number; // Original length + void years
}

export interface ContractDemand {
  years: number;
  salary: number;
  bonus: number;
  interest: 'Security' | 'Money' | 'Championship' | 'Loyalty';
  marketValue: number; // Millions
}

export interface PlayerStats {
  gamesPlayed: number;
  yards?: number;
  touchdowns?: number;
  completions?: number;
  attempts?: number;
  interceptions?: number;
  receptions?: number;
  tackles?: number;
  sacks?: number;
  forcedFumbles?: number;
  rating?: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;
  overall: number;
  schemeOvr: number; // OVR adjusted for scheme fit
  morale: number; // 0-100
  fatigue: number; // 0-100 (100 is fresh)
  archetype: string;
  scheme: string; // e.g., 'Zone', 'Power', 'Man', 'Cover 2'
  developmentTrait: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  stats: PlayerStats;
  contract: Contract;
  contractDemand?: ContractDemand; 
  teamId: string;
}

export interface StaffTrait {
  name: string;
  description: string;
  bonus: {
    stat: keyof PlayerStats | 'overall';
    value: number;
  };
}

export interface Coach {
  id: string;
  name: string;
  role: 'HC' | 'OC' | 'DC' | 'ST';
  specialty: string;
  traits: StaffTrait[];
  experience: number;
  scheme: string;
}

export interface Play {
  id: string;
  name: string;
  type: 'Pass' | 'Run';
  formation: string;
  risk: number; // 1-10
  reward: number; // 1-10
  successRate: number; // base success %
}

export interface GameEvent {
  description: string;
  yardage: number;
  isScore: boolean;
  type: 'Pass' | 'Run' | 'Turnover' | 'Special';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ROSTER = 'ROSTER',
  FREE_AGENCY = 'FREE_AGENCY',
  TRADE_CENTER = 'TRADE_CENTER',
  GAMEPLAN = 'GAMEPLAN',
  MATCH = 'MATCH',
  DRAFT = 'DRAFT',
  STAFF = 'STAFF',
  SCOUTING = 'SCOUTING'
}

export interface DraftPick {
  round: number;
  pickNumber: number;
  originalTeamId: string;
  currentTeamId: string;
  year: number;
  value: number; // Rich Hill value
}

export interface DraftProspect {
  id: string;
  name: string;
  position: Position;
  school: string;
  projectedRound: number;
  scoutingGrade: number; 
  overall?: number; 
  combineStats: {
    fortyYard: number;
    bench: number;
    vertical?: number;
    broadJump?: number;
  }
  traits: string[];
}
