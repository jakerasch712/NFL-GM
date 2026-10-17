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
  proBowls?: number;
  allPro?: number;
  careerYards?: number;
  careerTouchdowns?: number;
  careerSacks?: number;
  careerProBowls?: number;
}

export interface CareerMilestone {
  id: string;
  year: number;
  title: string;
  category: 'AWARD' | 'RECORD' | 'HONOR' | 'CHAMPIONSHIP';
  description: string;
  metric?: string;
  value?: number;
  threshold?: number;
  isAchieved?: boolean;
}

export interface InjuryRecord {
  id: string;
  season: number;
  injury: string;
  weeksOut: number;
  devImpact: string;
}

export type PlayerPersonality = 'Gunslinger' | 'Mercenary' | 'Workhorse' | 'Ring Chaser' | 'The Diva' | 'Leader' | 'Normal';

export interface PlayerAttributes {
  // Physical & Athleticism
  speed: number;
  acceleration: number;
  strength: number;
  agility: number;
  awareness: number;
  stamina: number;
  toughness: number;

  // Passing (QB)
  throwPower?: number;
  shortAccuracy?: number;
  mediumAccuracy?: number;
  deepAccuracy?: number;
  throwOnRun?: number;
  playAction?: number;

  // Rushing & Ball Carrier (RB, WR, TE, QB)
  carrying?: number;
  breakTackle?: number;
  trucking?: number;
  elusiveness?: number;
  bcVision?: number;

  // Receiving & Route Running (WR, TE, RB)
  catching?: number;
  catchInTraffic?: number;
  shortRouteRunning?: number;
  mediumRouteRunning?: number;
  deepRouteRunning?: number;
  release?: number;
  spectacularCatch?: number;

  // Blocking (OL, TE, FB)
  passBlock?: number;
  runBlock?: number;
  impactBlock?: number;
  passBlockPower?: number;
  passBlockFinesse?: number;
  runBlockPower?: number;
  runBlockFinesse?: number;

  // Defense & Pass Rush (DL, LB, CB, S)
  tackle?: number;
  hitPower?: number;
  blockShedding?: number;
  powerMoves?: number;
  finesseMoves?: number;
  pursuit?: number;
  playRecognition?: number;
  manCoverage?: number;
  zoneCoverage?: number;
  press?: number;

  // Specialists (K, P)
  kickPower?: number;
  kickAccuracy?: number;
}

export interface MoraleFactor {
  id: string;
  label: string;
  impact: number; // e.g. +12, -8
  type: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ProgressionHistoryEntry {
  id: string;
  week: number;
  season: number;
  type: 'TRAINING' | 'GAME_PERFORMANCE' | 'AGE_REGRESSION' | 'BREAKOUT' | 'MORALE_BOOST' | 'SKILL_POINT';
  title: string;
  description: string;
  statChanges: string[];
  date: string;
}

export interface BreakoutOpportunity {
  id: string;
  title: string;
  position: Position;
  currentDev: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  targetDev: 'Star' | 'Superstar' | 'X-Factor';
  objective: string;
  currentProgress: number;
  targetProgress: number;
  statRequirement: string;
  weeksRemaining: number;
  isCompleted: boolean;
}

export interface ArchetypeUpgradePackage {
  name: string;
  cost: number; // skill points (usually 1)
  description: string;
  boosts: {
    attribute: keyof PlayerAttributes;
    label: string;
    increase: number;
  }[];
}

export interface ProgressionWeekSummary {
  week: number;
  season: number;
  leveledUpPlayers: {
    player: Player;
    oldOvr: number;
    newOvr: number;
    skillPointsGained: number;
  }[];
  trainingHighlights: {
    playerName: string;
    position: Position;
    focus: string;
    xpGained: number;
  }[];
  breakoutEvents: {
    playerName: string;
    position: Position;
    oldDev: string;
    newDev: string;
    headline: string;
  }[];
  regressedVeterans: {
    playerName: string;
    age: number;
    position: Position;
    attributeLosses: string[];
  }[];
  moraleShifts: {
    playerName: string;
    position: Position;
    oldMorale: number;
    newMorale: number;
    reason: string;
  }[];
  retiredPlayers?: {
    player: Player;
    age: number;
    position: Position;
    reason: string;
    seasonsPlayed: number;
    careerHighlights: string[];
    hallOfFameEligible: boolean;
  }[];
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
  personality: PlayerPersonality;
  scheme: string; // e.g., 'Zone', 'Power', 'Man', 'Cover 2'
  developmentTrait: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  potential: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  stats: PlayerStats;
  contract: Contract;
  contractDemand?: ContractDemand; 
  teamId: string;
  depth?: number;
  trainingFocus?: string;
  trendDirection?: 'increasing' | 'stable' | 'decreasing';
  trendDelta?: number;
  durability?: number; // 0-100
  injuryHistory?: InjuryRecord[];
  milestones?: CareerMilestone[];
  // Dynamic Progression & Morale Fields
  attributes?: PlayerAttributes;
  xp?: number; // 0 to 1000 per level
  xpToNextLevel?: number;
  skillPoints?: number;
  moraleFactors?: MoraleFactor[];
  progressionHistory?: ProgressionHistoryEntry[];
  breakoutOpportunity?: BreakoutOpportunity;
  recentPerformanceRating?: number; // 0-100 based on game impact
  careerPhase?: 'Ascending' | 'Prime' | 'Veteran' | 'Declining';
}

export interface Team {
  id: string;
  city: string;
  name: string;
  record: string;
  division: string;
  stats: {
    off: number;
    def: number;
    st: number;
  };
  logo: string;
  primaryColor?: string;
  secondaryColor?: string;
  fanApproval?: number; // 0-100
  ownerApproval?: number; // 0-100
}

export interface ScheduleMatch {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  isCompleted: boolean;
  score?: {
    home: number;
    away: number;
  };
}

export interface StaffTrait {
  name: string;
  description: string;
  bonus: {
    stat: keyof PlayerStats | 'overall';
    value: number;
  };
}

export type CoachArchetype = 'The Architect' | 'The Mercenary' | 'The Conservative' | 'The Innovator';

export interface Coach {
  id: string;
  name: string;
  role: 'HC' | 'OC' | 'DC' | 'ST';
  specialty: string;
  archetype: CoachArchetype;
  traits: StaffTrait[];
  experience: number;
  scheme: string;
  teamId: string;
}

export interface Play {
  id: string;
  name: string;
  type: 'Pass' | 'Run' | 'Special';
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

export enum LeaguePhase {
  TRAINING_CAMP = 'TRAINING_CAMP',
  PRESEASON = 'PRESEASON',
  REGULAR_SEASON = 'REGULAR_SEASON',
  PLAYOFFS = 'PLAYOFFS',
  SUPER_BOWL = 'SUPER_BOWL',
  OFFSEASON_FA = 'OFFSEASON_FA',
  OFFSEASON_DRAFT = 'OFFSEASON_DRAFT'
}

export type DifficultyTier = 'Casual' | 'Simulation' | 'Hardcore';

export interface LeagueState {
  currentPhase: LeaguePhase;
  week: number;
  year: number;
  salaryCap: number;
  difficulty: DifficultyTier;
}

export enum AppView {
  TEAM_SELECTION = 'TEAM_SELECTION',
  COACH_OFFICE = 'COACH_OFFICE',
  DASHBOARD = 'DASHBOARD',
  ROSTER = 'ROSTER',
  FREE_AGENCY = 'FREE_AGENCY',
  TRADE_CENTER = 'TRADE_CENTER',
  GAMEPLAN = 'GAMEPLAN',
  MATCH = 'MATCH',
  DRAFT = 'DRAFT',
  STAFF = 'STAFF',
  SCOUTING = 'SCOUTING',
  HALL_OF_FAME = 'HALL_OF_FAME'
}

export interface HallOfFamer {
  id: string;
  name: string;
  position: Position;
  inductionYear: number;
  primaryTeam: string;
  seasonsPlayed: number;
  superBowlRings: number;
  proBowls: number;
  allProSelections: number;
  mvpAwards: number;
  careerStats: {
    label: string;
    value: string;
  }[];
  legacyScore: number;
  keyHighlights: string[];
  quote: string;
  avatarUrl?: string;
}

export interface HighlightPackage {
  headline: string;
  commentary: string[];
  videoPrompt?: string;
  topPlay?: string;
  videoUrl?: string | null;
  videoStatus?: string;
}

export enum Region {
  WEST = 'West',
  MIDWEST = 'Midwest',
  SOUTH = 'South',
  NORTHEAST = 'Northeast',
  INTERNATIONAL = 'International'
}

export interface Scout {
  id: string;
  name: string;
  level: number; // 1-3
  specialty: Position | 'General';
  regionExpertise: Region;
  salary: number;
  assignment?: ScoutingAssignment;
}

export interface ScoutingAssignment {
  region: Region;
  focus: Position | 'General';
  progress: number; // 0-100
}

export interface DraftPick {
  id: string;
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
  region: Region;
  projectedRound: number;
  scoutingGrade: number; 
  overall?: number; 
  potential: 'D' | 'C' | 'B' | 'A' | 'S'; // Hidden until scouted
  combineStats: {
    fortyYard: number;
    bench: number;
    vertical?: number;
    broadJump?: number;
  }
  traits: string[];
  hiddenTraits: string[]; // Revealed by scouting
  scoutingProgress: number; // 0-100
  deepScoutingUnlocked?: boolean;
  deepTraits?: string[];
  interviewNotes?: string;
  interviewStatus?: 'NONE' | 'SCHEDULED' | 'COMPLETED';
}

export interface TradeRecord {
  id: string;
  date: string;
  myTeamId: string;
  targetTeamId: string;
  myTeamName: string;
  targetTeamName: string;
  sentAssets: string[];
  receivedAssets: string[];
  fairness: string;
  valueDelta: number;
}

export type PositionGroup = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'ST';

export interface PositionGroupFocus {
  group: PositionGroup;
  focus: string;
  intensity: 'Low' | 'Medium' | 'High';
}

export interface PlayerDevFocus {
  playerId: string;
  focusArea: string;
  progress: number;
}

// ==========================================
// NFL HEAD COACH 2009 AUTHENTIC SYSTEM TYPES
// ==========================================

export type CoachSkillBranch = 'Tactician' | 'Motivator' | 'Scout' | 'Disciplinarian' | 'Strategist';

export interface CoachSkill {
  id: string;
  name: string;
  branch: CoachSkillBranch;
  tier: 1 | 2 | 3;
  cost: number; // In Coach Points (CP)
  description: string;
  perkDescription: string;
  isUnlocked: boolean;
  iconName: string;
}

export interface CoachPhilosophy {
  runPassRatio: number; // 0 (100% Run) to 100 (100% Pass)
  passDepth: 'Short' | 'Medium' | 'Deep';
  blitzFrequency: number; // 0 to 100%
  fourthDownAggressiveness: number; // 0 (conservative punt) to 100 (always go for it)
  offensiveTempo: 'Chew Clock' | 'Normal' | 'No Huddle';
  offensiveScheme: 'West Coast' | 'Air Coryell' | 'Smashmouth Power' | 'Spread Option' | 'Pistol';
  defensiveScheme: 'Base 4-3' | '3-4 Under' | 'Cover 2 Tampa' | 'Cover 3 Press' | 'Aggressive 46';
  qbDecisionMaking: 'Careful Checkdown' | 'Balanced' | 'Gunslinger';
  playerRotationFatigueThreshold: number; // e.g. 75 fatigue
}

export type WeeklyDayType = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WeeklyAgendaActivity {
  day: WeeklyDayType;
  dayLabel: string;
  title: string;
  subtitle: string;
  category: 'FILM_ROOM' | 'STAFF_MEETING' | 'OFFENSE_INSTALL' | 'DEFENSE_INSTALL' | 'SPECIAL_TEAMS' | 'PREGAME_SPEECH' | 'GAMEDAY';
  isCompleted: boolean;
  prepPoints: number; // Gained towards 100% preparedness
  options: {
    id: string;
    label: string;
    description: string;
    prepBonus: number;
    moraleBonus: number;
    tacticalPerk: string;
  }[];
  selectedOptionId?: string;
}

export type PlayerComposureLevel = 'ICE_COLD' | 'RATTLED' | 'COMPOSED' | 'HOT' | 'ON_FIRE';

export type SidelineReactionType = 'CHEW_OUT' | 'PRAISE' | 'CALM_DOWN' | 'PUMP_UP';

export interface SidelineConferenceLog {
  quarter: number;
  timeLeft: string;
  playerName: string;
  position: Position;
  reaction: SidelineReactionType;
  resultMessage: string;
  composureDelta: number;
}

export interface PressConferenceAnswer {
  text: string;
  ownerDelta: number;
  fanDelta: number;
  lockerRoomDelta: number; // Morale delta for team
  targetUnit?: 'ALL' | 'OFFENSE' | 'DEFENSE' | 'QB' | 'LINE';
  headline: string;
  sentiment?: 'Fiery' | 'Diplomatic' | 'Critical' | 'Confident' | 'Humble';
  journalistReaction?: string;
}

export interface PressConferenceQuestion {
  id: string;
  reporter: string;
  outlet: string;
  avatarColor?: string;
  category?: 'GAME_OUTCOME' | 'PLAYER_CALLOUT' | 'TACTICAL_DECISION' | 'LOCKER_ROOM' | 'CONTROVERSY';
  question: string;
  contextSnippet?: string;
  answers: PressConferenceAnswer[];
}

export interface PressConferenceRecord {
  id: string;
  week: number;
  date: string;
  opponent: string;
  resultTitle: string;
  score: string;
  headline: string;
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalFanDelta: number;
  totalMoraleDelta: number;
  totalOwnerDelta: number;
  transcript: {
    question: string;
    reporter: string;
    outlet: string;
    answerText: string;
    sentiment?: string;
  }[];
}

export interface LastGameResult {
  week: number;
  opponentId: string;
  opponentName: string;
  userScore: number;
  opponentScore: number;
  userWon: boolean;
  isHome: boolean;
  gameNarrative: string;
  topPerformerName?: string;
  topPerformerStat?: string;
  pressConferenceCompleted?: boolean;
}

export interface HeadCoachProfile {
  name: string;
  title: string;
  level: number;
  coachPoints: number; // Current CP to spend
  totalCpEarned: number;
  ownerApproval: number; // 0-100
  fanApproval: number; // 0-100 (Fan Support Rating)
  jobSecurity: 'Iconic Legend' | 'Contract Extension' | 'Secure' | 'Warm Seat' | 'Hot Seat';
  unlockedSkillIds: string[];
  philosophy: CoachPhilosophy;
  weeklyAgenda: WeeklyAgendaActivity[];
  opponentPrepScore: number; // 0 - 100%
  completedAgendaDays: number;
  gameplanKnowledge: number; // 0-100%
  pressHistory?: PressConferenceRecord[];
  lastPressConferenceWeek?: number;
}

