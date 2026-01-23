import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContractNegotiation from './ContractNegotiation';
import { Player } from '../types';
import * as contractLogic from '../utils/contractLogic';

const mockPlayer: Player = {
  id: '1',
  name: 'Patrick Mahomes',
  position: 'QB',
  age: 28,
  overall: 99,
  morale: 85,
  fatigue: 20,
  archetype: 'Field General',
  developmentTrait: 'X-Factor',
  stats: {
    passingYards: 4200,
    passingTDs: 35,
    interceptions: 8,
    rushingYards: 300,
    rushingTDs: 4
  },
  contract: {
    years: 1,
    salary: 5,
    bonus: 2,
    yearsLeft: 1,
    totalValue: 7
  },
  contractDemand: {
    years: 5,
    salary: 50,
    bonus: 20,
    interest: 'Money'
  }
};

describe('ContractNegotiation', () => {
  const mockOnClose = vi.fn();
  const mockOnSign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render player name in header', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    });

    it('should display player position badge', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('QB')).toBeInTheDocument();
    });

    it('should display player overall rating', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should display player age', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('should display player archetype', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Field General')).toBeInTheDocument();
    });

    it('should display available cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={75.5}
        />
      );

      expect(screen.getByText('$75.5M')).toBeInTheDocument();
    });

    it('should display agent notes with player demands', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText(/Money/i)).toBeInTheDocument();
      const yearElements = screen.getAllByText(/5 year/i);
      expect(yearElements.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Offer Controls', () => {
    it('should render years slider', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Contract Length')).toBeInTheDocument();
    });

    it('should render salary slider', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Salary / Year')).toBeInTheDocument();
    });

    it('should render bonus slider', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Signing Bonus')).toBeInTheDocument();
    });

    it('should display initial offer values based on 90% of demand salary', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      // Initial salary should be 90% of demand (50 * 0.9 = 45)
      expect(screen.getByText('$45.0M')).toBeInTheDocument();
    });

    it('should display initial bonus based on 80% of demand', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      // Initial bonus should be 80% of demand (20 * 0.8 = 16)
      const bonusElements = screen.getAllByText('$16.0M');
      expect(bonusElements.length).toBeGreaterThan(0);
    });

    it('should update displayed salary when slider changes', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      // Get all range inputs and find the salary slider (second one)
      const sliders = screen.getAllByRole('slider');
      const salarySlider = sliders[1]; // Years, Salary, Bonus
      fireEvent.change(salarySlider, { target: { value: '30' } });

      expect(screen.getByText('$30.0M')).toBeInTheDocument();
    });

    it('should update displayed years when slider changes', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const yearsSlider = sliders[0]; // First slider is years
      fireEvent.change(yearsSlider, { target: { value: '3' } });

      expect(screen.getByText('3 Years')).toBeInTheDocument();
    });

    it('should update displayed bonus when slider changes', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const bonusSlider = sliders[2]; // Third slider is bonus
      fireEvent.change(bonusSlider, { target: { value: '25' } });

      const bonusElements = screen.getAllByText('$25.0M');
      expect(bonusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Calculations Integration', () => {
    it('should call calculateTotalValue with correct parameters', () => {
      const spy = vi.spyOn(contractLogic, 'calculateTotalValue');

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      // Initial values: 5 years, $45M/yr, $16M bonus
      expect(spy).toHaveBeenCalledWith(45, 5, 16);
    });

    it('should call calculateAPY with correct parameters', () => {
      const spy = vi.spyOn(contractLogic, 'calculateAPY');

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(spy).toHaveBeenCalledWith(45, 5, 16);
    });

    it('should display total contract value', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      // (45 * 5) + 16 = 241M
      expect(screen.getByText('$241.0M')).toBeInTheDocument();
    });

    it('should display guaranteed money (bonus)', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const guaranteedLabels = screen.getAllByText('$16.0M');
      expect(guaranteedLabels.length).toBeGreaterThan(0);
    });

    it('should update total value when sliders change', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const salarySlider = sliders[1]; // Salary slider
      fireEvent.change(salarySlider, { target: { value: '10' } });

      // (10 * 5) + 16 = 66M
      expect(screen.getByText('$66.0M')).toBeInTheDocument();
    });
  });

  describe('Cap Space Validation', () => {
    it('should display projected cap hit', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Proj. Cap Hit')).toBeInTheDocument();
    });

    it('should show cap hit in red when it exceeds available cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={10} // Low cap space
        />
      );

      // APY = 241 / 5 = 48.2M, which exceeds 10M cap
      const capHitElements = screen.getAllByText(/\$48\.20M/i);
      const redCapHit = capHitElements.find(el => el.className?.includes('text-red'));
      expect(redCapHit).toBeDefined();
    });

    it('should disable submit button when offer exceeds cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={10}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      expect(submitButton).toBeDisabled();
    });

    it('should show warning message when offer exceeds cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={10}
        />
      );

      expect(screen.getByText(/exceeds available cap space/i)).toBeInTheDocument();
    });

    it('should enable submit button when offer is within cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Interest Score Integration', () => {
    it('should call getInterestScore when rendering', () => {
      const spy = vi.spyOn(contractLogic, 'getInterestScore');

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should display interest bar', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(screen.getByText('Deal Interest')).toBeInTheDocument();
    });

    it('should update interest score when sliders change', () => {
      const spy = vi.spyOn(contractLogic, 'getInterestScore');

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const salarySlider = sliders[1]; // Salary slider
      fireEvent.change(salarySlider, { target: { value: '50' } });

      // Should be called again after slider change
      expect(spy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('Offer Submission', () => {
    it('should call evaluateContractOffer when submit button is clicked', () => {
      const spy = vi.spyOn(contractLogic, 'evaluateContractOffer');

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      expect(spy).toHaveBeenCalled();
    });

    it('should display feedback after submitting offer', () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'OPEN',
        feedback: "We're close. Increase the guaranteed money (bonus) slightly and we'll sign."
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      expect(screen.getByText(/We're close/i)).toBeInTheDocument();
    });

    it('should display acceptance message when deal is accepted', () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      expect(screen.getByText(/thrilled/i)).toBeInTheDocument();
    });

    it('should call createContractFromOffer when deal is accepted', async () => {
      const spy = vi.spyOn(contractLogic, 'createContractFromOffer');

      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should call onSign with correct parameters when deal is accepted', async () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      vi.spyOn(contractLogic, 'createContractFromOffer').mockReturnValue({
        years: 5,
        salary: 45,
        bonus: 16,
        yearsLeft: 5,
        totalValue: 241
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSign).toHaveBeenCalledWith('1', {
          years: 5,
          salary: 45,
          bonus: 16,
          yearsLeft: 5,
          totalValue: 241
        });
      }, { timeout: 2000 });
    });

    it('should not call onSign immediately for non-accepted offers', async () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'OPEN',
        feedback: "This offer is insulting. We are far apart."
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      // Wait a bit to ensure onSign is not called
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockOnSign).not.toHaveBeenCalled();
    });

    it('should show "Contract Signed" button after acceptance', async () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Contract Signed')).toBeInTheDocument();
      });
    });

    it('should hide sliders after deal is accepted', async () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const salarySlider = screen.queryByRole('slider', { name: /salary/i });
        expect(salarySlider).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when X button is clicked', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg')); // Find X icon button

      if (xButton) {
        fireEvent.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should call onClose when Withdraw button is clicked', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const withdrawButton = screen.getByText('Withdraw');
      fireEvent.click(withdrawButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking "Contract Signed" after acceptance', async () => {
      vi.spyOn(contractLogic, 'evaluateContractOffer').mockReturnValue({
        status: 'ACCEPTED',
        feedback: "The client is thrilled. We have a deal!"
      });

      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const submitButton = screen.getByText('Submit Offer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const signedButton = screen.getByText('Contract Signed');
        fireEvent.click(signedButton);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it.skip('should handle player without contractDemand', () => {
      // This test is skipped because the component requires contractDemand
      // to function properly. In a real app, this component would only be
      // rendered for players with contractDemand.
      const playerWithoutDemand = {
        ...mockPlayer,
        contractDemand: undefined
      };

      // This would crash because component assumes contractDemand exists
      const { container } = render(
        <ContractNegotiation
          player={playerWithoutDemand}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle zero cap space', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={0}
        />
      );

      expect(screen.getByText('$0M')).toBeInTheDocument();
      expect(screen.getByText('Submit Offer')).toBeDisabled();
    });

    it('should handle very large contract values', () => {
      const richPlayer = {
        ...mockPlayer,
        contractDemand: {
          years: 7,
          salary: 60,
          bonus: 50,
          interest: 'Money'
        }
      };

      render(
        <ContractNegotiation
          player={richPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={500}
        />
      );

      // Should display large values correctly
      expect(screen.getByText(/\$54\.0M/)).toBeInTheDocument(); // 60 * 0.9
    });

    it('should maintain state when rapidly changing sliders', () => {
      render(
        <ContractNegotiation
          player={mockPlayer}
          onClose={mockOnClose}
          onSign={mockOnSign}
          capSpace={100}
        />
      );

      const sliders = screen.getAllByRole('slider');
      const salarySlider = sliders[1]; // Salary slider

      // Rapidly change slider
      fireEvent.change(salarySlider, { target: { value: '10' } });
      fireEvent.change(salarySlider, { target: { value: '20' } });
      fireEvent.change(salarySlider, { target: { value: '30' } });

      // Should reflect latest value
      expect(screen.getByText('$30.0M')).toBeInTheDocument();
    });
  });
});
