import { Player, Position, Play, DraftProspect, DraftPick, Coach, CoachArchetype, StaffTrait, Region, Scout } from './types';
import { REAL_NFL_PLAYERS, ensureFullTeamRosters } from './data/nflRosters';

export const TEAMS_DB: Record<string, any> = {
  ARI: { id: 'ARI', city: 'Arizona', name: 'Cardinals', record: '0-0-0', division: 'NFC West', stats: { off: 78, def: 74, st: 72 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
  ATL: { id: 'ATL', city: 'Atlanta', name: 'Falcons', record: '0-0-0', division: 'NFC South', stats: { off: 84, def: 76, st: 75 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
  BAL: { id: 'BAL', city: 'Baltimore', name: 'Ravens', record: '0-0-0', division: 'AFC North', stats: { off: 92, def: 88, st: 90 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
  BUF: { id: 'BUF', city: 'Buffalo', name: 'Bills', record: '0-0-0', division: 'AFC East', stats: { off: 91, def: 78, st: 82 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
  CAR: { id: 'CAR', city: 'Carolina', name: 'Panthers', record: '0-0-0', division: 'NFC South', stats: { off: 68, def: 70, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
  CHI: { id: 'CHI', city: 'Chicago', name: 'Bears', record: '0-0-0', division: 'NFC North', stats: { off: 76, def: 82, st: 78 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  CIN: { id: 'CIN', city: 'Cincinnati', name: 'Bengals', record: '0-0-0', division: 'AFC North', stats: { off: 88, def: 78, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
  CLE: { id: 'CLE', city: 'Cleveland', name: 'Browns', record: '0-0-0', division: 'AFC North', stats: { off: 72, def: 86, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
  DAL: { id: 'DAL', city: 'Dallas', name: 'Cowboys', record: '0-0-0', division: 'NFC East', stats: { off: 86, def: 80, st: 78 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
  DEN: { id: 'DEN', city: 'Denver', name: 'Broncos', record: '0-0-0', division: 'AFC West', stats: { off: 70, def: 78, st: 72 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
  DET: { id: 'DET', city: 'Detroit', name: 'Lions', record: '0-0-0', division: 'NFC North', stats: { off: 94, def: 84, st: 80 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
  GB: { id: 'GB', city: 'Green Bay', name: 'Packers', record: '0-0-0', division: 'NFC North', stats: { off: 86, def: 82, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
  HOU: { id: 'HOU', city: 'Houston', name: 'Texans', record: '0-0-0', division: 'AFC South', stats: { off: 82, def: 88, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
  IND: { id: 'IND', city: 'Indianapolis', name: 'Colts', record: '0-0-0', division: 'AFC South', stats: { off: 78, def: 74, st: 82 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
  JAX: { id: 'JAX', city: 'Jacksonville', name: 'Jaguars', record: '0-0-0', division: 'AFC South', stats: { off: 80, def: 78, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
  KC: { id: 'KC', city: 'Kansas City', name: 'Chiefs', record: '0-0-0', division: 'AFC West', stats: { off: 96, def: 92, st: 84 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
  LV: { id: 'LV', city: 'Las Vegas', name: 'Raiders', record: '0-0-0', division: 'AFC West', stats: { off: 72, def: 76, st: 80 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
  LAC: { id: 'LAC', city: 'LA', name: 'Chargers', record: '0-0-0', division: 'AFC West', stats: { off: 82, def: 84, st: 78 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
  LAR: { id: 'LAR', city: 'LA', name: 'Rams', record: '0-0-0', division: 'NFC West', stats: { off: 84, def: 72, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
  MIA: { id: 'MIA', city: 'Miami', name: 'Dolphins', record: '0-0-0', division: 'AFC East', stats: { off: 88, def: 74, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
  MIN: { id: 'MIN', city: 'Minnesota', name: 'Vikings', record: '0-0-0', division: 'NFC North', stats: { off: 84, def: 86, st: 78 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
  NE: { id: 'NE', city: 'New England', name: 'Patriots', record: '0-0-0', division: 'AFC East', stats: { off: 66, def: 76, st: 82 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
  NO: { id: 'NO', city: 'New Orleans', name: 'Saints', record: '0-0-0', division: 'NFC South', stats: { off: 74, def: 72, st: 78 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
  NYG: { id: 'NYG', city: 'NY', name: 'Giants', record: '0-0-0', division: 'NFC East', stats: { off: 70, def: 78, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
  NYJ: { id: 'NYJ', city: 'NY', name: 'Jets', record: '0-0-0', division: 'AFC East', stats: { off: 78, def: 88, st: 72 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
  PHI: { id: 'PHI', city: 'Philadelphia', name: 'Eagles', record: '0-0-0', division: 'NFC East', stats: { off: 88, def: 85, st: 81 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
  PIT: { id: 'PIT', city: 'Pittsburgh', name: 'Steelers', record: '0-0-0', division: 'AFC North', stats: { off: 72, def: 92, st: 84 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  SF: { id: 'SF', city: 'San Francisco', name: '49ers', record: '0-0-0', division: 'NFC West', stats: { off: 92, def: 90, st: 80 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
  SEA: { id: 'SEA', city: 'Seattle', name: 'Seahawks', record: '0-0-0', division: 'NFC West', stats: { off: 80, def: 76, st: 74 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
  TB: { id: 'TB', city: 'Tampa Bay', name: 'Buccaneers', record: '0-0-0', division: 'NFC South', stats: { off: 82, def: 78, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
  TEN: { id: 'TEN', city: 'Tennessee', name: 'Titans', record: '0-0-0', division: 'AFC South', stats: { off: 68, def: 74, st: 72 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
  WAS: { id: 'WAS', city: 'Washington', name: 'Commanders', record: '0-0-0', division: 'NFC East', stats: { off: 80, def: 74, st: 76 }, logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
};


export const MOCK_PLAYERS: Player[] = ensureFullTeamRosters(REAL_NFL_PLAYERS);

const NAMED_COACHES: Coach[] = [
  {
    id: 'c1', name: 'DeMeco Ryans', role: 'HC', specialty: 'Defense', archetype: 'The Mercenary', experience: 3, scheme: '4-3 Under', teamId: 'HOU',
    traits: [
      { name: 'Leader of Men', description: 'Boosts morale for the entire team', bonus: { stat: 'overall', value: 1 } }
    ]
  },
  {
    id: 'c2', name: 'Bobby Slowik', role: 'OC', specialty: 'Passing', archetype: 'The Innovator', experience: 2, scheme: 'West Coast', teamId: 'HOU',
    traits: [
      { name: 'QB Whisperer', description: 'Boosts QB accuracy and rating', bonus: { stat: 'rating', value: 5 } }
    ]
  }
];

// Every franchise needs a staff, otherwise 31 of 32 teams open the Staff view
// to an empty directory. Generated deterministically from the team id.
const STAFF_TEMPLATE: { role: Coach['role']; specialty: string; archetype: CoachArchetype; scheme: string; trait: StaffTrait }[] = [
  {
    role: 'HC', specialty: 'Program Management', archetype: 'The Architect', scheme: 'Balanced',
    trait: { name: 'Program Builder', description: 'Steady development across the roster', bonus: { stat: 'overall', value: 1 } }
  },
  {
    role: 'OC', specialty: 'Offense', archetype: 'The Innovator', scheme: 'West Coast',
    trait: { name: 'Play Designer', description: 'Improves offensive efficiency', bonus: { stat: 'yards', value: 5 } }
  },
  {
    role: 'DC', specialty: 'Defense', archetype: 'The Conservative', scheme: '4-3 Under',
    trait: { name: 'Front Seven Guru', description: 'Improves pass rush production', bonus: { stat: 'sacks', value: 2 } }
  },
  {
    role: 'ST', specialty: 'Special Teams', archetype: 'The Conservative', scheme: 'Standard',
    trait: { name: 'Hidden Yardage', description: 'Improves field position battles', bonus: { stat: 'overall', value: 1 } }
  },
];

const COACH_SURNAMES = [
  'Callahan', 'Whitfield', 'Brennan', 'Okafor', 'Delgado', 'MacLeod', 'Vasquez', 'Sinclair',
  'Rutherford', 'Nakamura', 'Ellington', 'Barlow', 'Kowalski', 'Ferreira', 'Ashcroft', 'Duval',
];
const COACH_FIRST_NAMES = [
  'Marcus', 'Dean', 'Elliot', 'Terrance', 'Vince', 'Sam', 'Gary', 'Ronnie',
  'Curtis', 'Wes', 'Andre', 'Lionel', 'Grant', 'Miles', 'Trent', 'Rico',
];

const buildDefaultStaff = (): Coach[] => {
  const staff: Coach[] = [];
  Object.keys(TEAMS_DB).forEach((teamId, teamIdx) => {
    STAFF_TEMPLATE.forEach((tpl, roleIdx) => {
      // Houston keeps its hand-written staff for HC/OC
      if (NAMED_COACHES.some(c => c.teamId === teamId && c.role === tpl.role)) return;
      const seed = teamIdx * STAFF_TEMPLATE.length + roleIdx;
      staff.push({
        id: `coach-${teamId}-${tpl.role}`,
        name: `${COACH_FIRST_NAMES[seed % COACH_FIRST_NAMES.length]} ${COACH_SURNAMES[(seed * 7) % COACH_SURNAMES.length]}`,
        role: tpl.role,
        specialty: tpl.specialty,
        archetype: tpl.archetype,
        traits: [tpl.trait],
        experience: 2 + (seed % 12),
        scheme: tpl.scheme,
        teamId,
      });
    });
  });
  return staff;
};

export const MOCK_COACHES: Coach[] = [...NAMED_COACHES, ...buildDefaultStaff()];

export const DRAFT_CLASS: DraftProspect[] = [
  { 
    id: 'd1', name: 'Arch Manning', position: Position.QB, school: 'Texas', region: Region.SOUTH, projectedRound: 1, scoutingGrade: 98, 
    potential: 'S', scoutingProgress: 0, hiddenTraits: ['Legacy', 'Clutch'],
    combineStats: { fortyYard: 4.6, bench: 12, vertical: 34, broadJump: 120 },
    traits: ['Elite Arm', 'High IQ']
  },
  { 
    id: 'd2', name: 'Jeremiah Smith', position: Position.WR, school: 'Ohio State', region: Region.MIDWEST, projectedRound: 1, scoutingGrade: 96, 
    potential: 'A', scoutingProgress: 0, hiddenTraits: ['Route King', 'Strong Hands'],
    combineStats: { fortyYard: 4.32, bench: 15, vertical: 40, broadJump: 132 },
    traits: ['Deep Threat']
  },
  { 
    id: 'd3', name: 'Elijah Brown', position: Position.QB, school: 'Stanford', region: Region.WEST, projectedRound: 2, scoutingGrade: 78, 
    potential: 'B', scoutingProgress: 0, hiddenTraits: ['Pocket Presence'],
    combineStats: { fortyYard: 4.8, bench: 10, vertical: 30, broadJump: 110 },
    traits: ['Accurate']
  },
  { 
    id: 'd4', name: 'David Stone', position: Position.DL, school: 'Oklahoma', region: Region.SOUTH, projectedRound: 1, scoutingGrade: 92, 
    potential: 'A', scoutingProgress: 0, hiddenTraits: ['Run Wall'],
    combineStats: { fortyYard: 4.9, bench: 32, vertical: 28, broadJump: 105 },
    traits: ['Power Rusher']
  },
  { 
    id: 'd5', name: 'Nyckoles Harbor', position: Position.WR, school: 'South Carolina', region: Region.SOUTH, projectedRound: 1, scoutingGrade: 90, 
    potential: 'S', scoutingProgress: 0, hiddenTraits: ['Unstoppable Speed'],
    combineStats: { fortyYard: 4.28, bench: 18, vertical: 42, broadJump: 135 },
    traits: ['Freak Athlete']
  },
  { 
    id: 'd6', name: 'Will Johnson', position: Position.CB, school: 'Michigan', region: Region.MIDWEST, projectedRound: 1, scoutingGrade: 95, 
    potential: 'A', scoutingProgress: 0, hiddenTraits: ['Lockdown'],
    combineStats: { fortyYard: 4.41, bench: 14, vertical: 38, broadJump: 128 },
    traits: ['Ball Hawk']
  },
  { 
    id: 'd7', name: 'Kelvin Banks Jr.', position: Position.OL, school: 'Texas', region: Region.SOUTH, projectedRound: 1, scoutingGrade: 94, 
    potential: 'A', scoutingProgress: 0, hiddenTraits: ['Agile Wall'],
    combineStats: { fortyYard: 5.1, bench: 28, vertical: 26, broadJump: 100 },
    traits: ['Wall']
  },
];

export const MOCK_SCOUTS: Scout[] = [
  { id: 's1', name: 'Mel Kiper Jr.', level: 3, specialty: Position.QB, regionExpertise: Region.SOUTH, salary: 0.5 },
  { id: 's2', name: 'Todd McShay', level: 2, specialty: 'General', regionExpertise: Region.MIDWEST, salary: 0.3 },
  { id: 's3', name: 'Daniel Jeremiah', level: 3, specialty: Position.WR, regionExpertise: Region.WEST, salary: 0.45 },
];

export const INITIAL_PICKS: DraftPick[] = [
  { id: 'p1-1', round: 1, pickNumber: 1, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 1000 },
  { id: 'p1-2', round: 1, pickNumber: 2, originalTeamId: 'KC', currentTeamId: 'KC', year: 2026, value: 717 },
  { id: 'p1-3', round: 1, pickNumber: 3, originalTeamId: 'SF', currentTeamId: 'SF', year: 2026, value: 514 },
  { id: 'p2-33', round: 2, pickNumber: 33, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 180 },
  { id: 'p3-65', round: 3, pickNumber: 65, originalTeamId: 'HOU', currentTeamId: 'HOU', year: 2026, value: 74 },
];

export const OFFENSIVE_PLAYS: Play[] = [
  { id: 'p1', name: 'Inside Zone', type: 'Run', formation: 'Shotgun', risk: 2, reward: 4, successRate: 0.65 },
  { id: 'p2', name: 'Stretch Right', type: 'Run', formation: 'Singleback', risk: 3, reward: 5, successRate: 0.55 },
  { id: 'p3', name: 'Mesh Spot', type: 'Pass', formation: 'Shotgun Bunch', risk: 3, reward: 5, successRate: 0.70 },
  { id: 'p4', name: 'PA Crossers', type: 'Pass', formation: 'I-Form', risk: 5, reward: 8, successRate: 0.50 },
  { id: 'p5', name: 'Four Verticals', type: 'Pass', formation: 'Empty', risk: 8, reward: 10, successRate: 0.35 },
  { id: 'p6', name: 'HB Screen', type: 'Pass', formation: 'Shotgun', risk: 6, reward: 7, successRate: 0.45 },
  { id: 'p7', name: 'Field Goal', type: 'Special', formation: 'Kicking', risk: 2, reward: 3, successRate: 0.85 },
  { id: 'p8', name: 'Punt', type: 'Special', formation: 'Punting', risk: 1, reward: 0, successRate: 0.95 },
];
