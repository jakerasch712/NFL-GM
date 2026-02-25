import { Player, Position, Play, DraftProspect, DraftPick, Coach } from './types';

export const TEAMS_DB: Record<string, any> = {
  ARI: { id: 'ARI', city: 'Arizona', name: 'Cardinals', record: '3-4-0', division: 'NFC West', stats: { off: 78, def: 74, st: 72 } },
  ATL: { id: 'ATL', city: 'Atlanta', name: 'Falcons', record: '4-3-0', division: 'NFC South', stats: { off: 84, def: 76, st: 75 } },
  BAL: { id: 'BAL', city: 'Baltimore', name: 'Ravens', record: '5-2-0', division: 'AFC North', stats: { off: 92, def: 88, st: 90 } },
  BUF: { id: 'BUF', city: 'Buffalo', name: 'Bills', record: '4-2-0', division: 'AFC East', stats: { off: 91, def: 78, st: 82 } },
  CAR: { id: 'CAR', city: 'Carolina', name: 'Panthers', record: '1-6-0', division: 'NFC South', stats: { off: 68, def: 70, st: 74 } },
  CHI: { id: 'CHI', city: 'Chicago', name: 'Bears', record: '3-4-0', division: 'NFC North', stats: { off: 76, def: 82, st: 78 } },
  CIN: { id: 'CIN', city: 'Cincinnati', name: 'Bengals', record: '4-3-0', division: 'AFC North', stats: { off: 88, def: 78, st: 76 } },
  CLE: { id: 'CLE', city: 'Cleveland', name: 'Browns', record: '2-5-0', division: 'AFC North', stats: { off: 72, def: 86, st: 74 } },
  DAL: { id: 'DAL', city: 'Dallas', name: 'Cowboys', record: '3-3-0', division: 'NFC East', stats: { off: 86, def: 80, st: 78 } },
  DEN: { id: 'DEN', city: 'Denver', name: 'Broncos', record: '2-4-0', division: 'AFC West', stats: { off: 70, def: 78, st: 72 } },
  DET: { id: 'DET', city: 'Detroit', name: 'Lions', record: '5-1-0', division: 'NFC North', stats: { off: 94, def: 84, st: 80 } },
  GB: { id: 'GB', city: 'Green Bay', name: 'Packers', record: '4-2-0', division: 'NFC North', stats: { off: 86, def: 82, st: 76 } },
  HOU: { id: 'HOU', city: 'Houston', name: 'Texans', record: '5-1-0', division: 'AFC South', stats: { off: 82, def: 88, st: 76 } },
  IND: { id: 'IND', city: 'Indianapolis', name: 'Colts', record: '2-4-0', division: 'AFC South', stats: { off: 78, def: 74, st: 82 } },
  JAX: { id: 'JAX', city: 'Jacksonville', name: 'Jaguars', record: '4-2-0', division: 'AFC South', stats: { off: 80, def: 78, st: 74 } },
  KC: { id: 'KC', city: 'Kansas City', name: 'Chiefs', record: '6-0-0', division: 'AFC West', stats: { off: 96, def: 92, st: 84 } },
  LV: { id: 'LV', city: 'Las Vegas', name: 'Raiders', record: '2-4-0', division: 'AFC West', stats: { off: 72, def: 76, st: 80 } },
  LAC: { id: 'LAC', city: 'LA', name: 'Chargers', record: '3-3-0', division: 'AFC West', stats: { off: 82, def: 84, st: 78 } },
  LAR: { id: 'LAR', city: 'LA', name: 'Rams', record: '3-3-0', division: 'NFC West', stats: { off: 84, def: 72, st: 74 } },
  MIA: { id: 'MIA', city: 'Miami', name: 'Dolphins', record: '3-3-0', division: 'AFC East', stats: { off: 88, def: 74, st: 76 } },
  MIN: { id: 'MIN', city: 'Minnesota', name: 'Vikings', record: '5-1-0', division: 'NFC North', stats: { off: 84, def: 86, st: 78 } },
  NE: { id: 'NE', city: 'New England', name: 'Patriots', record: '1-5-0', division: 'AFC East', stats: { off: 66, def: 76, st: 82 } },
  NO: { id: 'NO', city: 'New Orleans', name: 'Saints', record: '2-5-0', division: 'NFC South', stats: { off: 74, def: 72, st: 78 } },
  NYG: { id: 'NYG', city: 'NY', name: 'Giants', record: '2-4-0', division: 'NFC East', stats: { off: 70, def: 78, st: 74 } },
  NYJ: { id: 'NYJ', city: 'NY', name: 'Jets', record: '2-4-0', division: 'AFC East', stats: { off: 78, def: 88, st: 72 } },
  PHI: { id: 'PHI', city: 'Philadelphia', name: 'Eagles', record: '5-1-0', division: 'NFC East', stats: { off: 88, def: 85, st: 81 } },
  PIT: { id: 'PIT', city: 'Pittsburgh', name: 'Steelers', record: '4-2-0', division: 'AFC North', stats: { off: 72, def: 92, st: 84 } },
  SF: { id: 'SF', city: 'San Francisco', name: '49ers', record: '4-2-0', division: 'NFC West', stats: { off: 92, def: 90, st: 80 } },
  SEA: { id: 'SEA', city: 'Seattle', name: 'Seahawks', record: '3-3-0', division: 'NFC West', stats: { off: 80, def: 76, st: 74 } },
  TB: { id: 'TB', city: 'Tampa Bay', name: 'Buccaneers', record: '4-3-0', division: 'NFC South', stats: { off: 82, def: 78, st: 76 } },
  TEN: { id: 'TEN', city: 'Tennessee', name: 'Titans', record: '1-5-0', division: 'AFC South', stats: { off: 68, def: 74, st: 72 } },
  WAS: { id: 'WAS', city: 'Washington', name: 'Commanders', record: '3-3-0', division: 'NFC East', stats: { off: 80, def: 74, st: 76 } },
};

export const MOCK_PLAYERS: Player[] = [
  { 
    id: '1', name: 'C. Stroud', position: Position.QB, age: 24, overall: 91, schemeOvr: 94, morale: 95, fatigue: 98, archetype: 'Field General', scheme: 'West Coast', developmentTrait: 'X-Factor', 
    stats: { gamesPlayed: 6, yards: 1850, touchdowns: 14, rating: 108.5 },
    contract: { years: 4, salary: 9.5, bonus: 24, guaranteed: 36, yearsLeft: 3, totalValue: 62, capHit: 12.5, deadCap: 18, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'HOU'
  },
  { 
    id: '2', name: 'J. Mixon', position: Position.RB, age: 29, overall: 84, schemeOvr: 82, morale: 88, fatigue: 82, archetype: 'Power Back', scheme: 'Zone', developmentTrait: 'Star', 
    stats: { gamesPlayed: 6, yards: 520, touchdowns: 4 },
    contract: { years: 3, salary: 8.5, bonus: 6, guaranteed: 12, yearsLeft: 2, totalValue: 31.5, capHit: 10.5, deadCap: 4, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'HOU'
  },
  { 
    id: '3', name: 'N. Collins', position: Position.WR, age: 26, overall: 89, schemeOvr: 91, morale: 92, fatigue: 90, archetype: 'Deep Threat', scheme: 'Vertical', developmentTrait: 'Superstar', 
    stats: { gamesPlayed: 6, yards: 680, touchdowns: 6 },
    contract: { years: 4, salary: 14, bonus: 10, guaranteed: 25, yearsLeft: 3, totalValue: 66, capHit: 16.5, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'HOU'
  },
  { 
    id: '4', name: 'T. Dell', position: Position.WR, age: 25, overall: 83, schemeOvr: 85, morale: 85, fatigue: 94, archetype: 'Slot Specialist', scheme: 'West Coast', developmentTrait: 'Star', 
    stats: { gamesPlayed: 5, yards: 410, touchdowns: 3 },
    contract: { years: 4, salary: 1.8, bonus: 2, guaranteed: 4, yearsLeft: 2, totalValue: 9.2, capHit: 2.3, deadCap: 1.5, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'HOU'
  },
  { 
    id: '5', name: 'W. Anderson Jr.', position: Position.DL, age: 24, overall: 94, schemeOvr: 96, morale: 96, fatigue: 91, archetype: 'Speed Rusher', scheme: '4-3 Under', developmentTrait: 'X-Factor', 
    stats: { gamesPlayed: 6, sacks: 7.5, tackles: 24 },
    contract: { years: 4, salary: 8.8, bonus: 22, guaranteed: 34, yearsLeft: 3, totalValue: 57.2, capHit: 14.3, deadCap: 16, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'HOU'
  },
  { 
    id: '6', name: 'D. Stingley Jr.', position: Position.CB, age: 24, overall: 90, schemeOvr: 92, morale: 89, fatigue: 88, archetype: 'Man-to-Man', scheme: 'Press Man', developmentTrait: 'Superstar', 
    stats: { gamesPlayed: 6, interceptions: 3, tackles: 18 },
    contract: { years: 4, salary: 9, bonus: 20, guaranteed: 30, yearsLeft: 1, totalValue: 56, capHit: 14, deadCap: 5, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'HOU'
  },
  { 
    id: '7', name: 'L. Tunsil', position: Position.OL, age: 31, overall: 92, schemeOvr: 92, morale: 90, fatigue: 85, archetype: 'Pass Protector', scheme: 'Zone', developmentTrait: 'Star', 
    stats: { gamesPlayed: 6, sacks: 1 },
    contract: { years: 3, salary: 25, bonus: 15, guaranteed: 45, yearsLeft: 0, totalValue: 90, capHit: 30, deadCap: 10, voidYears: 0, startYear: 2023, totalLength: 3 },
    contractDemand: { years: 3, salary: 26.5, bonus: 18, interest: 'Security', marketValue: 28 },
    teamId: 'HOU'
  },
  {
    id: 'kc1', name: 'P. Mahomes', position: Position.QB, age: 30, overall: 99, schemeOvr: 99, morale: 98, fatigue: 95, archetype: 'Improviser', scheme: 'West Coast', developmentTrait: 'X-Factor',
    stats: { gamesPlayed: 6, yards: 1950, touchdowns: 18 },
    contract: { years: 10, salary: 45, bonus: 60, guaranteed: 140, yearsLeft: 8, totalValue: 450, capHit: 48, deadCap: 80, voidYears: 0, startYear: 2022, totalLength: 10 },
    teamId: 'KC'
  },
  {
    id: 'sf1', name: 'C. McCaffrey', position: Position.RB, age: 29, overall: 98, schemeOvr: 99, morale: 94, fatigue: 85, archetype: 'Receiving Back', scheme: 'Zone', developmentTrait: 'X-Factor',
    stats: { gamesPlayed: 6, yards: 850, touchdowns: 9 },
    contract: { years: 4, salary: 16, bonus: 12, guaranteed: 24, yearsLeft: 2, totalValue: 64, capHit: 19, deadCap: 12, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'SF'
  },
  {
    id: 'bal1', name: 'L. Jackson', position: Position.QB, age: 29, overall: 97, schemeOvr: 95, morale: 96, fatigue: 92, archetype: 'Scrambler', scheme: 'Spread', developmentTrait: 'X-Factor',
    stats: { gamesPlayed: 7, yards: 1650, touchdowns: 12 },
    contract: { years: 5, salary: 52, bonus: 72, guaranteed: 185, yearsLeft: 4, totalValue: 260, capHit: 55, deadCap: 120, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'BAL'
  },
  {
    id: 'phi1', name: 'A.J. Brown', position: Position.WR, age: 28, overall: 95, schemeOvr: 93, morale: 92, fatigue: 90, archetype: 'Physical Receiver', scheme: 'Vertical', developmentTrait: 'Superstar',
    stats: { gamesPlayed: 6, yards: 720, touchdowns: 5 },
    contract: { years: 4, salary: 25, bonus: 20, guaranteed: 50, yearsLeft: 3, totalValue: 100, capHit: 28, deadCap: 35, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'PHI'
  },
  {
    id: 'det1', name: 'A. St. Brown', position: Position.WR, age: 26, overall: 94, schemeOvr: 96, morale: 95, fatigue: 94, archetype: 'Slot Specialist', scheme: 'West Coast', developmentTrait: 'Superstar',
    stats: { gamesPlayed: 6, yards: 680, touchdowns: 6 },
    contract: { years: 4, salary: 28, bonus: 24, guaranteed: 60, yearsLeft: 4, totalValue: 112, capHit: 32, deadCap: 45, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DET'
  },
  {
    id: 'fa1', name: 'Stefon Diggs', position: Position.WR, age: 32, overall: 88, schemeOvr: 88, morale: 75, fatigue: 100, archetype: 'Route Runner', scheme: 'Vertical', developmentTrait: 'Superstar',
    stats: { gamesPlayed: 17, yards: 1180, touchdowns: 8 },
    contract: { years: 1, salary: 18, bonus: 0, guaranteed: 0, yearsLeft: 0, totalValue: 18, capHit: 18, deadCap: 0, voidYears: 0, startYear: 2025, totalLength: 1 },
    contractDemand: { years: 2, salary: 16, bonus: 10, interest: 'Money', marketValue: 19 },
    teamId: 'FA'
  },
  {
    id: 'fa2', name: 'Saquon Barkley', position: Position.RB, age: 29, overall: 90, schemeOvr: 92, morale: 80, fatigue: 100, archetype: 'Elusive Back', scheme: 'Zone', developmentTrait: 'Superstar',
    stats: { gamesPlayed: 14, yards: 1200, touchdowns: 10 },
    contract: { years: 1, salary: 12, bonus: 0, guaranteed: 0, yearsLeft: 0, totalValue: 12, capHit: 12, deadCap: 0, voidYears: 0, startYear: 2025, totalLength: 1 },
    contractDemand: { years: 3, salary: 13, bonus: 15, interest: 'Security', marketValue: 14 },
    teamId: 'FA'
  }
];

export const MOCK_COACHES: Coach[] = [
  {
    id: 'c1', name: 'DeMeco Ryans', role: 'HC', specialty: 'Defense', experience: 3, scheme: '4-3 Under',
    traits: [
      { name: 'Leader of Men', description: 'Boosts morale for the entire team', bonus: { stat: 'overall', value: 1 } }
    ]
  },
  {
    id: 'c2', name: 'Bobby Slowik', role: 'OC', specialty: 'Passing', experience: 2, scheme: 'West Coast',
    traits: [
      { name: 'QB Whisperer', description: 'Boosts QB accuracy and rating', bonus: { stat: 'rating', value: 5 } }
    ]
  }
];

export const DRAFT_CLASS: DraftProspect[] = [
  { 
    id: 'd1', name: 'Arch Manning', position: Position.QB, school: 'Texas', projectedRound: 1, scoutingGrade: 98, 
    combineStats: { fortyYard: 4.6, bench: 12, vertical: 34, broadJump: 120 },
    traits: ['Elite Arm', 'High IQ', 'Legacy']
  },
  { 
    id: 'd2', name: 'Jeremiah Smith', position: Position.WR, school: 'Ohio State', projectedRound: 1, scoutingGrade: 96, 
    combineStats: { fortyYard: 4.32, bench: 15, vertical: 40, broadJump: 132 },
    traits: ['Deep Threat', 'Strong Hands']
  },
  { 
    id: 'd3', name: 'Elijah Brown', position: Position.QB, school: 'Stanford', projectedRound: 2, scoutingGrade: 78, 
    combineStats: { fortyYard: 4.8, bench: 10, vertical: 30, broadJump: 110 },
    traits: ['Accurate', 'Pocket Passer']
  },
  { 
    id: 'd4', name: 'David Stone', position: Position.DL, school: 'Oklahoma', projectedRound: 1, scoutingGrade: 92, 
    combineStats: { fortyYard: 4.9, bench: 32, vertical: 28, broadJump: 105 },
    traits: ['Power Rusher', 'Run Stopper']
  },
  { 
    id: 'd5', name: 'Nyckoles Harbor', position: Position.WR, school: 'South Carolina', projectedRound: 1, scoutingGrade: 90, 
    combineStats: { fortyYard: 4.28, bench: 18, vertical: 42, broadJump: 135 },
    traits: ['Olympic Speed', 'Freak Athlete']
  },
  { 
    id: 'd6', name: 'Will Johnson', position: Position.CB, school: 'Michigan', projectedRound: 1, scoutingGrade: 95, 
    combineStats: { fortyYard: 4.41, bench: 14, vertical: 38, broadJump: 128 },
    traits: ['Shutdown', 'Ball Hawk']
  },
  { 
    id: 'd7', name: 'Kelvin Banks Jr.', position: Position.OL, school: 'Texas', projectedRound: 1, scoutingGrade: 94, 
    combineStats: { fortyYard: 5.1, bench: 28, vertical: 26, broadJump: 100 },
    traits: ['Wall', 'Agile']
  },
];

export const INITIAL_PICKS: DraftPick[] = [
  { round: 1, pickNumber: 1, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 1000 },
  { round: 1, pickNumber: 2, originalTeamId: 'KC', currentTeamId: 'KC', year: 2026, value: 717 },
  { round: 1, pickNumber: 3, originalTeamId: 'SF', currentTeamId: 'SF', year: 2026, value: 514 },
  { round: 2, pickNumber: 33, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 180 },
  { round: 3, pickNumber: 65, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 74 },
];

export const OFFENSIVE_PLAYS: Play[] = [
  { id: 'p1', name: 'Inside Zone', type: 'Run', formation: 'Shotgun', risk: 2, reward: 4, successRate: 0.65 },
  { id: 'p2', name: 'Stretch Right', type: 'Run', formation: 'Singleback', risk: 3, reward: 5, successRate: 0.55 },
  { id: 'p3', name: 'Mesh Spot', type: 'Pass', formation: 'Shotgun Bunch', risk: 3, reward: 5, successRate: 0.70 },
  { id: 'p4', name: 'PA Crossers', type: 'Pass', formation: 'I-Form', risk: 5, reward: 8, successRate: 0.50 },
  { id: 'p5', name: 'Four Verticals', type: 'Pass', formation: 'Empty', risk: 8, reward: 10, successRate: 0.35 },
  { id: 'p6', name: 'HB Screen', type: 'Pass', formation: 'Shotgun', risk: 6, reward: 7, successRate: 0.45 },
];
