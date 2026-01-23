import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchSim from './MatchSim';
import * as gameLogic from '../utils/gameLogic';
import { OFFENSIVE_PLAYS } from '../constants';

describe('MatchSim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the scoreboard', () => {
      render(<MatchSim />);

      expect(screen.getByText('HOU')).toBeInTheDocument();
      expect(screen.getByText('KC')).toBeInTheDocument();
    });

    it('should display initial game state (1 & 10)', () => {
      render(<MatchSim />);

      expect(screen.getByText('1 & 10')).toBeInTheDocument();
    });

    it('should display initial field position (OWN 25)', () => {
      render(<MatchSim />);

      expect(screen.getByText('OWN 25')).toBeInTheDocument();
    });

    it('should display initial time (12:45)', () => {
      render(<MatchSim />);

      expect(screen.getByText('12:45')).toBeInTheDocument();
    });

    it('should display initial score (0-0)', () => {
      render(<MatchSim />);

      const scores = screen.getAllByText('0');
      expect(scores.length).toBeGreaterThanOrEqual(2); // Home and away scores
    });

    it('should display quarter information', () => {
      render(<MatchSim />);

      expect(screen.getByText(/Q1/i)).toBeInTheDocument();
    });

    it('should display win probability', () => {
      render(<MatchSim />);

      expect(screen.getByText(/Win Probability/i)).toBeInTheDocument();
    });

    it('should display all offensive plays', () => {
      render(<MatchSim />);

      OFFENSIVE_PLAYS.forEach(play => {
        expect(screen.getByText(play.name)).toBeInTheDocument();
      });
    });

    it('should display waiting message before any play is called', () => {
      render(<MatchSim />);

      expect(screen.getByText(/Waiting for Call/i)).toBeInTheDocument();
    });
  });

  describe('Play Calling Integration', () => {
    it('should call calculateOutcome when play button is clicked', async () => {
      const spy = vi.spyOn(gameLogic, 'calculateOutcome');
      spy.mockReturnValue({
        description: 'Test play',
        yardage: 5,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(OFFENSIVE_PLAYS[0], 25);
      }, { timeout: 2000 });
    });

    it('should show "EXECUTING PLAY" message during simulation', () => {
      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      expect(screen.getByText(/EXECUTING PLAY/i)).toBeInTheDocument();
    });

    it('should disable play buttons during simulation', () => {
      render(<MatchSim />);

      const playButtons = screen.getAllByRole('button', { name: new RegExp(OFFENSIVE_PLAYS[0].name) });
      const playButton = playButtons[0];

      fireEvent.click(playButton);

      // All play buttons should be disabled during simulation
      OFFENSIVE_PLAYS.forEach(play => {
        const buttons = screen.getAllByRole('button', { name: new RegExp(play.name) });
        buttons.forEach(btn => {
          expect(btn).toBeDisabled();
        });
      });
    });

    it('should re-enable play buttons after simulation completes', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 5 yards',
        yardage: 5,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(playButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  describe('Game State Updates', () => {
    it('should call updateGameState with correct parameters', async () => {
      const mockOutcome = {
        description: 'Complete for 10 yards',
        yardage: 10,
        isScore: false,
        type: 'Pass' as const
      };

      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue(mockOutcome);
      const updateSpy = vi.spyOn(gameLogic, 'updateGameState');
      updateSpy.mockImplementation((state, event) => ({
        ...state,
        ballOn: state.ballOn + event.yardage,
        down: state.down + 1,
        distance: state.distance - event.yardage
      }));

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            down: 1,
            distance: 10,
            ballOn: 25
          }),
          mockOutcome
        );
      }, { timeout: 2000 });
    });

    it('should update down and distance after successful play', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 5 yards',
        yardage: 5,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        // After 5 yard gain: 2nd & 5
        expect(screen.getByText('2 & 5')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should update field position after play', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 10 yards',
        yardage: 10,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        // From OWN 25 + 10 yards = OWN 35
        expect(screen.getByText('OWN 35')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should convert first down when gaining 10+ yards', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 15 yards',
        yardage: 15,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        // Should be back to 1st & 10
        expect(screen.getByText('1 & 10')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should update score when touchdown occurs', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'TOUCHDOWN!',
        yardage: 75,
        isScore: true,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        // Score should increase by 7 (TD + PAT)
        expect(screen.getByText('7')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should reset to own 25 after touchdown', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'TOUCHDOWN!',
        yardage: 75,
        isScore: true,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('OWN 25')).toBeInTheDocument();
        expect(screen.getByText('1 & 10')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Win Probability Updates', () => {
    it('should call calculateWinProbability after play', async () => {
      const mockOutcome = {
        description: 'Complete for 10 yards',
        yardage: 10,
        isScore: false,
        type: 'Pass' as const
      };

      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue(mockOutcome);
      const winProbSpy = vi.spyOn(gameLogic, 'calculateWinProbability');
      winProbSpy.mockReturnValue(52);

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(winProbSpy).toHaveBeenCalledWith(50, mockOutcome);
      }, { timeout: 2000 });
    });

    it('should display updated win probability', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'TOUCHDOWN!',
        yardage: 75,
        isScore: true,
        type: 'Pass'
      });

      vi.spyOn(gameLogic, 'calculateWinProbability').mockReturnValue(55);

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('55.0%')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Play History', () => {
    it('should add play to history after execution', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 10 yards using PA Boot',
        yardage: 10,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        const historyElements = screen.getAllByText(/Complete for 10 yards/i);
        expect(historyElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should show multiple plays in history', async () => {
      const outcomes = [
        { description: 'Complete for 5 yards', yardage: 5, isScore: false, type: 'Pass' as const },
        { description: 'Run for 8 yards', yardage: 8, isScore: false, type: 'Run' as const }
      ];

      let callCount = 0;
      vi.spyOn(gameLogic, 'calculateOutcome').mockImplementation(() => {
        const outcome = outcomes[callCount % outcomes.length];
        callCount++;
        return outcome;
      });

      render(<MatchSim />);

      // Execute first play
      const playButton1 = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton1);

      await waitFor(() => {
        const elements = screen.getAllByText(/Complete for 5 yards/i);
        expect(elements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // Execute second play
      const playButton2 = screen.getByText(OFFENSIVE_PLAYS[1].name);
      fireEvent.click(playButton2);

      await waitFor(() => {
        const runElements = screen.getAllByText(/Run for 8 yards/i);
        expect(runElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should display yardage gained in history', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 15 yards',
        yardage: 15,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('+15 Yards')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show negative yardage for sacks', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'SACKED! Loss of 5 yards',
        yardage: -5,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('-5 Yards')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Play Display', () => {
    it('should show play result after execution', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'TOUCHDOWN! Explosive play on the PA Boot!',
        yardage: 75,
        isScore: true,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('TOUCHDOWN')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display yardage for normal plays', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 12 yards',
        yardage: 12,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('12 YDS')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show TURNOVER for interceptions', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'INTERCEPTED!',
        yardage: 0,
        isScore: false,
        type: 'Turnover'
      });

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('TURNOVER')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Play Types', () => {
    it('should display pass plays with correct badge', () => {
      render(<MatchSim />);

      const passPlays = OFFENSIVE_PLAYS.filter(p => p.type === 'Pass');
      passPlays.forEach(play => {
        const badges = screen.getAllByText('Pass');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display run plays with correct badge', () => {
      render(<MatchSim />);

      const runPlays = OFFENSIVE_PLAYS.filter(p => p.type === 'Run');
      runPlays.forEach(play => {
        const badges = screen.getAllByText('Run');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display play formation', () => {
      render(<MatchSim />);

      OFFENSIVE_PLAYS.forEach(play => {
        const formations = screen.getAllByText(play.formation);
        expect(formations.length).toBeGreaterThan(0);
      });
    });

    it('should display risk and reward stats', () => {
      render(<MatchSim />);

      OFFENSIVE_PLAYS.forEach(play => {
        const riskElements = screen.getAllByText(`Risk: ${play.risk}`);
        const rewardElements = screen.getAllByText(`Reward: ${play.reward}`);
        expect(riskElements.length).toBeGreaterThan(0);
        expect(rewardElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid play calling', async () => {
      let callCount = 0;
      vi.spyOn(gameLogic, 'calculateOutcome').mockImplementation(() => ({
        description: `Play ${callCount++}`,
        yardage: 5,
        isScore: false,
        type: 'Pass'
      }));

      render(<MatchSim />);

      const playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);

      // Click multiple times rapidly
      fireEvent.click(playButton);
      fireEvent.click(playButton);
      fireEvent.click(playButton);

      // Should only execute once (buttons disabled during simulation)
      await waitFor(() => {
        expect(gameLogic.calculateOutcome).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });
    });

    it('should maintain game state consistency across multiple plays', async () => {
      vi.spyOn(gameLogic, 'calculateOutcome').mockReturnValue({
        description: 'Complete for 3 yards',
        yardage: 3,
        isScore: false,
        type: 'Pass'
      });

      render(<MatchSim />);

      // Start at 1 & 10
      expect(screen.getByText('1 & 10')).toBeInTheDocument();

      // Execute first play
      let playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      // Wait for the game state to update (1.5s timeout + processing)
      await waitFor(() => {
        expect(screen.getByText('2 & 7')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Execute second play
      playButton = screen.getByText(OFFENSIVE_PLAYS[0].name);
      fireEvent.click(playButton);

      // Wait for the game state to update again
      await waitFor(() => {
        expect(screen.getByText('3 & 4')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
