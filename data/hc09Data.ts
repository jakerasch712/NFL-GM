import { CoachSkill, CoachPhilosophy, WeeklyAgendaActivity, HeadCoachProfile, PressConferenceQuestion, LastGameResult } from '../types';

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
    id: 'pq_win_dominant',
    reporter: 'Adam Schefter',
    outlet: 'ESPN',
    avatarColor: 'text-red-400',
    category: 'GAME_OUTCOME',
    question: 'Coach, your team dictated every phase of the football game today from opening kickoff to the final whistle. What does this statement victory prove to the rest of the league?',
    answers: [
      {
        text: 'This is the standard we set in practice every Wednesday and Thursday. We punched them in the mouth and proved our brand of football wins in December.',
        ownerDelta: 4,
        fanDelta: 8,
        lockerRoomDelta: 7,
        targetUnit: 'ALL',
        sentiment: 'Fiery',
        headline: 'COACH DECLARES DOMINANCE: "THIS IS OUR STANDARD"',
        journalistReaction: 'Schefter noted the supreme confidence emanating from the podium.'
      },
      {
        text: 'Credit goes to the 53 men in that locker room. They executed the gameplan with discipline, won the turnover battle, and played complementary football.',
        ownerDelta: 5,
        fanDelta: 5,
        lockerRoomDelta: 9,
        targetUnit: 'ALL',
        sentiment: 'Humble',
        headline: 'TEAM-FIRST CULTURE: HC DEFLECTS GLORY TO 53-MAN ROSTER',
        journalistReaction: 'Locker room leaders were quick to applaud the coach’s unselfish remarks.'
      },
      {
        text: 'It was a solid win, but we still left points on the board. We celebrate until midnight, but on Monday morning we have plenty of film corrections.',
        ownerDelta: 3,
        fanDelta: 2,
        lockerRoomDelta: -1,
        targetUnit: 'OFFENSE',
        sentiment: 'Critical',
        headline: 'NEVER SATISFIED: HC DEMANDS PERFECTION DESPITE BLOWOUT WIN',
        journalistReaction: 'Some players were surprised by the tough critique after such a big victory.'
      }
    ]
  },
  {
    id: 'pq_loss_heartbreaker',
    reporter: 'Ian Rapoport',
    outlet: 'NFL Network',
    avatarColor: 'text-blue-400',
    category: 'GAME_OUTCOME',
    question: 'Coach, coming down to the final possession and falling just short in a one-score contest is agonizing. What message did you deliver to the locker room after that tough finish?',
    answers: [
      {
        text: 'Put this loss squarely on my shoulders. I did not put our guys in the best tactical position to close it out down the stretch. We will fix it.',
        ownerDelta: 2,
        fanDelta: 6,
        lockerRoomDelta: 10,
        targetUnit: 'ALL',
        sentiment: 'Accountable' as any,
        headline: 'COACH TAKES FULL BLAME FOR HEARTBREAKER: "PUT IT ON ME"',
        journalistReaction: 'Players in the locker room voiced deep loyalty for the coach taking the heat.'
      },
      {
        text: 'Tough pill to swallow, but games like this forge championship character. We took their best shot and we will respond with fury next week.',
        ownerDelta: 3,
        fanDelta: 5,
        lockerRoomDelta: 6,
        targetUnit: 'ALL',
        sentiment: 'Confident',
        headline: 'RESILIENCE OVER DEFEAT: COACH PROMISES FIERY REBOUND',
        journalistReaction: 'Fans expressed optimism on social media despite the setback.'
      },
      {
        text: 'You cannot commit critical penalties and turn the ball over against a quality opponent and expect to survive. Fundamental discipline was simply not there.',
        ownerDelta: -1,
        fanDelta: -3,
        lockerRoomDelta: -6,
        targetUnit: 'ALL',
        sentiment: 'Critical',
        headline: 'COACH SCATHES DISCIPLINE: "UNACCEPTABLE MISTAKES COST US"',
        journalistReaction: 'Tension was noticeable among veteran leaders during post-game interviews.'
      }
    ]
  },
  {
    id: 'pq_qb_play',
    reporter: 'Albert Breer',
    outlet: 'Sports Illustrated',
    avatarColor: 'text-amber-400',
    category: 'PLAYER_CALLOUT',
    question: 'How would you evaluate your quarterback’s command of the offense and decision-making against the heavy defensive pressure today?',
    answers: [
      {
        text: 'Our quarterback was a field general out there. Standing tall in the pocket, reading the secondary, and making clutch throws with free rushers in his face.',
        ownerDelta: 3,
        fanDelta: 6,
        lockerRoomDelta: 8,
        targetUnit: 'QB',
        sentiment: 'Confident',
        headline: 'CLUTCH FIELD GENERAL: COACH HEAPS PRAISE ON STARTING QB',
        journalistReaction: 'The quarterback expressed deep appreciation for the coach’s public backing.'
      },
      {
        text: 'It is a collaborative effort. The offensive line provided clean pockets, the receivers won contested catches, and that made the QB’s job manageable.',
        ownerDelta: 4,
        fanDelta: 3,
        lockerRoomDelta: 6,
        targetUnit: 'OFFENSE',
        sentiment: 'Diplomatic',
        headline: 'OFFENSIVE HARMONY: COACH CREDITS PASS PROTECTION UNIT',
        journalistReaction: 'The offensive line unit gained significant confidence from the mention.'
      },
      {
        text: 'He knows he has to protect the football better. Holding the ball too long and taking bad sacks stalls drives. We need faster progression reads.',
        ownerDelta: 1,
        fanDelta: -2,
        lockerRoomDelta: -5,
        targetUnit: 'QB',
        sentiment: 'Critical',
        headline: 'QB ON NOTICE: HC CHALLENGES PASSER TO PROTECT THE FOOTBALL',
        journalistReaction: 'Media beat writers speculated on potential quarterback friction.'
      }
    ]
  },
  {
    id: 'pq_fourth_down',
    reporter: 'Dianna Russini',
    outlet: 'The Athletic',
    avatarColor: 'text-emerald-400',
    category: 'TACTICAL_DECISION',
    question: 'You made a bold decision to keep the offense on the field on 4th down in your own territory. Walk us through the calculus behind that aggressive gamble.',
    answers: [
      {
        text: 'I coach to win championships, not to play it safe. I have unconditional faith in our offense to pick up two yards against anyone in football.',
        ownerDelta: 2,
        fanDelta: 9,
        lockerRoomDelta: 8,
        targetUnit: 'OFFENSE',
        sentiment: 'Fiery',
        headline: 'GUTS OVER CONSERVATISM: HC GOES ALL-IN ON 4TH DOWN',
        journalistReaction: 'Fan forums erupted in praise for the coach’s fearless fourth down swagger.'
      },
      {
        text: 'The analytics department flagged that look before the game. The math gave us a 74% win probability by converting versus punting.',
        ownerDelta: 6,
        fanDelta: 2,
        lockerRoomDelta: 3,
        targetUnit: 'ALL',
        sentiment: 'Diplomatic',
        headline: 'NUMBERS GAME: FRONT OFFICE LAUDS ANALYTICS-FIRST DECISION',
        journalistReaction: 'The front office was ecstatic to see data models utilized successfully.'
      },
      {
        text: 'Looking back on the film, maybe we take the points or pin them deep next time. You learn and adapt as a coaching staff.',
        ownerDelta: -2,
        fanDelta: -4,
        lockerRoomDelta: -3,
        targetUnit: 'ALL',
        sentiment: 'Humble',
        headline: 'SECOND-GUESSING? COACH ADMITS RISK WAS QUESTIONABLE',
        journalistReaction: 'Pundits questioned whether the coach is wavering under game pressure.'
      }
    ]
  },
  {
    id: 'pq_defense_effort',
    reporter: 'Peter Schrager',
    outlet: 'Good Morning Football',
    avatarColor: 'text-purple-400',
    category: 'PLAYER_CALLOUT',
    question: 'Your defense flew around with ferocious intensity today, generating punishing hits and key stops. What unlocked that defensive swagger?',
    answers: [
      {
        text: 'Our defensive coordinator dialed up an absolute masterclass, and our front seven hunted in packs. We brought pure violence to the football.',
        ownerDelta: 4,
        fanDelta: 8,
        lockerRoomDelta: 8,
        targetUnit: 'DEFENSE',
        sentiment: 'Fiery',
        headline: 'HUNTING IN PACKS: HC LAUDS SAVAGE DEFENSIVE FRONT',
        journalistReaction: 'Defensive players were seen celebrating the quote in the locker room.'
      },
      {
        text: 'Disciplined gap integrity and communication. We didn’t give up explosive plays and forced them to drive the length of the field.',
        ownerDelta: 4,
        fanDelta: 4,
        lockerRoomDelta: 5,
        targetUnit: 'DEFENSE',
        sentiment: 'Diplomatic',
        headline: 'DISCIPLINE WINS: COACH DETAILS DEFENSIVE CLINIC',
        journalistReaction: 'Analysts highlighted the coaching staff’s schematic preparation.'
      },
      {
        text: 'We still missed too many tackles in space. If we want to compete for a Lombardi Trophy, our pursuit angles must improve.',
        ownerDelta: 1,
        fanDelta: 0,
        lockerRoomDelta: -3,
        targetUnit: 'DEFENSE',
        sentiment: 'Critical',
        headline: 'HIGH BAR: COACH CALLS OUT DEFENSIVE TACKLING IN SPACE',
        journalistReaction: 'Defensive captains vowed to hold intense practice sessions next week.'
      }
    ]
  },
  {
    id: 'pq_fan_support',
    reporter: 'Mike Florio',
    outlet: 'Pro Football Talk',
    avatarColor: 'text-cyan-400',
    category: 'CONTROVERSY',
    question: 'The home crowd was electric today, but fan expectations around this city are at an all-time high. How do you handle the immense pressure from the fanbase?',
    answers: [
      {
        text: 'We love this fanbase and feed off their passion! The energy in that stadium gives us an undeniable home-field advantage. We play for them!',
        ownerDelta: 3,
        fanDelta: 10,
        lockerRoomDelta: 5,
        targetUnit: 'ALL',
        sentiment: 'Confident',
        headline: 'CITY UNITED: HEAD COACH SALUTES ELECTRIC FAN BASE',
        journalistReaction: 'Season ticket holders and local supporters embraced the love letter.'
      },
      {
        text: 'Pressure is a privilege in the National Football League. If you can’t handle high expectations in this city, you shouldn’t wear this logo.',
        ownerDelta: 5,
        fanDelta: 7,
        lockerRoomDelta: 7,
        targetUnit: 'ALL',
        sentiment: 'Fiery',
        headline: 'PRESSURE IS A PRIVILEGE: HC EMBRACES CHAMPIONSHIP GOALS',
        journalistReaction: 'National television pundits praised the fearless culture shift.'
      },
      {
        text: 'We ignore the outside noise. Twitter and sports radio don’t call the plays on 3rd down. We focus on our 53 guys and our assignments.',
        ownerDelta: 2,
        fanDelta: -4,
        lockerRoomDelta: 4,
        targetUnit: 'ALL',
        sentiment: 'Diplomatic',
        headline: 'TUNE OUT THE NOISE: COACH BRUSHES OFF MEDIA & TALK RADIO',
        journalistReaction: 'Local radio hosts debated the coach’s dismissive tone.'
      }
    ]
  }
];

export function generatePressConferenceQuestions(
  gameResult: LastGameResult | null,
  teamName: string,
  opponentName: string
): PressConferenceQuestion[] {
  const selected: PressConferenceQuestion[] = [];

  if (gameResult) {
    if (gameResult.userWon) {
      selected.push(POST_GAME_PRESS_QUESTIONS[0]); // pq_win_dominant
    } else {
      selected.push(POST_GAME_PRESS_QUESTIONS[1]); // pq_loss_heartbreaker
    }
  } else {
    selected.push(POST_GAME_PRESS_QUESTIONS[0]);
  }

  // Add QB question
  selected.push(POST_GAME_PRESS_QUESTIONS[2]);

  // Add 4th down or Defense question
  if (gameResult && (gameResult.userScore + gameResult.opponentScore > 45)) {
    selected.push(POST_GAME_PRESS_QUESTIONS[3]); // 4th down / offense
  } else {
    selected.push(POST_GAME_PRESS_QUESTIONS[4]); // defense
  }

  // Add fan support question
  selected.push(POST_GAME_PRESS_QUESTIONS[5]);

  return selected;
}
