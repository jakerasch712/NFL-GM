import { Play, GameEvent } from '../types';

export interface GameState {
  down: number;
  distance: number;
  ballOn: number;
  quarter: number;
  time: string;
  homeScore: number;
  awayScore: number;
  possession: 'HOME' | 'AWAY';
}

/**
 * Calculates the outcome of a play based on the play type and random factors
 * @param play - The play being executed
 * @param currentBallPosition - Current field position (0-100)
 * @returns GameEvent with description, yardage, score status, and type
 */
export const calculateOutcome = (play: Play, currentBallPosition: number): GameEvent => {
  const roll = Math.random();
  let yardage = 0;
  let description = '';
  let isScore = false;
  let type: GameEvent['type'] = play.type;

  // Turnover check (5% chance)
  if (roll < 0.05) {
    type = 'Turnover';
    description = `INTERCEPTED! The defender jumps the route on the ${play.name}.`;
    yardage = 0;
  } else if (roll < play.successRate) {
    // Successful play
    const bigPlay = Math.random() < (play.reward / 20);
    const baseGain = Math.floor(Math.random() * 8) + 2; // 2-10 yards
    yardage = bigPlay ? baseGain + Math.floor(Math.random() * 20) + 10 : baseGain;
    description = `${play.type === 'Pass' ? 'Complete' : 'Run'} for ${yardage} yards using ${play.name}.`;
  } else {
    // Failed play
    const sack = play.type === 'Pass' && Math.random() < 0.2;
    yardage = sack ? -Math.floor(Math.random() * 8) - 1 : 0; // Sacks are -1 to -8 yards
    description = sack
      ? `SACKED! Loss of ${Math.abs(yardage)} on the play.`
      : play.type === 'Pass'
        ? `Incomplete pass intended for Collins.`
        : `Stuffed at the line of scrimmage. No gain.`;
  }

  // Touchdown check
  if (currentBallPosition + yardage >= 100) {
    isScore = true;
    yardage = 100 - currentBallPosition;
    description = `TOUCHDOWN! Explosive play on the ${play.name}!`;
  }

  return { description, yardage, isScore, type };
};

/**
 * Updates the game state based on the outcome of a play
 * @param currentState - Current game state
 * @param event - The game event that occurred
 * @returns Updated game state
 */
export const updateGameState = (currentState: GameState, event: GameEvent): GameState => {
  if (event.isScore) {
    // Touchdown scored - reset to own 25 with automatic PAT
    return {
      ...currentState,
      homeScore: currentState.homeScore + 7,
      ballOn: 25,
      down: 1,
      distance: 10
    };
  }

  let newBallOn = currentState.ballOn + event.yardage;
  let newDown = currentState.down + 1;
  let newDist = currentState.distance - event.yardage;

  // First down conversion
  if (newDist <= 0) {
    newDown = 1;
    newDist = 10;
  }

  // Turnover on downs
  if (newDown > 4) {
    newDown = 1;
    newDist = 10;
    // In a real app, this would switch possession
  }

  return {
    ...currentState,
    ballOn: newBallOn,
    down: newDown,
    distance: newDist
  };
};

/**
 * Calculates win probability adjustment based on game event
 * @param currentProb - Current win probability
 * @param event - The game event that occurred
 * @returns Adjusted win probability (clamped between 1 and 99)
 */
export const calculateWinProbability = (currentProb: number, event: GameEvent): number => {
  let adjustment = 0;

  if (event.isScore) {
    adjustment = 5;
  } else if (event.yardage > 10) {
    adjustment = 2;
  } else if (event.yardage < 0) {
    adjustment = -2;
  }

  const newProb = currentProb + adjustment;
  return Math.min(99, Math.max(1, newProb));
};
