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
  yearsLeft: number;
  totalValue: number;
}

export interface ContractDemand {
  years: number;
  salary: number;
  bonus: number;
  interest: 'Security' | 'Money' | 'Championship' | 'Loyalty';
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;
  overall: number;
  morale: number; // 0-100
  fatigue: number; // 0-100 (100 is fresh)
  archetype: string;
  developmentTrait: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  stats: {
    gamesPlayed: number;
    yards: number;
    touchdowns: number;
  };
  contract: Contract;
  contractDemand?: ContractDemand; // If present, open for negotiation
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
  GAMEPLAN = 'GAMEPLAN',
  MATCH = 'MATCH',
  DRAFT = 'DRAFT'
}

export interface DraftProspect {
  id: string;
  name: string;
  position: Position;
  school: string;
  projectedRound: number;
  scoutingGrade: number; // A, B, C etc mapped to number
  combineStats: {
    fortyYard: number;
    bench: number;
  }
}