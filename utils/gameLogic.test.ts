import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateOutcome, updateGameState, calculateWinProbability, GameState } from './gameLogic';
import { Play, GameEvent } from '../types';

describe('gameLogic', () => {
  describe('calculateOutcome', () => {
    const mockPlay: Play = {
      id: '1',
      name: 'PA Boot',
      type: 'Pass',
      formation: 'Shotgun',
      risk: 7,
      reward: 9,
      successRate: 0.65
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return turnover when roll < 0.05', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.04);

      const result = calculateOutcome(mockPlay, 50);

      expect(result.type).toBe('Turnover');
      expect(result.yardage).toBe(0);
      expect(result.isScore).toBe(false);
      expect(result.description).toContain('INTERCEPTED');
    });

    it('should return successful play when roll is between 0.05 and successRate', () => {
      // First call for main roll (0.3 < 0.65, so success)
      // Second call for bigPlay check
      // Third call for baseGain
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.9)  // Big play check - no
        .mockReturnValueOnce(0.5); // Base gain (0.5 * 8 = 4, +2 = 6 yards)

      const result = calculateOutcome(mockPlay, 50);

      expect(result.type).toBe('Pass');
      expect(result.yardage).toBeGreaterThan(0);
      expect(result.isScore).toBe(false);
      expect(result.description).toContain('Complete');
    });

    it('should return big play when bigPlay condition is met', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.1)  // Big play check - YES (< reward/20 = 9/20 = 0.45)
        .mockReturnValueOnce(0.5)  // Base gain
        .mockReturnValueOnce(0.5); // Extra yardage

      const result = calculateOutcome(mockPlay, 50);

      expect(result.type).toBe('Pass');
      expect(result.yardage).toBeGreaterThanOrEqual(12); // baseGain + at least 10
      expect(result.isScore).toBe(false);
    });

    it('should return incomplete pass when play fails', () => {
      // Roll > successRate, not a sack
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.7)  // Main roll - fail
        .mockReturnValueOnce(0.3); // Sack check - no

      const result = calculateOutcome(mockPlay, 50);

      expect(result.yardage).toBe(0);
      expect(result.isScore).toBe(false);
      expect(result.description).toContain('Incomplete pass');
    });

    it('should return sack with negative yardage when pass play fails and sack occurs', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.7)  // Main roll - fail
        .mockReturnValueOnce(0.1)  // Sack check - YES (< 0.2)
        .mockReturnValueOnce(0.5); // Sack yardage

      const result = calculateOutcome(mockPlay, 50);

      expect(result.yardage).toBeLessThan(0);
      expect(result.isScore).toBe(false);
      expect(result.description).toContain('SACKED');
      expect(result.description).toContain('Loss of');
    });

    it('should return stuffed run when run play fails', () => {
      const runPlay: Play = { ...mockPlay, type: 'Run' };

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.7); // Main roll - fail

      const result = calculateOutcome(runPlay, 50);

      expect(result.yardage).toBe(0);
      expect(result.isScore).toBe(false);
      expect(result.description).toContain('Stuffed at the line');
    });

    it('should detect touchdown when yardage reaches 100', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.9)  // Big play - no
        .mockReturnValueOnce(1.0); // Max base gain (10 yards)

      const result = calculateOutcome(mockPlay, 90);

      expect(result.isScore).toBe(true);
      expect(result.yardage).toBe(10); // Exactly to endzone
      expect(result.description).toContain('TOUCHDOWN');
    });

    it('should detect touchdown when yardage exceeds 100', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.1)  // Big play - YES
        .mockReturnValueOnce(0.5)  // Base gain
        .mockReturnValueOnce(0.5); // Extra yardage

      const result = calculateOutcome(mockPlay, 90);

      expect(result.isScore).toBe(true);
      expect(result.yardage).toBe(10); // Capped at endzone
      expect(result.description).toContain('TOUCHDOWN');
    });

    it('should handle edge case: long touchdown from own 1', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.1)  // Big play - YES
        .mockReturnValueOnce(1.0)  // Max base gain (floor(1.0 * 8) + 2 = 10)
        .mockReturnValueOnce(1.0); // Max extra yardage (floor(1.0 * 20) + 10 = 30)

      // Max yardage = 10 + 30 = 40 yards
      const result = calculateOutcome(mockPlay, 60);

      expect(result.isScore).toBe(true);
      expect(result.yardage).toBe(40); // 60 + 40 = 100
    });

    it('should handle edge case: already at endzone', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Main roll - success
        .mockReturnValueOnce(0.9)  // Big play - no
        .mockReturnValueOnce(0.0); // Min base gain (2 yards)

      const result = calculateOutcome(mockPlay, 99);

      expect(result.isScore).toBe(true);
      expect(result.yardage).toBe(1);
    });
  });

  describe('updateGameState', () => {
    let initialState: GameState;

    beforeEach(() => {
      initialState = {
        down: 1,
        distance: 10,
        ballOn: 25,
        quarter: 1,
        time: '12:45',
        homeScore: 0,
        awayScore: 0,
        possession: 'HOME'
      };
    });

    it('should reset to own 25 and add 7 points on touchdown', () => {
      const event: GameEvent = {
        description: 'TOUCHDOWN!',
        yardage: 10,
        isScore: true,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.homeScore).toBe(7);
      expect(newState.ballOn).toBe(25);
      expect(newState.down).toBe(1);
      expect(newState.distance).toBe(10);
    });

    it('should advance down by 1 on incomplete play', () => {
      const event: GameEvent = {
        description: 'Incomplete',
        yardage: 0,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.down).toBe(2);
      expect(newState.distance).toBe(10);
      expect(newState.ballOn).toBe(25);
    });

    it('should update ball position and reduce distance on successful play', () => {
      const event: GameEvent = {
        description: 'Complete for 5 yards',
        yardage: 5,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.down).toBe(2);
      expect(newState.distance).toBe(5);
      expect(newState.ballOn).toBe(30);
    });

    it('should convert first down when distance <= 0', () => {
      const event: GameEvent = {
        description: 'Complete for 12 yards',
        yardage: 12,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.down).toBe(1);
      expect(newState.distance).toBe(10);
      expect(newState.ballOn).toBe(37);
    });

    it('should convert first down when distance exactly reaches 0', () => {
      const event: GameEvent = {
        description: 'Complete for 10 yards',
        yardage: 10,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.down).toBe(1);
      expect(newState.distance).toBe(10);
      expect(newState.ballOn).toBe(35);
    });

    it('should handle turnover on downs when down > 4', () => {
      const state: GameState = { ...initialState, down: 4, distance: 10 };
      const event: GameEvent = {
        description: 'Incomplete',
        yardage: 0,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(state, event);

      expect(newState.down).toBe(1);
      expect(newState.distance).toBe(10);
    });

    it('should handle negative yardage (sack)', () => {
      const state: GameState = { ...initialState, down: 2, distance: 8 };
      const event: GameEvent = {
        description: 'SACKED',
        yardage: -5,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(state, event);

      expect(newState.down).toBe(3);
      expect(newState.distance).toBe(13); // 8 - (-5) = 13
      expect(newState.ballOn).toBe(20); // 25 + (-5) = 20
    });

    it('should maintain other state properties', () => {
      const event: GameEvent = {
        description: 'Complete',
        yardage: 5,
        isScore: false,
        type: 'Pass'
      };

      const newState = updateGameState(initialState, event);

      expect(newState.quarter).toBe(1);
      expect(newState.time).toBe('12:45');
      expect(newState.awayScore).toBe(0);
      expect(newState.possession).toBe('HOME');
    });

    it('should handle multiple first downs in sequence', () => {
      let state = initialState;

      // First down conversion
      const event1: GameEvent = {
        description: 'Complete for 15 yards',
        yardage: 15,
        isScore: false,
        type: 'Pass'
      };
      state = updateGameState(state, event1);
      expect(state.down).toBe(1);
      expect(state.distance).toBe(10);
      expect(state.ballOn).toBe(40);

      // Second first down conversion
      const event2: GameEvent = {
        description: 'Run for 20 yards',
        yardage: 20,
        isScore: false,
        type: 'Run'
      };
      state = updateGameState(state, event2);
      expect(state.down).toBe(1);
      expect(state.distance).toBe(10);
      expect(state.ballOn).toBe(60);
    });
  });

  describe('calculateWinProbability', () => {
    it('should increase by 5 on touchdown', () => {
      const event: GameEvent = {
        description: 'TOUCHDOWN',
        yardage: 10,
        isScore: true,
        type: 'Pass'
      };

      const newProb = calculateWinProbability(50, event);
      expect(newProb).toBe(55);
    });

    it('should increase by 2 on big gain (>10 yards)', () => {
      const event: GameEvent = {
        description: 'Complete for 15 yards',
        yardage: 15,
        isScore: false,
        type: 'Pass'
      };

      const newProb = calculateWinProbability(50, event);
      expect(newProb).toBe(52);
    });

    it('should decrease by 2 on negative yardage', () => {
      const event: GameEvent = {
        description: 'SACKED',
        yardage: -5,
        isScore: false,
        type: 'Pass'
      };

      const newProb = calculateWinProbability(50, event);
      expect(newProb).toBe(48);
    });

    it('should not change on small gain', () => {
      const event: GameEvent = {
        description: 'Run for 3 yards',
        yardage: 3,
        isScore: false,
        type: 'Run'
      };

      const newProb = calculateWinProbability(50, event);
      expect(newProb).toBe(50);
    });

    it('should clamp at maximum 99%', () => {
      const event: GameEvent = {
        description: 'TOUCHDOWN',
        yardage: 10,
        isScore: true,
        type: 'Pass'
      };

      const newProb = calculateWinProbability(95, event);
      expect(newProb).toBe(99);
    });

    it('should clamp at minimum 1%', () => {
      const event: GameEvent = {
        description: 'SACKED',
        yardage: -10,
        isScore: false,
        type: 'Pass'
      };

      const newProb = calculateWinProbability(2, event);
      expect(newProb).toBe(1);
    });

    it('should not exceed 99% even with multiple touchdowns', () => {
      const event: GameEvent = {
        description: 'TOUCHDOWN',
        yardage: 10,
        isScore: true,
        type: 'Pass'
      };

      let prob = 96;
      prob = calculateWinProbability(prob, event); // 96 + 5 = 99 (clamped)
      expect(prob).toBe(99);

      prob = calculateWinProbability(prob, event); // Still 99
      expect(prob).toBe(99);
    });
  });
});
