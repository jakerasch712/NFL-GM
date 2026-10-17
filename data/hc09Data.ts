import { CoachSkill, CoachPhilosophy, WeeklyAgendaActivity, HeadCoachProfile, PressConferenceQuestion } from '../types';

export const HC09_COACH_SKILLS: CoachSkill[] = [
  // TACTICIAN BRANCH
  {
    id: 'tac_audible',
    name: 'Audible Mastery',
    branch: 'Tactician',
    tier: 1,
    cost: 300,
    description: 'Empowers quarterback with full line-of-scrimmage audible authority.',
    perkDescription: 'Unlocks Audible switch during play-calling when facing unfavorable defensive fronts.',
    isUnlocked: true,
    iconName: 'Zap'
  },
  {
    id: 'tac_redzone',
    name: 'Red Zone Playmaker',
    branch: 'Tactician',
    tier: 2,
    cost: 550,
    description: 'Advanced condensed-field spacing and high-low route concepts inside the 20.',
    perkDescription: '+18% touchdown scoring efficiency on drives that reach the opponent red zone.',
    isUnlocked: false,
    iconName: 'Target'
  },
  {
    id: 'tac_third_down',
    name: '3rd Down Conversion Master',
    branch: 'Tactician',
    tier: 2,
    cost: 600,
    description: 'Custom stick-routes and zone beaters mapped precisely to the sticks.',
    perkDescription: '+15% conversion rate on 3rd & manageable downs (under 6 yards).',
    isUnlocked: false,
    iconName: 'TrendingUp'
  },
  {
    id: 'tac_twominute',
    name: 'Two-Minute Maestro',
    branch: 'Tactician',
    tier: 3,
    cost: 1100,
    description: 'Elite hurry-up operational tempo and sideline-boundary route awareness.',
    perkDescription: 'Halves play clock run-off during final 2 minutes; offense composure locked to HOT.',
    isUnlocked: false,
    iconName: 'Clock'
  },

  // MOTIVATOR BRANCH
  {
    id: 'mot_sideline',
    name: 'Sideline Orator',
    branch: 'Motivator',
    tier: 1,
    cost: 250,
    description: 'Charismatic sideline leadership that commands instant player attention and respect.',
    perkDescription: 'Sideline conferences provide 50% stronger composure recovery and morale boost.',
    isUnlocked: true,
    iconName: 'Flame'
  },
  {
    id: 'mot_clutch',
    name: 'Clutch Engine',
    branch: 'Motivator',
    tier: 2,
    cost: 500,
    description: 'Inspires teams to fight back from deficits without panic in high-leverage moments.',
    perkDescription: 'Trailing in the 4th quarter grants the entire roster +3 Scheme OVR boost.',
    isUnlocked: false,
    iconName: 'Award'
  },
  {
    id: 'mot_composure',
    name: 'Iron Composure',
    branch: 'Motivator',
    tier: 2,
    cost: 650,
    description: 'Mental resilience drills preventing snowballing errors after turnovers.',
    perkDescription: 'Players recover from fumbles or interceptions immediately on the next possession.',
    isUnlocked: false,
    iconName: 'Shield'
  },
  {
    id: 'mot_halftime',
    name: 'Legendary Halftime Speech',
    branch: 'Motivator',
    tier: 3,
    cost: 1250,
    description: 'Locker-room speeches that echo in franchise lore and turn the tide of postseason battles.',
    perkDescription: 'Opening 3rd-quarter drive gains +25% play success and guaranteed momentum advantage.',
    isUnlocked: false,
    iconName: 'Sparkles'
  },

  // SCOUT & PERSONNEL BRANCH
  {
    id: 'sct_potential',
    name: 'Potential Unmasker',
    branch: 'Scout',
    tier: 1,
    cost: 350,
    description: 'Trained eye for identifying raw developmental ceilings in college game tape.',
    perkDescription: 'Reveals true developmental trait (Star / Superstar / X-Factor) for all draft prospects.',
    isUnlocked: false,
    iconName: 'Eye'
  },
  {
    id: 'sct_sleeper',
    name: 'Sleeper Radar',
    branch: 'Scout',
    tier: 2,
    cost: 650,
    description: 'Specialized small-school scouting network uncovering diamonds in the rough.',
    perkDescription: 'Highlights late-round draft sleepers (Rounds 4-7) with guaranteed +5 OVR upside.',
    isUnlocked: false,
    iconName: 'Radio'
  },
  {
    id: 'sct_combine',
    name: 'Combine Telemetry',
    branch: 'Scout',
    tier: 2,
    cost: 500,
    description: 'Laser-calibrated timing and biomechanical athletic tracking.',
    perkDescription: 'Reveals exact unrounded 40-yard dash times and burst percentiles for incoming rookies.',
    isUnlocked: false,
    iconName: 'Activity'
  },
  {
    id: 'sct_medical',
    name: 'Medical Diagnostics',
    branch: 'Scout',
    tier: 3,
    cost: 950,
    description: 'Orthopedic and structural MRI evaluation to avoid injury-prone veterans and busts.',
    perkDescription: 'Accurately predicts player durability ratings and hidden ligament injury risk.',
    isUnlocked: false,
    iconName: 'HeartHandshake'
  },

  // DISCIPLINARIAN BRANCH
  {
    id: 'dis_flags',
    name: 'Zero-Tolerance Discipline',
    branch: 'Disciplinarian',
    tier: 1,
    cost: 250,
    description: 'Relentless repetition of snap counts, alignment rules, and line of scrimmage discipline.',
    perkDescription: 'Reduces offensive false starts, holding, and defensive penalties by 45%.',
    isUnlocked: true,
    iconName: 'CheckCircle2'
  },
  {
    id: 'dis_fatigue',
    name: 'Conditioning Clinic',
    branch: 'Disciplinarian',
    tier: 2,
    cost: 550,
    description: 'Fourth-quarter cardiovascular regimen designed to dominate in late-game wear-down.',
    perkDescription: 'Reduces player stamina exhaustion per drive by 30%, keeping starters fresh.',
    isUnlocked: false,
    iconName: 'Activity'
  },
  {
    id: 'dis_fumble',
    name: 'Ball Security Protocol',
    branch: 'Disciplinarian',
    tier: 2,
    cost: 600,
    description: 'High-and-tight ball carrying drills in all weather conditions.',
    perkDescription: 'Reduces fumble likelihood on heavy hits and freezing rain/snow by 50%.',
    isUnlocked: false,
    iconName: 'ShieldAlert'
  },
  {
    id: 'dis_contracts',
    name: 'Locker Room Culture & Loyalty',
    branch: 'Disciplinarian',
    tier: 3,
    cost: 1100,
    description: 'A winning culture players willingly sacrifice personal salary to be part of.',
    perkDescription: 'Free agents and extension candidates reduce contract salary demands by 12%.',
    isUnlocked: false,
    iconName: 'Crown'
  },

  // STRATEGIST & FILM ROOM BRANCH
  {
    id: 'str_tell',
    name: 'Opponent Tell Reader',
    branch: 'Strategist',
    tier: 1,
    cost: 400,
    description: 'Deciphers opponent offensive coordinator personnel groupings and pre-snap tendencies.',
    perkDescription: 'Displays live probability HUD indicating expected Run vs Pass call before each snap.',
    isUnlocked: true,
    iconName: 'Brain'
  },
  {
    id: 'str_prep',
    name: 'Film Room Guru',
    branch: 'Strategist',
    tier: 2,
    cost: 700,
    description: 'All-22 overhead tape mastery that turns opponent weaknesses into easy points.',
    perkDescription: 'Weekly agenda film study grants +20% higher preparation bonus toward gameday.',
    isUnlocked: false,
    iconName: 'Film'
  },
  {
    id: 'str_counter',
    name: 'Scheme Counterpunch',
    branch: 'Strategist',
    tier: 2,
    cost: 750,
    description: 'Targeted exploitation of opponent base coverage weaknesses (Cover 2, Cover 3, Blitz).',
    perkDescription: '+12% play success when calling designated scheme counter plays against opponent look.',
    isUnlocked: false,
    iconName: 'Sliders'
  },
  {
    id: 'str_genius',
    name: 'Head Coach Chessmaster',
    branch: 'Strategist',
    tier: 3,
    cost: 1300,
    description: 'The pinnacle of NFL Head Coach strategic vision, anticipating every opponent audible.',
    perkDescription: 'OC and DC headset recommendations guarantee +4.5 yard average gain and +15% TD odds.',
    isUnlocked: false,
    iconName: 'Cpu'
  }
];

export const DEFAULT_COACH_PHILOSOPHY: CoachPhilosophy = {
  runPassRatio: 52, // 52% pass, 48% run
  passDepth: 'Medium',
  blitzFrequency: 38, // 38% blitz
  fourthDownAggressiveness: 65, // aggressive
  offensiveTempo: 'Normal',
  offensiveScheme: 'West Coast',
  defensiveScheme: 'Cover 3 Press',
  qbDecisionMaking: 'Balanced',
  playerRotationFatigueThreshold: 75
};

export const createWeeklyAgenda = (week: number, oppName: string): WeeklyAgendaActivity[] => [
  {
    day: 'MONDAY',
    dayLabel: 'MONDAY // 08:00 HRS',
    title: 'All-22 Film Study & Tendency Breakdown',
    subtitle: `Review tape of ${oppName} to identify exploitable structural deficiencies.`,
    category: 'FILM_ROOM',
    isCompleted: false,
    prepPoints: 15,
    options: [
      {
        id: 'film_pass',
        label: 'Dissect Opponent Secondary & Coverages',
        description: 'Expose zone soft spots and isolate weak cornerback matchups.',
        prepBonus: 18,
        moraleBonus: 2,
        tacticalPerk: '+10% Pass Completion Rate on intermediate routes'
      },
      {
        id: 'film_run',
        label: 'Analyze Defensive Front & Gap Fits',
        description: 'Study defensive tackle tendencies to establish interior power running lanes.',
        prepBonus: 16,
        moraleBonus: 1,
        tacticalPerk: '+1.2 YPC on Inside Zone & Power runs'
      },
      {
        id: 'film_blitz',
        label: 'Blitz Pickup & Pressure Protection',
        description: 'Prep offensive line on exotic blitz identification and hot reads.',
        prepBonus: 20,
        moraleBonus: 3,
        tacticalPerk: 'Reduces opponent sacks by 40%'
      }
    ]
  },
  {
    day: 'TUESDAY',
    dayLabel: 'TUESDAY // 10:30 HRS',
    title: 'Staff Coordination & Gameplan Install',
    subtitle: 'Sit down with Offensive and Defensive Coordinators to formalize game script.',
    category: 'STAFF_MEETING',
    isCompleted: false,
    prepPoints: 15,
    options: [
      {
        id: 'staff_tempo',
        label: 'High-Tempo Up-Tempo Attack',
        description: 'Tire the opponent defensive line with rapid no-huddle play calls.',
        prepBonus: 16,
        moraleBonus: 2,
        tacticalPerk: 'Accelerates game pace; opponent defense tires 25% faster'
      },
      {
        id: 'staff_balanced',
        label: 'Balanced Ball-Control Protocol',
        description: 'Control time of possession, minimize turnover risks, and milk clock.',
        prepBonus: 18,
        moraleBonus: 2,
        tacticalPerk: '-50% Turnover risk; controls clock late'
      },
      {
        id: 'staff_aggressive',
        label: 'Aggressive Vertical Shot-Calling',
        description: 'Attack downfield on 1st downs with play-action post routes.',
        prepBonus: 20,
        moraleBonus: 4,
        tacticalPerk: '+20% Big play explosive gains over 20 yards'
      }
    ]
  },
  {
    day: 'WEDNESDAY',
    dayLabel: 'WEDNESDAY // 14:00 HRS',
    title: 'Offensive Practice & Full-Pad Drill',
    subtitle: 'Run 1st & 2nd down installs against scout team mimicking opponent defense.',
    category: 'OFFENSE_INSTALL',
    isCompleted: false,
    prepPoints: 20,
    options: [
      {
        id: 'off_redzone',
        label: 'Red Zone Execution & Fade Timing',
        description: 'Targeted high-leverage reps from inside the 15-yard line.',
        prepBonus: 22,
        moraleBonus: 3,
        tacticalPerk: '+25% TD conversion on trips inside the 20'
      },
      {
        id: 'off_playaction',
        label: 'Play-Action Timing & Pass Protection',
        description: 'Sync quarterback footwork with deep crossing routes and bootlegs.',
        prepBonus: 18,
        moraleBonus: 2,
        tacticalPerk: '+15% QB Passer rating on play-action calls'
      },
      {
        id: 'off_screen',
        label: 'Screen Game & Quick-Game Hot Reads',
        description: 'Perfect timing on RB and WR screens to punish aggressive defensive ends.',
        prepBonus: 19,
        moraleBonus: 1,
        tacticalPerk: '+3.5 yards on Screen Passes'
      }
    ]
  },
  {
    day: 'THURSDAY',
    dayLabel: 'THURSDAY // 14:00 HRS',
    title: 'Defensive Practice & 3rd-Down Packages',
    subtitle: 'Hone pressure looks and blanket coverage against opponent primary weapons.',
    category: 'DEFENSE_INSTALL',
    isCompleted: false,
    prepPoints: 20,
    options: [
      {
        id: 'def_contain',
        label: 'Mobile QB Contain & Edge Discipline',
        description: 'Establish disciplined rush lanes to prevent quarterback scramble scrambles.',
        prepBonus: 20,
        moraleBonus: 2,
        tacticalPerk: 'Opponent QB scramble yardage reduced by 70%'
      },
      {
        id: 'def_lockdown',
        label: 'Star Wide Receiver Double-Team Bracket',
        description: 'Deploy safety bracket coverage over opponent #1 receiving target.',
        prepBonus: 22,
        moraleBonus: 3,
        tacticalPerk: 'Opponent WR1 catch rate reduced by 35%'
      },
      {
        id: 'def_blitz',
        label: 'Zero Blitz & Exotic Fire Zones',
        description: 'Dial up creative safety and slot corner blitzes on 3rd down.',
        prepBonus: 21,
        moraleBonus: 4,
        tacticalPerk: '+30% Sack & hurry probability on 3rd & long'
      }
    ]
  },
  {
    day: 'FRIDAY',
    dayLabel: 'FRIDAY // 11:00 HRS',
    title: 'Special Teams & Situational Walkthrough',
    subtitle: 'Fine-tune clutch kicking, punt coverage, and two-minute drill execution.',
    category: 'SPECIAL_TEAMS',
    isCompleted: false,
    prepPoints: 15,
    options: [
      {
        id: 'st_fieldgoal',
        label: 'Clutch Field Goal Unit Reps',
        description: 'High-pressure simulation of game-winning 50+ yard field goal attempts.',
        prepBonus: 15,
        moraleBonus: 2,
        tacticalPerk: '+15% Field goal accuracy in 4th quarter and overtime'
      },
      {
        id: 'st_coverage',
        label: 'Coverage Units & Lane Integrity',
        description: 'Eliminate explosive return touchdowns with disciplined tackling lanes.',
        prepBonus: 16,
        moraleBonus: 1,
        tacticalPerk: 'Limits opponent return yardage under 18 yds'
      },
      {
        id: 'st_twominute',
        label: 'Two-Minute Clock Simulation',
        description: 'Walkthrough hurry-up spike, sideline timeouts, and Hail Mary defense.',
        prepBonus: 18,
        moraleBonus: 3,
        tacticalPerk: '+1 Extra Timeout utility during two-minute drill'
      }
    ]
  },
  {
    day: 'SATURDAY',
    dayLabel: 'SATURDAY // 19:30 HRS',
    title: 'Pre-Game Coach Speech & Team Mindset',
    subtitle: 'Address the team in the team auditorium to set emotional focus and conviction.',
    category: 'PREGAME_SPEECH',
    isCompleted: false,
    prepPoints: 15,
    options: [
      {
        id: 'speech_fire',
        label: '"Unleash Hell: We Play With Relentless Fire"',
        description: 'High-intensity fiery rant emphasizing physical dominance and intimidation.',
        prepBonus: 15,
        moraleBonus: 6,
        tacticalPerk: 'Spikes team Momentum meter to maximum on opening kickoff'
      },
      {
        id: 'speech_discipline',
        label: '"Cold-Blooded Execution: The Details Win Rings"',
        description: 'Calculated, stoic delivery focused on error-free execution and poise.',
        prepBonus: 18,
        moraleBonus: 4,
        tacticalPerk: 'Entire team starts with COMPOSED mental state; zero early penalties'
      },
      {
        id: 'speech_swagger',
        label: '"No Fear: We Dictate the Terms Today"',
        description: 'Confident, relaxed swagger inspiring young players to play loose and fearless.',
        prepBonus: 16,
        moraleBonus: 5,
        tacticalPerk: '+5% boost to individual player big-play breakout chance'
      }
    ]
  }
];

export const INITIAL_HEAD_COACH_PROFILE: HeadCoachProfile = {
  name: 'Head Coach',
  title: 'HC & Playcaller',
  level: 1,
  coachPoints: 600, // Starting CP for new coach
  totalCpEarned: 600,
  ownerApproval: 82,
  fanApproval: 78,
  jobSecurity: 'Secure',
  unlockedSkillIds: ['tac_audible', 'mot_sideline', 'dis_flags', 'str_tell'],
  philosophy: DEFAULT_COACH_PHILOSOPHY,
  weeklyAgenda: createWeeklyAgenda(1, 'Upcoming Opponent'),
  opponentPrepScore: 35,
  completedAgendaDays: 0,
  gameplanKnowledge: 72
};

export const POST_GAME_PRESS_QUESTIONS: PressConferenceQuestion[] = [
  {
    id: 'pq_1',
    reporter: 'Adam Schefter',
    outlet: 'ESPN',
    question: 'Coach, your gameplan seemed heavily focused on establishing the ground game early. How did you assess your offensive line\'s physical push at the line of scrimmage?',
    answers: [
      {
        text: 'Our big men up front set the tone. We punched them in the mouth and proved we can dictate the trenches when it counts.',
        ownerDelta: 3,
        fanDelta: 5,
        lockerRoomDelta: 6,
        headline: 'HEAD COACH PRAISES TRENCH WARFARE: "WE DICTATED THE LINE"'
      },
      {
        text: 'We took what the defense gave us. Our offensive coordinator dialed up the right looks and the players executed the scheme.',
        ownerDelta: 4,
        fanDelta: 2,
        lockerRoomDelta: 3,
        headline: 'METHODICAL GAMEPLAN DELIVERS: COACH CREDITS COORDINATORS'
      },
      {
        text: 'We still left too many yards on the field. Good is the enemy of great, and we expect higher execution next week.',
        ownerDelta: 2,
        fanDelta: -1,
        lockerRoomDelta: -2,
        headline: 'NEVER SATISFIED: COACH DEMANDS PERFECTION FROM ROSTER'
      }
    ]
  },
  {
    id: 'pq_2',
    reporter: 'Ian Rapoport',
    outlet: 'NFL Network',
    question: 'In the fourth quarter, you made several aggressive tactical calls in high-leverage situations. Did you ever consider playing it more conservatively?',
    answers: [
      {
        text: 'I coach to win, not to avoid losing. I believe in our players to make winning plays on 4th down and in the clutch.',
        ownerDelta: 2,
        fanDelta: 7,
        lockerRoomDelta: 8,
        headline: 'FEARLESS ON 4TH DOWN: COACH PUTS FULL FAITH IN PLAYERS'
      },
      {
        text: 'The analytics supported every single decision. Our math models indicated that aggression was the highest-probability path.',
        ownerDelta: 5,
        fanDelta: 1,
        lockerRoomDelta: 2,
        headline: 'ANALYTICS-DRIVEN TRIUMPH: FRONT OFFICE APPLAUDS HC METRICS'
      },
      {
        text: 'It was a collective staff call. We saw a tell in their defensive front and we attacked their vulnerability.',
        ownerDelta: 3,
        fanDelta: 3,
        lockerRoomDelta: 4,
        headline: 'SCOUTING EDGE: COACH EXPOSES OPPONENT DEFENSIVE SCHEME'
      }
    ]
  }
];
