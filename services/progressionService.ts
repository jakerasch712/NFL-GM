import { Player, Position, PlayerAttributes, MoraleFactor, ProgressionHistoryEntry, BreakoutOpportunity, ArchetypeUpgradePackage, ProgressionWeekSummary, CareerMilestone } from '../types';

// ==========================================
// 1. DEFAULT ATTRIBUTES GENERATOR
// ==========================================
export const generatePlayerAttributes = (player: Player): PlayerAttributes => {
  const ovr = player.overall || 75;
  const age = player.age || 26;
  const pos = player.position;

  // Base physical stats scaled by position and age
  const speedDecay = age > 30 ? (age - 30) * 1.5 : 0;
  
  const base: PlayerAttributes = {
    speed: Math.min(99, Math.max(55, Math.round(75 + (ovr - 75) * 0.4 - speedDecay))),
    acceleration: Math.min(99, Math.max(55, Math.round(76 + (ovr - 75) * 0.4 - speedDecay))),
    strength: Math.min(99, Math.max(50, Math.round(70 + (ovr - 75) * 0.35))),
    agility: Math.min(99, Math.max(55, Math.round(74 + (ovr - 75) * 0.4 - speedDecay))),
    awareness: Math.min(99, Math.max(50, Math.round(65 + (ovr - 70) * 0.6 + Math.min(15, (age - 21) * 1.2)))),
    stamina: Math.min(99, Math.max(65, Math.round(85 + (ovr - 75) * 0.2 - (age > 32 ? (age - 32) * 2 : 0)))),
    toughness: Math.min(99, Math.max(60, Math.round(80 + (ovr - 75) * 0.25)))
  };

  // Position-specific tuning
  switch (pos) {
    case Position.QB:
      base.speed = Math.min(92, Math.max(58, player.archetype === 'Scrambler' ? 88 + Math.round((ovr - 80) * 0.3) : 68 + Math.round((ovr - 75) * 0.2)));
      base.throwPower = Math.min(99, Math.max(78, Math.round(84 + (ovr - 75) * 0.5)));
      base.shortAccuracy = Math.min(99, Math.max(70, Math.round(78 + (ovr - 75) * 0.55)));
      base.mediumAccuracy = Math.min(99, Math.max(68, Math.round(74 + (ovr - 75) * 0.6)));
      base.deepAccuracy = Math.min(99, Math.max(65, Math.round(71 + (ovr - 75) * 0.65)));
      base.throwOnRun = Math.min(99, Math.max(65, Math.round(72 + (ovr - 75) * 0.5)));
      base.playAction = Math.min(99, Math.max(65, Math.round(74 + (ovr - 75) * 0.5)));
      base.carrying = Math.min(85, Math.max(55, 66 + Math.round((ovr - 75) * 0.2)));
      break;

    case Position.RB:
      base.speed = Math.min(97, Math.max(82, Math.round(88 + (ovr - 75) * 0.3 - speedDecay)));
      base.acceleration = Math.min(98, Math.max(84, Math.round(89 + (ovr - 75) * 0.3 - speedDecay)));
      base.carrying = Math.min(99, Math.max(75, Math.round(80 + (ovr - 75) * 0.5)));
      base.breakTackle = Math.min(99, Math.max(70, Math.round(78 + (ovr - 75) * 0.6)));
      base.trucking = player.archetype === 'Power Back' ? Math.min(99, 84 + Math.round((ovr - 75) * 0.5)) : Math.min(88, 70 + Math.round((ovr - 75) * 0.4));
      base.elusiveness = player.archetype === 'Elusive Back' ? Math.min(99, 86 + Math.round((ovr - 75) * 0.5)) : Math.min(88, 72 + Math.round((ovr - 75) * 0.4));
      base.bcVision = Math.min(99, Math.max(72, Math.round(78 + (ovr - 75) * 0.55)));
      base.catching = Math.min(88, Math.max(58, Math.round(68 + (ovr - 75) * 0.4)));
      break;

    case Position.WR:
      base.speed = Math.min(99, Math.max(85, Math.round(90 + (ovr - 75) * 0.3 - speedDecay)));
      base.acceleration = Math.min(99, Math.max(86, Math.round(91 + (ovr - 75) * 0.3 - speedDecay)));
      base.catching = Math.min(99, Math.max(74, Math.round(80 + (ovr - 75) * 0.55)));
      base.catchInTraffic = Math.min(99, Math.max(70, Math.round(76 + (ovr - 75) * 0.6)));
      base.shortRouteRunning = Math.min(99, Math.max(70, Math.round(77 + (ovr - 75) * 0.6)));
      base.mediumRouteRunning = Math.min(99, Math.max(68, Math.round(75 + (ovr - 75) * 0.65)));
      base.deepRouteRunning = Math.min(99, Math.max(65, Math.round(73 + (ovr - 75) * 0.7)));
      base.release = Math.min(99, Math.max(68, Math.round(74 + (ovr - 75) * 0.6)));
      base.spectacularCatch = Math.min(99, Math.max(68, Math.round(75 + (ovr - 75) * 0.6)));
      break;

    case Position.TE:
      base.speed = Math.min(90, Math.max(75, Math.round(80 + (ovr - 75) * 0.3 - speedDecay)));
      base.strength = Math.min(92, Math.max(68, Math.round(78 + (ovr - 75) * 0.4)));
      base.catching = Math.min(96, Math.max(70, Math.round(76 + (ovr - 75) * 0.55)));
      base.catchInTraffic = Math.min(96, Math.max(70, Math.round(75 + (ovr - 75) * 0.6)));
      base.shortRouteRunning = Math.min(92, Math.max(66, Math.round(72 + (ovr - 75) * 0.55)));
      base.passBlock = Math.min(88, Math.max(60, Math.round(68 + (ovr - 75) * 0.45)));
      base.runBlock = Math.min(92, Math.max(65, Math.round(72 + (ovr - 75) * 0.55)));
      break;

    case Position.OL:
      base.speed = Math.min(74, Math.max(50, Math.round(58 + (ovr - 75) * 0.2)));
      base.strength = Math.min(99, Math.max(82, Math.round(88 + (ovr - 75) * 0.4)));
      base.passBlock = Math.min(99, Math.max(72, Math.round(78 + (ovr - 75) * 0.6)));
      base.runBlock = Math.min(99, Math.max(72, Math.round(78 + (ovr - 75) * 0.6)));
      base.impactBlock = Math.min(99, Math.max(70, Math.round(76 + (ovr - 75) * 0.6)));
      base.passBlockPower = Math.min(99, Math.max(70, Math.round(77 + (ovr - 75) * 0.6)));
      base.passBlockFinesse = Math.min(99, Math.max(70, Math.round(75 + (ovr - 75) * 0.6)));
      base.runBlockPower = Math.min(99, Math.max(70, Math.round(77 + (ovr - 75) * 0.6)));
      base.runBlockFinesse = Math.min(99, Math.max(70, Math.round(75 + (ovr - 75) * 0.6)));
      break;

    case Position.DL:
      base.speed = Math.min(88, Math.max(62, Math.round(72 + (ovr - 75) * 0.35 - speedDecay)));
      base.strength = Math.min(99, Math.max(80, Math.round(86 + (ovr - 75) * 0.45)));
      base.tackle = Math.min(99, Math.max(72, Math.round(78 + (ovr - 75) * 0.55)));
      base.hitPower = Math.min(99, Math.max(72, Math.round(80 + (ovr - 75) * 0.55)));
      base.blockShedding = Math.min(99, Math.max(70, Math.round(77 + (ovr - 75) * 0.65)));
      base.powerMoves = Math.min(99, Math.max(68, Math.round(75 + (ovr - 75) * 0.65)));
      base.finesseMoves = Math.min(99, Math.max(65, Math.round(73 + (ovr - 75) * 0.65)));
      base.pursuit = Math.min(99, Math.max(70, Math.round(76 + (ovr - 75) * 0.55)));
      base.playRecognition = Math.min(99, Math.max(68, Math.round(74 + (ovr - 75) * 0.6)));
      break;

    case Position.LB:
      base.speed = Math.min(92, Math.max(75, Math.round(82 + (ovr - 75) * 0.35 - speedDecay)));
      base.acceleration = Math.min(94, Math.max(78, Math.round(84 + (ovr - 75) * 0.35 - speedDecay)));
      base.strength = Math.min(94, Math.max(74, Math.round(80 + (ovr - 75) * 0.4)));
      base.tackle = Math.min(99, Math.max(75, Math.round(82 + (ovr - 75) * 0.6)));
      base.hitPower = Math.min(99, Math.max(74, Math.round(80 + (ovr - 75) * 0.6)));
      base.blockShedding = Math.min(96, Math.max(68, Math.round(75 + (ovr - 75) * 0.6)));
      base.pursuit = Math.min(99, Math.max(72, Math.round(78 + (ovr - 75) * 0.6)));
      base.playRecognition = Math.min(99, Math.max(70, Math.round(76 + (ovr - 75) * 0.65)));
      base.zoneCoverage = Math.min(92, Math.max(60, Math.round(68 + (ovr - 75) * 0.6)));
      base.manCoverage = Math.min(84, Math.max(50, Math.round(58 + (ovr - 75) * 0.5)));
      break;

    case Position.CB:
    case Position.S:
      base.speed = Math.min(99, Math.max(86, Math.round(91 + (ovr - 75) * 0.3 - speedDecay)));
      base.acceleration = Math.min(99, Math.max(87, Math.round(92 + (ovr - 75) * 0.3 - speedDecay)));
      base.tackle = Math.min(90, Math.max(55, Math.round(64 + (ovr - 75) * 0.5)));
      base.hitPower = Math.min(95, Math.max(58, Math.round(68 + (ovr - 75) * 0.55)));
      base.manCoverage = Math.min(99, Math.max(70, Math.round(78 + (ovr - 75) * 0.65)));
      base.zoneCoverage = Math.min(99, Math.max(70, Math.round(78 + (ovr - 75) * 0.65)));
      base.press = Math.min(99, Math.max(65, Math.round(74 + (ovr - 75) * 0.6)));
      base.playRecognition = Math.min(99, Math.max(68, Math.round(75 + (ovr - 75) * 0.6)));
      base.pursuit = Math.min(99, Math.max(70, Math.round(77 + (ovr - 75) * 0.55)));
      break;

    case Position.K:
      base.kickPower = Math.min(99, Math.max(78, Math.round(84 + (ovr - 75) * 0.5)));
      base.kickAccuracy = Math.min(99, Math.max(74, Math.round(80 + (ovr - 75) * 0.6)));
      break;
  }

  return base;
};

// ==========================================
// 2. CAREER PHASE & DEV TRAIT MODIFIERS
// ==========================================
export const getPlayerCareerPhase = (age: number): 'Ascending' | 'Prime' | 'Veteran' | 'Declining' => {
  if (age <= 25) return 'Ascending';
  if (age <= 29) return 'Prime';
  if (age <= 32) return 'Veteran';
  return 'Declining';
};

export const getDevTraitMultiplier = (trait: 'Normal' | 'Star' | 'Superstar' | 'X-Factor'): number => {
  switch (trait) {
    case 'X-Factor': return 1.85;
    case 'Superstar': return 1.50;
    case 'Star': return 1.25;
    case 'Normal': default: return 1.00;
  }
};

// ==========================================
// 3. DYNAMIC MORALE ENGINE
// ==========================================
export const calculateMorale = (
  player: Player,
  team: any,
  isStarter: boolean,
  teamWonLastGame: boolean = true,
  currentStreak: number = 0
): {
  morale: number;
  status: 'Ecstatic' | 'Motivated' | 'Content' | 'Frustrated' | 'Demoralized';
  factors: MoraleFactor[];
  devModifier: number;
} => {
  const factors: MoraleFactor[] = [];
  let baseScore = 70; // neutral base

  // 1. Starting Role vs Backup
  if (isStarter) {
    baseScore += 12;
    factors.push({
      id: 'role-starter',
      label: 'Starting Lineup Role',
      impact: 12,
      type: 'positive',
      description: 'Designated first-string starter on active depth chart.'
    });
  } else {
    if (player.overall >= 80) {
      baseScore -= 18;
      factors.push({
        id: 'role-benched',
        label: 'Benched High-OVR Caliber',
        impact: -18,
        type: 'negative',
        description: 'Frustrated by lack of starting reps despite high overall caliber.'
      });
    } else {
      baseScore -= 4;
      factors.push({
        id: 'role-backup',
        label: 'Rotational Backup Role',
        impact: -4,
        type: 'neutral',
        description: 'Developing behind starting veteran in rotational depth.'
      });
    }
  }

  // 2. Team Record & Winning Momentum
  const recordParts = (team?.record || '0-0-0').split('-');
  const wins = parseInt(recordParts[0]) || 0;
  const losses = parseInt(recordParts[1]) || 0;
  const totalGames = wins + losses;
  const winPct = totalGames > 0 ? wins / totalGames : 0.5;

  if (winPct >= 0.7) {
    baseScore += 10;
    factors.push({
      id: 'team-winning',
      label: 'Championship Winning Culture',
      impact: 10,
      type: 'positive',
      description: `Team is rolling at ${team.record}, competing for #1 seed.`
    });
  } else if (winPct <= 0.3 && totalGames >= 3) {
    baseScore -= 12;
    factors.push({
      id: 'team-losing',
      label: 'Losing Record Frustration',
      impact: -12,
      type: 'negative',
      description: `Struggling ${team.record} record creating locker room tension.`
    });
  }

  if (currentStreak >= 2) {
    baseScore += 6;
    factors.push({
      id: 'win-streak',
      label: `${currentStreak}-Game Winning Streak`,
      impact: 6,
      type: 'positive',
      description: 'Locker room buzzing with hot winning streak momentum.'
    });
  } else if (currentStreak <= -2) {
    baseScore -= 8;
    factors.push({
      id: 'loss-streak',
      label: `${Math.abs(currentStreak)}-Game Slump`,
      impact: -8,
      type: 'negative',
      description: 'Consecutive losses dragging down confidence.'
    });
  }

  // 3. Scheme Alignment
  const schemeDelta = (player.schemeOvr || player.overall) - player.overall;
  if (schemeDelta >= 2) {
    baseScore += 8;
    factors.push({
      id: 'scheme-ideal',
      label: 'Offensive / Defensive Scheme Synergy',
      impact: 8,
      type: 'positive',
      description: 'Playbook perfectly complements physical skill set.'
    });
  } else if (schemeDelta < 0) {
    baseScore -= 8;
    factors.push({
      id: 'scheme-mismatch',
      label: 'Scheme Disconnect',
      impact: -8,
      type: 'negative',
      description: 'Tactical scheme does not highlight natural strengths.'
    });
  }

  // 4. Contract Satisfaction
  const salary = player.contract?.salary || 5;
  if (player.overall >= 88 && salary < 10) {
    baseScore -= 10;
    factors.push({
      id: 'contract-underpaid',
      label: 'Below Market Value Contract',
      impact: -10,
      type: 'negative',
      description: 'Star performance outperforming current compensation.'
    });
  } else if (salary >= 20) {
    baseScore += 6;
    factors.push({
      id: 'contract-elite',
      label: 'Franchise Pillar Contract',
      impact: 6,
      type: 'positive',
      description: 'Generational compensation providing financial security.'
    });
  }

  // 5. Personality Impact
  switch (player.personality) {
    case 'Leader':
      baseScore += 6;
      factors.push({
        id: 'personality-leader',
        label: 'Natural Locker Room Leader',
        impact: 6,
        type: 'positive',
        description: 'Maintains composure and elevates team atmosphere in adversity.'
      });
      break;
    case 'The Diva':
      if (winPct < 0.5 || !isStarter) {
        baseScore -= 12;
        factors.push({
          id: 'personality-diva-sad',
          label: 'Diva Temperament Volatility',
          impact: -12,
          type: 'negative',
          description: 'High expectations causing vocal displeasure.'
        });
      } else {
        baseScore += 8;
        factors.push({
          id: 'personality-diva-happy',
          label: 'Center of Spotlight',
          impact: 8,
          type: 'positive',
          description: 'Thriving in winning environment with major spotlight.'
        });
      }
      break;
    case 'Workhorse':
      baseScore += 4;
      factors.push({
        id: 'personality-workhorse',
        label: 'Blue-Collar Work Ethic',
        impact: 4,
        type: 'positive',
        description: 'Laser focused on practice execution regardless of outside noise.'
      });
      break;
    case 'Ring Chaser':
      if (winPct >= 0.6) {
        baseScore += 10;
        factors.push({
          id: 'personality-ring-chaser',
          label: 'Contender Ambition',
          impact: 10,
          type: 'positive',
          description: 'Driven by championship aspirations with title contender.'
        });
      } else {
        baseScore -= 10;
        factors.push({
          id: 'personality-ring-chaser-low',
          label: 'Championship Impatience',
          impact: -10,
          type: 'negative',
          description: 'Impatient with rebuilding timeline.'
        });
      }
      break;
  }

  const finalMorale = Math.min(100, Math.max(15, baseScore));

  let status: 'Ecstatic' | 'Motivated' | 'Content' | 'Frustrated' | 'Demoralized' = 'Content';
  let devModifier = 1.0;

  if (finalMorale >= 88) {
    status = 'Ecstatic';
    devModifier = 1.30; // +30% XP gain
  } else if (finalMorale >= 72) {
    status = 'Motivated';
    devModifier = 1.15; // +15% XP gain
  } else if (finalMorale >= 50) {
    status = 'Content';
    devModifier = 1.00; // Standard
  } else if (finalMorale >= 32) {
    status = 'Frustrated';
    devModifier = 0.80; // -20% XP penalty
  } else {
    status = 'Demoralized';
    devModifier = 0.60; // -40% XP penalty & regression risk
  }

  return {
    morale: finalMorale,
    status,
    factors,
    devModifier
  };
};

// ==========================================
// 4. TRAINING PROGRESSION CALCULATION
// ==========================================
export const calculateTrainingProgression = (
  player: Player,
  intensity: 'Low' | 'Medium' | 'High' = 'Medium',
  focusArea: string = 'General Mastery',
  coachBonus: number = 0
): {
  xpEarned: number;
  fatigueCost: number;
  log: string;
} => {
  const devMult = getDevTraitMultiplier(player.developmentTrait);
  const careerPhase = getPlayerCareerPhase(player.age);
  
  // Younger players absorb training much faster
  const ageMult = careerPhase === 'Ascending' ? 1.35 : careerPhase === 'Prime' ? 1.0 : careerPhase === 'Veteran' ? 0.75 : 0.50;
  
  // Intensity modifiers
  let intensityMult = 1.0;
  let fatigueCost = 4;
  if (intensity === 'High') {
    intensityMult = 1.45;
    fatigueCost = 8;
  } else if (intensity === 'Low') {
    intensityMult = 0.65;
    fatigueCost = 1;
  }

  // Morale impact
  const moraleMult = (player.morale || 75) >= 85 ? 1.25 : (player.morale || 75) <= 40 ? 0.75 : 1.0;

  const baseXp = 120 + Math.floor(Math.random() * 50);
  const totalXp = Math.round(baseXp * devMult * ageMult * intensityMult * moraleMult * (1 + coachBonus / 100));

  return {
    xpEarned: totalXp,
    fatigueCost,
    log: `Drill execution in [${focusArea}] awarded +${totalXp} XP (Dev: ${player.developmentTrait} x${devMult}, Morale: ${player.morale}% x${moraleMult.toFixed(2)})`
  };
};

// ==========================================
// 5. IN-GAME PERFORMANCE PROGRESSION
// ==========================================
export const calculateGamePerformanceProgression = (
  player: Player,
  gameStats: any,
  teamWon: boolean
): {
  xpEarned: number;
  performanceScore: number;
  breakoutProgressAdd: number;
  statGains: { stat: keyof PlayerAttributes; amount: number }[];
  log: string;
} => {
  let score = 50; // average 50
  const statGains: { stat: keyof PlayerAttributes; amount: number }[] = [];

  if (player.position === Position.QB) {
    const yds = gameStats?.passYds || 0;
    const tds = gameStats?.passTds || 0;
    const ints = gameStats?.intsThrown || 0;

    if (yds >= 300) score += 25;
    else if (yds >= 220) score += 12;
    else if (yds < 140) score -= 15;

    score += tds * 10;
    score -= ints * 12;

    if (tds >= 3 && ints === 0) {
      statGains.push({ stat: 'shortAccuracy', amount: 1 });
      statGains.push({ stat: 'awareness', amount: 1 });
    }
  } else if (player.position === Position.RB) {
    const yds = gameStats?.rushYds || 0;
    const tds = gameStats?.rushTds || 0;
    if (yds >= 100) score += 30;
    else if (yds >= 65) score += 14;
    else if (yds < 30) score -= 10;
    score += tds * 10;

    if (yds >= 100) {
      statGains.push({ stat: 'bcVision', amount: 1 });
      statGains.push({ stat: 'breakTackle', amount: 1 });
    }
  } else if (player.position === Position.WR || player.position === Position.TE) {
    const yds = gameStats?.recYds || Math.round((gameStats?.passYds || 0) * 0.4);
    const tds = gameStats?.recTds || (gameStats?.passTds ? 1 : 0);
    if (yds >= 90) score += 28;
    else if (yds >= 50) score += 12;
    score += tds * 10;

    if (yds >= 90) {
      statGains.push({ stat: 'catching', amount: 1 });
      statGains.push({ stat: 'shortRouteRunning', amount: 1 });
    }
  } else {
    // Defense / OL
    score += teamWon ? 20 : -10;
    score += Math.floor(Math.random() * 25);
  }

  if (teamWon) score += 15;
  else score -= 10;

  score = Math.min(100, Math.max(10, score));

  // Calculate XP awarded from performance
  const devMult = getDevTraitMultiplier(player.developmentTrait);
  const baseXp = Math.round((score * 3.5) * devMult);

  let breakoutProgressAdd = 0;
  if (score >= 80) breakoutProgressAdd = 1;

  return {
    xpEarned: baseXp,
    performanceScore: score,
    breakoutProgressAdd,
    statGains,
    log: `Game Performance Score [${score}/100] awarded +${baseXp} Performance XP.`
  };
};

// ==========================================
// 6. AGE REGRESSION ENGINE
// ==========================================
export const calculateAgeRegression = (
  player: Player,
  isOffseason: boolean = false
): {
  attributeLosses: { stat: keyof PlayerAttributes; drop: number; label: string }[];
  overallDrop: number;
  log?: string;
} => {
  const age = player.age;
  const dev = player.developmentTrait;
  const attributeLosses: { stat: keyof PlayerAttributes; drop: number; label: string }[] = [];

  // Age 30+ begins gradual decline; Age 33+ accelerates
  if (age < 30) {
    return { attributeLosses: [], overallDrop: 0 };
  }

  // Elite dev traits (Superstar/X-Factor) resist age decline by 50%
  const resistFactor = dev === 'X-Factor' ? 0.4 : dev === 'Superstar' ? 0.6 : dev === 'Star' ? 0.8 : 1.0;

  const currentAttrs = player.attributes || generatePlayerAttributes(player);

  if (age >= 33) {
    // Heavy physical loss
    if (Math.random() < 0.65 * resistFactor) {
      attributeLosses.push({ stat: 'speed', drop: 1, label: 'Speed' });
    }
    if (Math.random() < 0.60 * resistFactor) {
      attributeLosses.push({ stat: 'acceleration', drop: 1, label: 'Acceleration' });
    }
    if (Math.random() < 0.50 * resistFactor) {
      attributeLosses.push({ stat: 'agility', drop: 1, label: 'Agility' });
    }
    if (Math.random() < 0.55 * resistFactor) {
      attributeLosses.push({ stat: 'stamina', drop: 2, label: 'Stamina' });
    }
  } else if (age >= 30) {
    // Mild physical wear
    if (Math.random() < 0.35 * resistFactor) {
      attributeLosses.push({ stat: 'speed', drop: 1, label: 'Speed' });
    }
    if (Math.random() < 0.30 * resistFactor) {
      attributeLosses.push({ stat: 'stamina', drop: 1, label: 'Stamina' });
    }
  }

  const overallDrop = attributeLosses.length >= 3 ? 1 : 0;
  const log = attributeLosses.length > 0 
    ? `Age ${age} Regression: ${attributeLosses.map(a => `-${a.drop} ${a.label}`).join(', ')}`
    : undefined;

  return {
    attributeLosses,
    overallDrop,
    log
  };
};

// ==========================================
// 7. ARCHETYPE UPGRADE PACKAGES
// ==========================================
export const getArchetypeUpgradePackages = (player: Player): ArchetypeUpgradePackage[] => {
  const pos = player.position;

  switch (pos) {
    case Position.QB:
      return [
        {
          name: 'Field General',
          cost: 1,
          description: 'Mastery of pre-snap recognition, timing throws, and red-zone reads.',
          boosts: [
            { attribute: 'awareness', label: 'Awareness', increase: 2 },
            { attribute: 'shortAccuracy', label: 'Short Pass Acc', increase: 1 },
            { attribute: 'mediumAccuracy', label: 'Medium Pass Acc', increase: 1 }
          ]
        },
        {
          name: 'Strong Arm Cannon',
          cost: 1,
          description: 'High velocity throwing power and downfield boundary velocity.',
          boosts: [
            { attribute: 'throwPower', label: 'Throw Power', increase: 2 },
            { attribute: 'deepAccuracy', label: 'Deep Pass Acc', increase: 1 },
            { attribute: 'throwOnRun', label: 'Throw on the Run', increase: 1 }
          ]
        },
        {
          name: 'Scrambler & Playmaker',
          cost: 1,
          description: 'Pocket escapability, designed QB run burst, and ball security.',
          boosts: [
            { attribute: 'speed', label: 'Speed', increase: 1 },
            { attribute: 'agility', label: 'Agility', increase: 1 },
            { attribute: 'breakTackle', label: 'Break Sack / Tackle', increase: 1 },
            { attribute: 'carrying', label: 'Carrying', increase: 1 }
          ]
        }
      ];

    case Position.RB:
      return [
        {
          name: 'Elusive Zone Runner',
          cost: 1,
          description: 'Lateral jump-cuts, second-level agility, and open field breakaway.',
          boosts: [
            { attribute: 'agility', label: 'Agility', increase: 2 },
            { attribute: 'elusiveness', label: 'Elusiveness', increase: 2 },
            { attribute: 'bcVision', label: 'Ball Carrier Vision', increase: 1 }
          ]
        },
        {
          name: 'Power Back Bruiser',
          cost: 1,
          description: 'Downhill between-the-tackles violence and red-zone touchdown conversion.',
          boosts: [
            { attribute: 'trucking', label: 'Trucking', increase: 2 },
            { attribute: 'breakTackle', label: 'Break Tackle', increase: 1 },
            { attribute: 'carrying', label: 'Carrying', increase: 1 }
          ]
        },
        {
          name: 'Receiving Specialist',
          cost: 1,
          description: 'Checkdown hands, angle-route separation, and pass blocking protection.',
          boosts: [
            { attribute: 'catching', label: 'Catching', increase: 2 },
            { attribute: 'catchInTraffic', label: 'Catch in Traffic', increase: 1 },
            { attribute: 'passBlock', label: 'Pass Protection', increase: 1 }
          ]
        }
      ];

    case Position.WR:
      return [
        {
          name: 'Route Technician',
          cost: 1,
          description: 'Surgical footwork, snap-out-of-breaks separation, and sideline toe-tap precision.',
          boosts: [
            { attribute: 'shortRouteRunning', label: 'Short Route', increase: 2 },
            { attribute: 'mediumRouteRunning', label: 'Medium Route', increase: 2 },
            { attribute: 'catching', label: 'Catching', increase: 1 }
          ]
        },
        {
          name: 'Deep Vertical Threat',
          cost: 1,
          description: 'Over-the-top speed burner and post-corner boundary leverage.',
          boosts: [
            { attribute: 'speed', label: 'Speed', increase: 1 },
            { attribute: 'deepRouteRunning', label: 'Deep Route', increase: 2 },
            { attribute: 'spectacularCatch', label: 'Spectacular Catch', increase: 1 }
          ]
        },
        {
          name: 'Contested Catch Specialist',
          cost: 1,
          description: 'Physical press release, jump-ball box-outs, and red-zone combat catches.',
          boosts: [
            { attribute: 'release', label: 'Release vs Press', increase: 2 },
            { attribute: 'catchInTraffic', label: 'Catch in Traffic', increase: 2 },
            { attribute: 'strength', label: 'Strength', increase: 1 }
          ]
        }
      ];

    case Position.DL:
      return [
        {
          name: 'Edge Speed Rusher',
          cost: 1,
          description: 'Ghost moves, bend around offensive tackles, and explosive closing burst.',
          boosts: [
            { attribute: 'finesseMoves', label: 'Finesse Moves', increase: 2 },
            { attribute: 'acceleration', label: 'Acceleration', increase: 1 },
            { attribute: 'pursuit', label: 'Pursuit', increase: 1 }
          ]
        },
        {
          name: 'Power Bull Rusher',
          cost: 1,
          description: 'Pocket collapse power, long-arm leverage, and QB hit intimidation.',
          boosts: [
            { attribute: 'powerMoves', label: 'Power Moves', increase: 2 },
            { attribute: 'blockShedding', label: 'Block Shedding', increase: 1 },
            { attribute: 'hitPower', label: 'Hit Power', increase: 1 }
          ]
        },
        {
          name: 'Run Stopper Anchor',
          cost: 1,
          description: 'Double-team absorption, gap control, and short-yardage stuffing.',
          boosts: [
            { attribute: 'blockShedding', label: 'Block Shedding', increase: 2 },
            { attribute: 'tackle', label: 'Tackling', increase: 2 },
            { attribute: 'strength', label: 'Strength', increase: 1 }
          ]
        }
      ];

    case Position.CB:
    case Position.S:
      return [
        {
          name: 'Lockdown Man Coverage',
          cost: 1,
          description: 'Hip fluidity, mirror technique, and physical jam at the line of scrimmage.',
          boosts: [
            { attribute: 'manCoverage', label: 'Man Coverage', increase: 2 },
            { attribute: 'press', label: 'Press Technique', increase: 2 },
            { attribute: 'speed', label: 'Speed', increase: 1 }
          ]
        },
        {
          name: 'Zone Ball Hawk',
          cost: 1,
          description: 'Passing lane anticipation, interception instincts, and field vision.',
          boosts: [
            { attribute: 'zoneCoverage', label: 'Zone Coverage', increase: 2 },
            { attribute: 'playRecognition', label: 'Play Recognition', increase: 2 },
            { attribute: 'awareness', label: 'Awareness', increase: 1 }
          ]
        },
        {
          name: 'Hard Hitting Enforcer',
          cost: 1,
          description: 'Run support alley filling, screen containment, and fumble-causing hit power.',
          boosts: [
            { attribute: 'tackle', label: 'Tackling', increase: 2 },
            { attribute: 'hitPower', label: 'Hit Power', increase: 2 },
            { attribute: 'pursuit', label: 'Pursuit', increase: 1 }
          ]
        }
      ];

    default:
      return [
        {
          name: 'Positional Fundamentals',
          cost: 1,
          description: 'Core technique, physical conditioning, and football execution.',
          boosts: [
            { attribute: 'awareness', label: 'Awareness', increase: 2 },
            { attribute: 'stamina', label: 'Stamina', increase: 2 },
            { attribute: 'strength', label: 'Strength', increase: 1 }
          ]
        }
      ];
  }
};

// ==========================================
// 8. SPEND SKILL POINT
// ==========================================
export const spendSkillPoint = (
  player: Player,
  archepackageName: string
): {
  updatedPlayer: Player;
  boostedStats: { stat: string; oldValue: number; newValue: number }[];
} => {
  if ((player.skillPoints || 0) < 1) {
    return { updatedPlayer: player, boostedStats: [] };
  }

  const packages = getArchetypeUpgradePackages(player);
  const chosenPkg = packages.find(p => p.name === archepackageName) || packages[0];
  const currentAttrs = { ...(player.attributes || generatePlayerAttributes(player)) };
  const boostedStats: { stat: string; oldValue: number; newValue: number }[] = [];

  chosenPkg.boosts.forEach(boost => {
    const currentVal = (currentAttrs as any)[boost.attribute] || 75;
    const newVal = Math.min(99, currentVal + boost.increase);
    (currentAttrs as any)[boost.attribute] = newVal;
    boostedStats.push({
      stat: boost.label,
      oldValue: currentVal,
      newValue: newVal
    });
  });

  const oldOvr = player.overall;
  const newOvr = Math.min(99, oldOvr + 1);

  const historyEntry: ProgressionHistoryEntry = {
    id: `prog-${Date.now()}-${Math.random()}`,
    week: 1,
    season: 2027,
    type: 'SKILL_POINT',
    title: `Skill Point Invested: [${chosenPkg.name}]`,
    description: `Upgraded archetype package granting ${boostedStats.map(s => `+${s.newValue - s.oldValue} ${s.stat}`).join(', ')}. Overall rating elevated to ${newOvr} OVR!`,
    statChanges: boostedStats.map(s => `+${s.newValue - s.oldValue} ${s.stat}`),
    date: new Date().toLocaleDateString()
  };

  const updatedPlayer: Player = {
    ...player,
    overall: newOvr,
    schemeOvr: Math.min(99, (player.schemeOvr || player.overall) + 1),
    skillPoints: (player.skillPoints || 1) - 1,
    attributes: currentAttrs,
    progressionHistory: [historyEntry, ...(player.progressionHistory || [])]
  };

  return {
    updatedPlayer,
    boostedStats
  };
};

// ==========================================
// 9. COACH 1-ON-1 INTERACTION (MORALE BOOSTER)
// ==========================================
export const conductCoachMeeting = (
  player: Player,
  actionType: 'PEP_TALK' | 'ROLE_PROMISE' | 'TARGET_PROMISE' | 'CONTRACT_ASSURANCE' | 'PRAISE'
): {
  updatedPlayer: Player;
  message: string;
  moraleDelta: number;
} => {
  let moraleDelta = 10;
  let message = '';

  switch (actionType) {
    case 'PEP_TALK':
      moraleDelta = 12 + Math.floor(Math.random() * 8);
      message = `Held private film session and 1-on-1 encouragement with ${player.name}. Player feels valued and motivated!`;
      break;
    case 'ROLE_PROMISE':
      moraleDelta = 18;
      message = `Promised expanded starting snap count in upcoming gameplan. ${player.name} is fired up to prove their worth!`;
      break;
    case 'TARGET_PROMISE':
      moraleDelta = 15;
      message = `Scripted first-read target packages for ${player.name}. Morale surged significantly!`;
      break;
    case 'CONTRACT_ASSURANCE':
      moraleDelta = 14;
      message = `Assured ${player.name} of long-term contract extension talks in the upcoming offseason window.`;
      break;
    case 'PRAISE':
      moraleDelta = 10;
      message = `Praised ${player.name}'s leadership and tape to the media during press briefing.`;
      break;
  }

  const newMorale = Math.min(100, (player.morale || 75) + moraleDelta);

  const historyEntry: ProgressionHistoryEntry = {
    id: `morale-action-${Date.now()}`,
    week: 1,
    season: 2027,
    type: 'MORALE_BOOST',
    title: `Coach Intervention: ${actionType.replace('_', ' ')}`,
    description: `${message} Morale increased by +${moraleDelta} (${player.morale} -> ${newMorale}%).`,
    statChanges: [`+${moraleDelta}% Morale`],
    date: new Date().toLocaleDateString()
  };

  const updatedPlayer: Player = {
    ...player,
    morale: newMorale,
    progressionHistory: [historyEntry, ...(player.progressionHistory || [])]
  };

  return {
    updatedPlayer,
    message,
    moraleDelta
  };
};

// ==========================================
// 9.5. CAREER MILESTONES & RECORDS TRACKER ENGINE
// ==========================================
export interface MilestoneRecordData {
  totalYards: number;
  yardsTarget: number;
  yardsPct: number;
  touchdowns: number;
  tdsTarget: number;
  tdsPct: number;
  sacks: number;
  sacksTarget: number;
  sacksPct: number;
  proBowls: number;
  proBowlsTarget: number;
  proBowlsPct: number;
  allProCount: number;
  nextMilestoneLabel: string;
  milestonesList: CareerMilestone[];
}

export const calculatePlayerCareerMilestones = (player: Player): MilestoneRecordData => {
  const age = player.age || 26;
  const seasonsPlayed = Math.max(1, age - 21);
  const pos = player.position;
  const ovr = player.overall || 75;
  const currentYards = player.stats?.yards || 0;
  const currentTDs = player.stats?.touchdowns || 0;
  const currentSacks = player.stats?.sacks || 0;

  // 1. Total Yards (Passing, Rushing, Receiving)
  let totalYards = player.stats?.careerYards ?? 0;
  if (totalYards === 0) {
    if (pos === Position.QB) {
      totalYards = Math.round((seasonsPlayed - 1) * Math.max(1200, (ovr - 65) * 110) + currentYards);
    } else if (pos === Position.RB) {
      totalYards = Math.round((seasonsPlayed - 1) * Math.max(400, (ovr - 68) * 45) + currentYards);
    } else if (pos === Position.WR) {
      totalYards = Math.round((seasonsPlayed - 1) * Math.max(450, (ovr - 68) * 40) + currentYards);
    } else if (pos === Position.TE) {
      totalYards = Math.round((seasonsPlayed - 1) * Math.max(250, (ovr - 70) * 28) + currentYards);
    } else {
      totalYards = 0;
    }
  }

  // Yards Threshold Ladder
  const yardTiers = [1000, 2500, 5000, 10000, 15000, 20000, 30000, 40000, 50000];
  const nextYardTarget = yardTiers.find(t => t > totalYards) || 60000;
  const prevYardTier = [...yardTiers].reverse().find(t => t <= totalYards) || 0;
  const yardsPct = Math.min(100, Math.max(5, Math.round(((totalYards - prevYardTier) / (nextYardTarget - prevYardTier)) * 100)));

  // 2. Touchdowns
  let touchdowns = player.stats?.careerTouchdowns ?? 0;
  if (touchdowns === 0) {
    if (pos === Position.QB) {
      touchdowns = Math.round((seasonsPlayed - 1) * Math.max(8, (ovr - 68) * 0.9) + currentTDs);
    } else if (pos === Position.RB) {
      touchdowns = Math.round((seasonsPlayed - 1) * Math.max(4, (ovr - 70) * 0.4) + currentTDs);
    } else if (pos === Position.WR || pos === Position.TE) {
      touchdowns = Math.round((seasonsPlayed - 1) * Math.max(3, (ovr - 70) * 0.35) + currentTDs);
    } else {
      touchdowns = 0;
    }
  }

  const tdTiers = [10, 25, 50, 75, 100, 150, 200, 250];
  const nextTdTarget = tdTiers.find(t => t > touchdowns) || 300;
  const prevTdTier = [...tdTiers].reverse().find(t => t <= touchdowns) || 0;
  const tdsPct = Math.min(100, Math.max(5, Math.round(((touchdowns - prevTdTier) / (nextTdTarget - prevTdTier)) * 100)));

  // 3. Sacks
  let sacks = player.stats?.careerSacks ?? 0;
  if (sacks === 0) {
    if (pos === Position.DL) {
      sacks = parseFloat(((seasonsPlayed - 1) * Math.max(2.5, (ovr - 70) * 0.35) + currentSacks).toFixed(1));
    } else if (pos === Position.LB) {
      sacks = parseFloat(((seasonsPlayed - 1) * Math.max(1.5, (ovr - 72) * 0.2) + currentSacks).toFixed(1));
    } else if (pos === Position.CB || pos === Position.S) {
      sacks = parseFloat(((seasonsPlayed - 1) * 0.5 + currentSacks).toFixed(1));
    } else {
      sacks = 0;
    }
  }

  const sackTiers = [5, 10, 25, 50, 75, 100, 125, 150];
  const nextSackTarget = sackTiers.find(t => t > sacks) || 175;
  const prevSackTier = [...sackTiers].reverse().find(t => t <= sacks) || 0;
  const sacksPct = Math.min(100, Math.max(5, Math.round(((sacks - prevSackTier) / (nextSackTarget - prevSackTier)) * 100)));

  // 4. Pro Bowl Selections
  let proBowls = player.stats?.careerProBowls ?? player.stats?.proBowls ?? 0;
  if (proBowls === 0 && ovr >= 84 && age >= 23) {
    const primeSeasons = Math.max(1, age - 23);
    proBowls = ovr >= 94 ? Math.min(primeSeasons, Math.floor(primeSeasons * 0.85) + 1) :
               ovr >= 89 ? Math.min(primeSeasons, Math.floor(primeSeasons * 0.55)) :
               ovr >= 85 ? Math.min(primeSeasons, Math.floor(primeSeasons * 0.3)) : 0;
  }
  const allProCount = player.stats?.allPro ?? (ovr >= 93 ? Math.max(1, Math.floor(proBowls * 0.6)) : 0);

  const proBowlTiers = [1, 3, 5, 7, 10, 12];
  const nextProBowlTarget = proBowlTiers.find(t => t > proBowls) || 15;
  const prevProBowlTier = [...proBowlTiers].reverse().find(t => t <= proBowls) || 0;
  const proBowlsPct = Math.min(100, Math.max(10, Math.round(((proBowls - prevProBowlTier) / (nextProBowlTarget - prevProBowlTier)) * 100)));

  // Generate Milestones Timeline list
  const milestonesList: CareerMilestone[] = [...(player.milestones || [])];

  if (milestonesList.length === 0) {
    if (proBowls > 0) {
      milestonesList.push({
        id: `ms-pb-${player.id}`,
        year: 2026,
        title: `${proBowls}x Pro Bowl Selection`,
        category: 'HONOR',
        description: `Voted as starter/roster member to ${proBowls} NFL Pro Bowl games across their career.`,
        metric: 'Pro Bowls',
        value: proBowls,
        threshold: proBowls,
        isAchieved: true
      });
    }

    if (totalYards >= 5000) {
      milestonesList.push({
        id: `ms-yds-${player.id}`,
        year: 2025,
        title: `${totalYards.toLocaleString()} Career Yards Milestone`,
        category: 'RECORD',
        description: `Eclipsed ${Math.floor(totalYards / 5000) * 5000}+ total offensive yards plateau.`,
        metric: 'Career Yards',
        value: totalYards,
        threshold: Math.floor(totalYards / 5000) * 5000,
        isAchieved: true
      });
    }

    if (touchdowns >= 25) {
      milestonesList.push({
        id: `ms-td-${player.id}`,
        year: 2025,
        title: `${touchdowns} Career Touchdown Century Mark`,
        category: 'RECORD',
        description: `Responsible for ${touchdowns} total career scores.`,
        metric: 'Touchdowns',
        value: touchdowns,
        threshold: 25,
        isAchieved: true
      });
    }

    if (sacks >= 20) {
      milestonesList.push({
        id: `ms-sack-${player.id}`,
        year: 2025,
        title: `${sacks} Career Sacks Plateau`,
        category: 'RECORD',
        description: `Anchored defensive pass rush with ${sacks} career quarterback sacks.`,
        metric: 'Career Sacks',
        value: sacks,
        threshold: 20,
        isAchieved: true
      });
    }

    // Next In-Progress Milestone
    if (pos === Position.QB || pos === Position.RB || pos === Position.WR || pos === Position.TE) {
      milestonesList.push({
        id: `ms-next-yds-${player.id}`,
        year: 2027,
        title: `Target: ${nextYardTarget.toLocaleString()} Career Yards Club`,
        category: 'RECORD',
        description: `Needs ${(nextYardTarget - totalYards).toLocaleString()} more total offensive yards to unlock the next milestone badge.`,
        metric: 'Career Yards',
        value: totalYards,
        threshold: nextYardTarget,
        isAchieved: false
      });
    } else if (pos === Position.DL || pos === Position.LB) {
      milestonesList.push({
        id: `ms-next-sacks-${player.id}`,
        year: 2027,
        title: `Target: ${nextSackTarget} Career Sacks Elite Club`,
        category: 'RECORD',
        description: `Needs ${(nextSackTarget - sacks).toFixed(1)} more sacks to reach the ${nextSackTarget} sack landmark.`,
        metric: 'Career Sacks',
        value: sacks,
        threshold: nextSackTarget,
        isAchieved: false
      });
    }
  }

  const nextMilestoneLabel = (pos === Position.DL || pos === Position.LB) 
    ? `${(nextSackTarget - sacks).toFixed(1)} Sacks to ${nextSackTarget} Club`
    : `${(nextYardTarget - totalYards).toLocaleString()} Yards to ${nextYardTarget.toLocaleString()} Club`;

  return {
    totalYards,
    yardsTarget: nextYardTarget,
    yardsPct,
    touchdowns,
    tdsTarget: nextTdTarget,
    tdsPct,
    sacks,
    sacksTarget: nextSackTarget,
    sacksPct,
    proBowls,
    proBowlsTarget: nextProBowlTarget,
    proBowlsPct,
    allProCount,
    nextMilestoneLabel,
    milestonesList
  };
};

// ==========================================
// 9.6. RETIREMENT EVALUATION ENGINE
// ==========================================
export const checkPlayerRetirement = (
  player: Player,
  isOffseason: boolean = false
): {
  willRetire: boolean;
  reason: string;
  seasonsPlayed: number;
  careerHighlights: string[];
  hallOfFameEligible: boolean;
} => {
  const age = player.age || 26;
  const seasonsPlayed = Math.max(1, age - 21);
  const morale = player.morale || 75;
  const durability = player.durability ?? 85;
  const injuriesCount = (player.injuryHistory || []).length;
  const ovr = player.overall || 75;
  const milestonesData = calculatePlayerCareerMilestones(player);

  const hallOfFameEligible = 
    milestonesData.proBowls >= 5 || 
    milestonesData.allProCount >= 3 || 
    (milestonesData.totalYards >= 12000 && milestonesData.touchdowns >= 75) || 
    milestonesData.sacks >= 75 || 
    (ovr >= 93 && age >= 33);

  // Under 31 players almost never retire unless severe injury crisis
  if (age < 31 && durability >= 60 && injuriesCount < 3) {
    return {
      willRetire: false,
      reason: 'Active prime career',
      seasonsPlayed,
      careerHighlights: [],
      hallOfFameEligible
    };
  }

  // Calculate Retirement Inclination Score (0 - 100)
  let retirementScore = 0;

  // 1. Age Factor (Weight: 45%)
  if (age >= 38) retirementScore += 75;
  else if (age >= 36) retirementScore += 50;
  else if (age >= 34) retirementScore += 30;
  else if (age >= 32) retirementScore += 15;
  else if (age >= 31) retirementScore += 5;

  // 2. Durability & Injury History Factor (Weight: 30%)
  if (durability < 65) retirementScore += 25;
  else if (durability < 75) retirementScore += 15;
  if (injuriesCount >= 3) retirementScore += 25;
  else if (injuriesCount >= 1) retirementScore += 10;

  // 3. Declining Morale Factor (Weight: 25%)
  if (morale < 40) retirementScore += 25;
  else if (morale < 55) retirementScore += 15;
  else if (morale < 70) retirementScore += 5;

  // 4. Performance / Overall Rating Erosion
  if (age >= 32 && ovr < 72) retirementScore += 20;

  // Determine Retirement Decision
  const willRetire = isOffseason && (
    age >= 39 ||
    (age >= 36 && retirementScore >= 45) ||
    (age >= 33 && retirementScore >= 60) ||
    (age >= 31 && retirementScore >= 80)
  );

  let reason = 'Retiring to pursue family and post-career coaching opportunities.';
  if (injuriesCount >= 2 || durability < 70) {
    reason = `Chronic wear on knees/joints and ${injuriesCount} recorded in-game injuries led to veteran retirement after ${seasonsPlayed} NFL seasons.`;
  } else if (morale < 50) {
    reason = `Frustration with declining offensive/defensive role and locker room morale prompted retirement at age ${age}.`;
  } else if (age >= 36) {
    reason = `Remarkable ${seasonsPlayed}-season NFL tenure concluded. Veteran hangs up the cleats with full health and high respect across the league.`;
  }

  const careerHighlights = [
    `${seasonsPlayed} NFL Seasons Completed`,
    milestonesData.proBowls > 0 ? `${milestonesData.proBowls}x Pro Bowl Selection` : `${ovr} Peak OVR Rating`,
    milestonesData.totalYards > 0 ? `${milestonesData.totalYards.toLocaleString()} Total Career Yards (${milestonesData.touchdowns} TDs)` : `${milestonesData.sacks} Career Sacks`,
    hallOfFameEligible ? '★ ELIGIBLE FOR PRO FOOTBALL HALL OF FAME' : 'Franchise Veteran Leader'
  ];

  return {
    willRetire,
    reason,
    seasonsPlayed,
    careerHighlights,
    hallOfFameEligible
  };
};

// ==========================================
// 10. MASTER ADVANCE WEEK PROGRESSION
// ==========================================
export const advanceWeekProgression = (
  players: Player[],
  currentWeek: number,
  currentSeason: number,
  teams: Record<string, any>,
  selectedTeamId: string,
  groupFocusSettings?: any[],
  matchResults?: any,
  isOffseasonTransition: boolean = false
): {
  updatedPlayers: Player[];
  summary: ProgressionWeekSummary;
} => {
  const isOffseason = isOffseasonTransition || currentWeek >= 18;

  const summary: ProgressionWeekSummary = {
    week: currentWeek,
    season: currentSeason,
    leveledUpPlayers: [],
    trainingHighlights: [],
    breakoutEvents: [],
    regressedVeterans: [],
    moraleShifts: [],
    retiredPlayers: []
  };

  const processedPlayers: Player[] = [];

  players.forEach(player => {
    const isUserTeam = player.teamId === selectedTeamId;
    const team = teams[player.teamId] || { record: '1-0-0' };
    const isStarter = (player.depth || 0) === 0;

    // Check Retirement during Off-Season Transition
    if (isOffseason) {
      const retirement = checkPlayerRetirement(player, isOffseason);
      if (retirement.willRetire) {
        summary.retiredPlayers?.push({
          player,
          age: player.age,
          position: player.position,
          reason: retirement.reason,
          seasonsPlayed: retirement.seasonsPlayed,
          careerHighlights: retirement.careerHighlights,
          hallOfFameEligible: retirement.hallOfFameEligible
        });

        if (isUserTeam) {
          summary.regressedVeterans.push({
            playerName: player.name,
            age: player.age,
            position: player.position,
            attributeLosses: [`ANNOUNCED RETIREMENT (${retirement.reason})`]
          });
        }

        // Automatically remove retired player from active roster by marking teamId as 'RETIRED'
        // or omitting from active team roster
        return; // Skip adding to updatedPlayers active roster
      }
    }

    // Ensure player attributes exist
    const currentAttrs = player.attributes || generatePlayerAttributes(player);
    let currentXp = player.xp || 0;
    const xpThreshold = player.xpToNextLevel || 1000;
    let skillPoints = player.skillPoints || 0;
    let ovr = player.overall;
    let schemeOvr = player.schemeOvr || ovr;
    let devTrait = player.developmentTrait;
    const history = [...(player.progressionHistory || [])];

    // 1. Calculate updated Morale
    const moraleResult = calculateMorale(player, team, isStarter, true, 1);
    const oldMorale = player.morale || 75;
    const newMorale = moraleResult.morale;

    if (isUserTeam && Math.abs(newMorale - oldMorale) >= 8) {
      summary.moraleShifts.push({
        playerName: player.name,
        position: player.position,
        oldMorale,
        newMorale,
        reason: moraleResult.status === 'Ecstatic' ? 'Fired up from team winning momentum and starter status' : 'Frustrated with lack of reps / contract status'
      });
    }

    // 2. Training XP
    const trainingResult = calculateTrainingProgression(
      player, 
      'Medium', 
      player.trainingFocus || 'Core Technique'
    );
    currentXp += trainingResult.xpEarned;

    if (isUserTeam && trainingResult.xpEarned >= 250) {
      summary.trainingHighlights.push({
        playerName: player.name,
        position: player.position,
        focus: player.trainingFocus || 'Core Technique',
        xpGained: trainingResult.xpEarned
      });
    }

    // 3. Game Performance XP (If user team or simulated)
    const perfResult = calculateGamePerformanceProgression(player, matchResults, true);
    currentXp += perfResult.xpEarned;

    // Apply immediate performance stat boosts if any
    perfResult.statGains.forEach(gain => {
      const cur = (currentAttrs as any)[gain.stat] || 75;
      (currentAttrs as any)[gain.stat] = Math.min(99, cur + gain.amount);
    });

    // 4. Age Regression for 30+ veterans
    const regressionResult = calculateAgeRegression(player);
    if (regressionResult.attributeLosses.length > 0) {
      regressionResult.attributeLosses.forEach(loss => {
        const cur = (currentAttrs as any)[loss.stat] || 75;
        (currentAttrs as any)[loss.stat] = Math.max(50, cur - loss.drop);
      });

      if (isUserTeam) {
        summary.regressedVeterans.push({
          playerName: player.name,
          age: player.age,
          position: player.position,
          attributeLosses: regressionResult.attributeLosses.map(a => `-${a.drop} ${a.label}`)
        });

        history.unshift({
          id: `reg-${Date.now()}-${player.id}`,
          week: currentWeek,
          season: currentSeason,
          type: 'AGE_REGRESSION',
          title: `Veteran Age Wear: Age ${player.age}`,
          description: `Physical wear resulted in: ${regressionResult.attributeLosses.map(a => `-${a.drop} ${a.label}`).join(', ')}.`,
          statChanges: regressionResult.attributeLosses.map(a => `-${a.drop} ${a.label}`),
          date: `Week ${currentWeek}`
        });
      }
    }

    // 5. Level Up / Skill Point Check
    let leveledUp = false;
    let oldOvrLevel = ovr;
    while (currentXp >= xpThreshold) {
      currentXp -= xpThreshold;
      skillPoints += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      // Auto-award 1 OVR on level up for non-user teams, or keep skill point for user
      if (!isUserTeam) {
        ovr = Math.min(99, ovr + 1);
        schemeOvr = Math.min(99, schemeOvr + 1);
        skillPoints = 0;
      }

      if (isUserTeam) {
        summary.leveledUpPlayers.push({
          player: { ...player, overall: ovr, skillPoints },
          oldOvr: oldOvrLevel,
          newOvr: ovr,
          skillPointsGained: 1
        });

        history.unshift({
          id: `lvl-${Date.now()}-${player.id}`,
          week: currentWeek,
          season: currentSeason,
          type: 'TRAINING',
          title: `Skill Point Earned! Level Up!`,
          description: `Accumulated 1,000 XP through elite practice & game performance. Ready to spend 1 Skill Point on Archetype upgrade.`,
          statChanges: ['+1 Skill Point Available'],
          date: `Week ${currentWeek}`
        });
      }
    }

    // 6. Breakout Scenario Check (Young players with high performance)
    if (isUserTeam && player.age <= 25 && devTrait !== 'X-Factor' && Math.random() < 0.08) {
      const nextDev = devTrait === 'Normal' ? 'Star' : devTrait === 'Star' ? 'Superstar' : 'X-Factor';
      devTrait = nextDev;
      summary.breakoutEvents.push({
        playerName: player.name,
        position: player.position,
        oldDev: player.developmentTrait,
        newDev: nextDev,
        headline: `BREAKOUT PLAYER EVENT :: ${player.name} elevated to ${nextDev} Dev Trait!`
      });

      history.unshift({
        id: `breakout-${Date.now()}-${player.id}`,
        week: currentWeek,
        season: currentSeason,
        type: 'BREAKOUT',
        title: `BREAKOUT PLAYER OF THE WEEK!`,
        description: `Stellar tape and dynamic ceiling elevated player's development trait from ${player.developmentTrait} to ${nextDev}!`,
        statChanges: [`Dev Trait: ${nextDev}`],
        date: `Week ${currentWeek}`
      });
    }

    // Dynamic Career Milestones Sync
    const calculatedMilestones = calculatePlayerCareerMilestones({ ...player, overall: ovr });

    processedPlayers.push({
      ...player,
      overall: ovr,
      schemeOvr,
      morale: newMorale,
      moraleFactors: moraleResult.factors,
      attributes: currentAttrs,
      xp: currentXp,
      xpToNextLevel: xpThreshold,
      skillPoints,
      developmentTrait: devTrait,
      careerPhase: getPlayerCareerPhase(player.age),
      progressionHistory: history.slice(0, 15),
      milestones: calculatedMilestones.milestonesList,
      stats: {
        ...player.stats,
        careerYards: calculatedMilestones.totalYards,
        careerTouchdowns: calculatedMilestones.touchdowns,
        careerSacks: calculatedMilestones.sacks,
        careerProBowls: calculatedMilestones.proBowls
      }
    });
  });

  return {
    updatedPlayers: processedPlayers,
    summary
  };
};
