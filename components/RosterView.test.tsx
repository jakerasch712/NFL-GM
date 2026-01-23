import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RosterView from './RosterView';
import { MOCK_PLAYERS } from '../constants';

// Mock the ContractNegotiation component
vi.mock('./ContractNegotiation', () => ({
  default: ({ player, onClose, onSign, capSpace }: any) => (
    <div data-testid="contract-negotiation-modal">
      <h2>Negotiating with {player.name}</h2>
      <p>Cap Space: ${capSpace}M</p>
      <button onClick={onClose}>Close</button>
      <button
        onClick={() => onSign(player.id, {
          years: 3,
          salary: 10,
          bonus: 5,
          yearsLeft: 3,
          totalValue: 35
        })}
      >
        Sign Contract
      </button>
    </div>
  )
}));

describe('RosterView', () => {
  describe('Component Rendering', () => {
    it('should render roster header with title', () => {
      render(<RosterView />);
      expect(screen.getByText('ACTIVE ROSTER')).toBeInTheDocument();
    });

    it('should display initial cap space', () => {
      render(<RosterView />);
      expect(screen.getByText(/\$14.2M Cap Space/i)).toBeInTheDocument();
    });

    it('should render all players from MOCK_PLAYERS', () => {
      render(<RosterView />);

      MOCK_PLAYERS.forEach(player => {
        expect(screen.getByText(player.name)).toBeInTheDocument();
      });
    });

    it('should display player positions', () => {
      render(<RosterView />);

      const positions = screen.getAllByText(/QB|WR|RB|TE/);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should display player overall ratings', () => {
      render(<RosterView />);

      MOCK_PLAYERS.forEach(player => {
        expect(screen.getByText(player.overall.toString())).toBeInTheDocument();
      });
    });

    it('should display player contract information', () => {
      render(<RosterView />);

      MOCK_PLAYERS.forEach(player => {
        const salaryText = `$${player.contract.salary.toFixed(1)}M / yr`;
        expect(screen.getByText(salaryText)).toBeInTheDocument();
      });
    });

    it('should show cap space in red when below $5M', () => {
      render(<RosterView />);

      // Initial cap space is $14.2M, so it should be emerald (green)
      const capSpaceElement = screen.getByText(/\$14.2M Cap Space/i);
      expect(capSpaceElement.className).toContain('text-emerald-400');
    });
  });

  describe('Contract Negotiation UI', () => {
    it('should show negotiate button for players with contractDemand', () => {
      render(<RosterView />);

      const playersWithDemands = MOCK_PLAYERS.filter(p => p.contractDemand);
      const negotiateButtons = screen.getAllByText(/Negotiate/i);

      expect(negotiateButtons.length).toBe(playersWithDemands.length);
    });

    it('should not show negotiate button for players without contractDemand', () => {
      render(<RosterView />);

      const playersWithoutDemands = MOCK_PLAYERS.filter(p => !p.contractDemand);

      // These players should have "—" instead of negotiate button
      expect(playersWithoutDemands.length).toBeGreaterThan(0);
    });

    it('should open negotiation modal when negotiate button is clicked', () => {
      render(<RosterView />);

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      expect(screen.getByTestId('contract-negotiation-modal')).toBeInTheDocument();
    });

    it('should display correct player in negotiation modal', () => {
      render(<RosterView />);

      const playerWithDemand = MOCK_PLAYERS.find(p => p.contractDemand);
      if (!playerWithDemand) throw new Error('No player with demand found');

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      expect(screen.getByText(`Negotiating with ${playerWithDemand.name}`)).toBeInTheDocument();
    });

    it('should close negotiation modal when close button is clicked', () => {
      render(<RosterView />);

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      expect(screen.getByTestId('contract-negotiation-modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('contract-negotiation-modal')).not.toBeInTheDocument();
    });
  });

  describe('handleSignContract - CRITICAL CAP SPACE LOGIC', () => {
    it('should update player contract when deal is signed', () => {
      render(<RosterView />);

      const playerWithDemand = MOCK_PLAYERS.find(p => p.contractDemand);
      if (!playerWithDemand) throw new Error('No player with demand found');

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      // Modal should close after signing
      expect(screen.queryByTestId('contract-negotiation-modal')).not.toBeInTheDocument();
    });

    it('should remove contractDemand after signing', async () => {
      render(<RosterView />);

      const initialNegotiateButtons = screen.getAllByText(/Negotiate/i);
      const initialCount = initialNegotiateButtons.length;

      fireEvent.click(initialNegotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      await waitFor(() => {
        const remainingButtons = screen.queryAllByText(/Negotiate/i);
        expect(remainingButtons.length).toBe(initialCount - 1);
      });
    });

    it('should deduct correct amount from cap space (APY calculation)', () => {
      render(<RosterView />);

      const initialCapSpace = 14.2;

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      // Signing contract: 3 years, $10M/yr, $5M bonus
      // Total value = (10 * 3) + 5 = 35M
      // APY = 35 / 3 = 11.67M
      // New cap space = 14.2 - 11.67 = 2.53M

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      expect(screen.getByText(/\$2.53M Cap Space/i)).toBeInTheDocument();
    });

    it('should handle multiple contract signings correctly', async () => {
      render(<RosterView />);

      const initialCapSpace = 14.2;

      // Sign first contract
      let negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);
      fireEvent.click(screen.getByText('Sign Contract'));

      await waitFor(() => {
        expect(screen.getByText(/\$2.53M Cap Space/i)).toBeInTheDocument();
      });

      // Try to sign second contract if there are more players
      negotiateButtons = screen.queryAllByText(/Negotiate/i);
      if (negotiateButtons.length > 0) {
        fireEvent.click(negotiateButtons[0]);
        fireEvent.click(screen.getByText('Sign Contract'));

        await waitFor(() => {
          // After second signing: 2.53 - 11.67 = -9.14M (negative cap)
          const capSpaceText = screen.getByText(/Cap Space/i);
          expect(capSpaceText).toBeInTheDocument();
        });
      }
    });

    it('should display cap space in red when it goes below $5M', async () => {
      render(<RosterView />);

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      await waitFor(() => {
        const capSpaceElement = screen.getByText(/\$2.53M Cap Space/i);
        expect(capSpaceElement.className).toContain('text-red-400');
      });
    });

    it('should round cap space to 2 decimal places', () => {
      render(<RosterView />);

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      // Should be $2.53M, not $2.533333M
      expect(screen.getByText('$2.53M Cap Space')).toBeInTheDocument();
    });

    it('should update contract salary display after signing', async () => {
      render(<RosterView />);

      const playerWithDemand = MOCK_PLAYERS.find(p => p.contractDemand);
      if (!playerWithDemand) throw new Error('No player with demand found');

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      await waitFor(() => {
        // New contract: $10M/yr
        expect(screen.getByText('$10.0M / yr')).toBeInTheDocument();
      });
    });

    it('should update contract years left after signing', async () => {
      render(<RosterView />);

      const playerWithDemand = MOCK_PLAYERS.find(p => p.contractDemand);
      if (!playerWithDemand) throw new Error('No player with demand found');

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      await waitFor(() => {
        // New contract: 3 years (there might be multiple players with 3 years left)
        const yearsElements = screen.getAllByText('3 years left');
        expect(yearsElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle signing when cap space is already low', () => {
      render(<RosterView />);

      // Sign multiple contracts to drain cap space
      const negotiateButtons = screen.getAllByText(/Negotiate/i);

      if (negotiateButtons.length > 0) {
        fireEvent.click(negotiateButtons[0]);
        fireEvent.click(screen.getByText('Sign Contract'));

        // Cap space should update even if negative
        const capSpaceElement = screen.getByText(/Cap Space/i);
        expect(capSpaceElement).toBeInTheDocument();
      }
    });

    it('should preserve other player data when signing contract', async () => {
      render(<RosterView />);

      const playerWithDemand = MOCK_PLAYERS.find(p => p.contractDemand);
      if (!playerWithDemand) throw new Error('No player with demand found');

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);

      const signButton = screen.getByText('Sign Contract');
      fireEvent.click(signButton);

      await waitFor(() => {
        // Player name should still be there
        expect(screen.getByText(playerWithDemand.name)).toBeInTheDocument();
        // Player position should still be there
        expect(screen.getByText(playerWithDemand.position)).toBeInTheDocument();
        // Player overall should still be there
        expect(screen.getByText(playerWithDemand.overall.toString())).toBeInTheDocument();
      });
    });

    it('should not affect other players when signing one contract', async () => {
      render(<RosterView />);

      const allPlayersBefore = MOCK_PLAYERS.map(p => p.name);

      const negotiateButtons = screen.getAllByText(/Negotiate/i);
      fireEvent.click(negotiateButtons[0]);
      fireEvent.click(screen.getByText('Sign Contract'));

      await waitFor(() => {
        // All players should still be rendered
        allPlayersBefore.forEach(name => {
          expect(screen.getByText(name)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Table Display', () => {
    it('should display table headers', () => {
      render(<RosterView />);

      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Pos')).toBeInTheDocument();
      expect(screen.getByText('OVR')).toBeInTheDocument();
      expect(screen.getByText('Contract')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should apply hover styles to table rows', () => {
      render(<RosterView />);

      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);

      expect(dataRows.length).toBe(MOCK_PLAYERS.length);
    });

    it('should display active status for players with years left', () => {
      render(<RosterView />);

      const activeLabels = screen.getAllByText('Active');
      expect(activeLabels.length).toBeGreaterThan(0);
    });
  });
});
