import { Player, Position, Play, DraftProspect } from './types';

export const MOCK_PLAYERS: Player[] = [
  { 
    id: '1', name: 'C. Stroud', position: Position.QB, age: 24, overall: 91, morale: 95, fatigue: 98, archetype: 'Field General', developmentTrait: 'X-Factor', 
    stats: { gamesPlayed: 6, yards: 1850, touchdowns: 14 },
    contract: { years: 4, salary: 9.5, bonus: 24, yearsLeft: 3, totalValue: 62 }
  },
  { 
    id: '2', name: 'J. Mixon', position: Position.RB, age: 29, overall: 84, morale: 88, fatigue: 82, archetype: 'Power Back', developmentTrait: 'Star', 
    stats: { gamesPlayed: 6, yards: 520, touchdowns: 4 },
    contract: { years: 3, salary: 8.5, bonus: 6, yearsLeft: 2, totalValue: 31.5 }
  },
  { 
    id: '3', name: 'N. Collins', position: Position.WR, age: 26, overall: 89, morale: 92, fatigue: 90, archetype: 'Deep Threat', developmentTrait: 'Superstar', 
    stats: { gamesPlayed: 6, yards: 680, touchdowns: 6 },
    contract: { years: 4, salary: 14, bonus: 10, yearsLeft: 3, totalValue: 66 }
  },
  { 
    id: '4', name: 'T. Dell', position: Position.WR, age: 25, overall: 83, morale: 85, fatigue: 94, archetype: 'Slot Specialist', developmentTrait: 'Star', 
    stats: { gamesPlayed: 5, yards: 410, touchdowns: 3 },
    contract: { years: 4, salary: 1.8, bonus: 2, yearsLeft: 2, totalValue: 9.2 }
  },
  { 
    id: '5', name: 'W. Anderson Jr.', position: Position.DL, age: 24, overall: 94, morale: 96, fatigue: 91, archetype: 'Speed Rusher', developmentTrait: 'X-Factor', 
    stats: { gamesPlayed: 6, yards: 0, touchdowns: 0 },
    contract: { years: 4, salary: 8.8, bonus: 22, yearsLeft: 3, totalValue: 57.2 }
  },
  { 
    id: '6', name: 'D. Stingley Jr.', position: Position.CB, age: 24, overall: 90, morale: 89, fatigue: 88, archetype: 'Man-to-Man', developmentTrait: 'Superstar', 
    stats: { gamesPlayed: 6, yards: 0, touchdowns: 0 },
    contract: { years: 4, salary: 9, bonus: 20, yearsLeft: 1, totalValue: 56 }
  },
  { 
    id: '7', name: 'L. Tunsil', position: Position.OL, age: 31, overall: 92, morale: 90, fatigue: 85, archetype: 'Pass Protector', developmentTrait: 'Star', 
    stats: { gamesPlayed: 6, yards: 0, touchdowns: 0 },
    contract: { years: 3, salary: 25, bonus: 15, yearsLeft: 0, totalValue: 90 },
    contractDemand: { years: 3, salary: 26.5, bonus: 18, interest: 'Security' }
  },
];

export const OFFENSIVE_PLAYS: Play[] = [
  { id: 'p1', name: 'Inside Zone', type: 'Run', formation: 'Shotgun', risk: 2, reward: 4, successRate: 0.65 },
  { id: 'p2', name: 'Stretch Right', type: 'Run', formation: 'Singleback', risk: 3, reward: 5, successRate: 0.55 },
  { id: 'p3', name: 'Mesh Spot', type: 'Pass', formation: 'Shotgun Bunch', risk: 3, reward: 5, successRate: 0.70 },
  { id: 'p4', name: 'PA Crossers', type: 'Pass', formation: 'I-Form', risk: 5, reward: 8, successRate: 0.50 },
  { id: 'p5', name: 'Four Verticals', type: 'Pass', formation: 'Empty', risk: 8, reward: 10, successRate: 0.35 },
  { id: 'p6', name: 'HB Screen', type: 'Pass', formation: 'Shotgun', risk: 6, reward: 7, successRate: 0.45 },
];

export const DRAFT_CLASS: DraftProspect[] = [
  { id: 'd1', name: 'Arch Manning', position: Position.QB, school: 'Texas', projectedRound: 1, scoutingGrade: 98, combineStats: { fortyYard: 4.6, bench: 12 } },
  { id: 'd2', name: 'Jeremiah Smith', position: Position.WR, school: 'Ohio State', projectedRound: 1, scoutingGrade: 96, combineStats: { fortyYard: 4.32, bench: 15 } },
  { id: 'd3', name: 'Elijah Brown', position: Position.QB, school: 'Stanford', projectedRound: 2, scoutingGrade: 78, combineStats: { fortyYard: 4.8, bench: 10 } },
  { id: 'd4', name: 'David Stone', position: Position.DL, school: 'Oklahoma', projectedRound: 1, scoutingGrade: 92, combineStats: { fortyYard: 4.9, bench: 32 } },
  { id: 'd5', name: 'Nyckoles Harbor', position: Position.WR, school: 'South Carolina', projectedRound: 1, scoutingGrade: 90, combineStats: { fortyYard: 4.28, bench: 18 } },
];