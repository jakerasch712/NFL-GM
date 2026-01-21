import { describe, it, expect } from 'vitest';
import {
  calculateAPY,
  calculateTotalValue,
  getInterestScore,
  evaluateContractOffer,
  validateCapSpace,
  createContractFromOffer,
  calculateCapHit,
  ContractOffer,
  ContractDemand
} from './contractLogic';

describe('contractLogic', () => {
  describe('calculateAPY', () => {
    it('should calculate APY correctly for standard contract', () => {
      // 3 year, $10M/year, $5M bonus = (10*3 + 5) / 3 = 35/3 = 11.67M
      const apy = calculateAPY(10, 3, 5);
      expect(apy).toBeCloseTo(11.67, 2);
    });

    it('should calculate APY correctly with no bonus', () => {
      // 4 year, $15M/year, $0 bonus = (15*4 + 0) / 4 = 15M
      const apy = calculateAPY(15, 4, 0);
      expect(apy).toBe(15);
    });

    it('should calculate APY correctly with large bonus', () => {
      // 1 year, $5M/year, $20M bonus = (5*1 + 20) / 1 = 25M
      const apy = calculateAPY(5, 1, 20);
      expect(apy).toBe(25);
    });

    it('should handle decimal values correctly', () => {
      // 2 year, $8.5M/year, $3.2M bonus = (8.5*2 + 3.2) / 2 = 20.2/2 = 10.1M
      const apy = calculateAPY(8.5, 2, 3.2);
      expect(apy).toBeCloseTo(10.1, 2);
    });

    it('should handle minimum contract (1 year, $0.5M)', () => {
      const apy = calculateAPY(0.5, 1, 0);
      expect(apy).toBe(0.5);
    });
  });

  describe('calculateTotalValue', () => {
    it('should calculate total value correctly', () => {
      // 3 year, $10M/year, $5M bonus = 30 + 5 = 35M
      const total = calculateTotalValue(10, 3, 5);
      expect(total).toBe(35);
    });

    it('should calculate total value with no bonus', () => {
      // 5 year, $20M/year, $0 bonus = 100M
      const total = calculateTotalValue(20, 5, 0);
      expect(total).toBe(100);
    });

    it('should handle large contracts', () => {
      // 7 year, $50M/year, $30M bonus = 350 + 30 = 380M
      const total = calculateTotalValue(50, 7, 30);
      expect(total).toBe(380);
    });
  });

  describe('getInterestScore', () => {
    const demand: ContractDemand = {
      years: 3,
      salary: 10,
      bonus: 5
    };

    it('should return 100 when offer exactly matches demand', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 10,
        bonus: 5
      };

      const score = getInterestScore(offer, demand);
      expect(score).toBe(100);
    });

    it('should return > 100 (clamped to 100) when offer exceeds demand', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 15,
        bonus: 10
      };

      const score = getInterestScore(offer, demand);
      expect(score).toBe(100);
    });

    it('should return 50 when offer is half of demand value', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 5,
        bonus: 2.5
      };

      const score = getInterestScore(offer, demand);
      expect(score).toBeCloseTo(50, 0);
    });

    it('should penalize 10 points per year mismatch', () => {
      // Same value but different years
      const offer: ContractOffer = {
        years: 5,  // 2 years more than demand (3)
        salary: 6,
        bonus: 5
      };

      // Total value: (6*5 + 5) = 35 (same as demand: 10*3 + 5 = 35)
      // Base score: 100
      // Penalty: 2 years * 10 = -20
      // Final: 80
      const score = getInterestScore(offer, demand);
      expect(score).toBe(80);
    });

    it('should penalize for fewer years as well', () => {
      const offer: ContractOffer = {
        years: 1,  // 2 years less than demand
        salary: 30, // Compensate with higher salary
        bonus: 5
      };

      // Total value: (30*1 + 5) = 35 (same as demand)
      // Base score: 100
      // Penalty: 2 years * 10 = -20
      // Final: 80
      const score = getInterestScore(offer, demand);
      expect(score).toBe(80);
    });

    it('should clamp score at 0 for terrible offers', () => {
      const offer: ContractOffer = {
        years: 1,
        salary: 0.5,
        bonus: 0
      };

      const score = getInterestScore(offer, demand);
      expect(score).toBe(0);
    });

    it('should handle edge case of 7-year contract', () => {
      const offer: ContractOffer = {
        years: 7,  // Maximum length
        salary: 5,
        bonus: 0
      };

      // Total value: 35 (same as demand)
      // Penalty: 4 years * 10 = -40
      // Final: 60
      const score = getInterestScore(offer, demand);
      expect(score).toBe(60);
    });

    it('should score 95+ for slightly better offer with same years', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 11,  // 10% more
        bonus: 6     // 20% more
      };

      // Total value: (11*3 + 6) = 39 vs demand 35
      // Base score: 39/35 * 100 = 111.4 (clamped to 100)
      // No year penalty
      // Final: 100
      const score = getInterestScore(offer, demand);
      expect(score).toBe(100);
    });

    it('should score around 90 for slightly worse offer with same years', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 9,
        bonus: 4.5
      };

      // Total value: (9*3 + 4.5) = 31.5 vs demand 35
      // Base score: 31.5/35 * 100 = 90
      // No year penalty
      const score = getInterestScore(offer, demand);
      expect(score).toBe(90);
    });
  });

  describe('evaluateContractOffer', () => {
    it('should return ACCEPTED status for score >= 95', () => {
      const result = evaluateContractOffer(95);
      expect(result.status).toBe('ACCEPTED');
      expect(result.feedback).toContain('thrilled');
    });

    it('should return ACCEPTED for score of 100', () => {
      const result = evaluateContractOffer(100);
      expect(result.status).toBe('ACCEPTED');
      expect(result.feedback).toContain('deal');
    });

    it('should return close feedback for score 85-94', () => {
      const result = evaluateContractOffer(85);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('close');
      expect(result.feedback).toContain('bonus');
    });

    it('should return close feedback for score 90', () => {
      const result = evaluateContractOffer(90);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('close');
    });

    it('should return below market feedback for score 70-84', () => {
      const result = evaluateContractOffer(70);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('below market value');
      expect(result.feedback).toContain('APY');
    });

    it('should return below market feedback for score 80', () => {
      const result = evaluateContractOffer(80);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('below market value');
    });

    it('should return insulting feedback for score < 70', () => {
      const result = evaluateContractOffer(69);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('insulting');
    });

    it('should return insulting feedback for very low scores', () => {
      const result = evaluateContractOffer(10);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('far apart');
    });

    it('should handle edge case at 94 (just below acceptance)', () => {
      const result = evaluateContractOffer(94);
      expect(result.status).toBe('OPEN');
      expect(result.feedback).toContain('close');
    });
  });

  describe('validateCapSpace', () => {
    it('should return true when APY is below cap space', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 10,
        bonus: 5
      };

      const isValid = validateCapSpace(offer, 15);
      expect(isValid).toBe(true);
    });

    it('should return true when APY equals cap space', () => {
      const offer: ContractOffer = {
        years: 2,
        salary: 10,
        bonus: 0
      };

      const isValid = validateCapSpace(offer, 10);
      expect(isValid).toBe(true);
    });

    it('should return false when APY exceeds cap space', () => {
      const offer: ContractOffer = {
        years: 1,
        salary: 20,
        bonus: 10
      };

      const isValid = validateCapSpace(offer, 25);
      expect(isValid).toBe(false);
    });

    it('should return false when cap space is very low', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 10,
        bonus: 5
      };

      const isValid = validateCapSpace(offer, 5);
      expect(isValid).toBe(false);
    });

    it('should handle edge case with 0 cap space', () => {
      const offer: ContractOffer = {
        years: 1,
        salary: 0.5,
        bonus: 0
      };

      const isValid = validateCapSpace(offer, 0);
      expect(isValid).toBe(false);
    });
  });

  describe('createContractFromOffer', () => {
    it('should create valid contract from offer', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 10,
        bonus: 5
      };

      const contract = createContractFromOffer(offer);

      expect(contract.years).toBe(3);
      expect(contract.salary).toBe(10);
      expect(contract.bonus).toBe(5);
      expect(contract.yearsLeft).toBe(3);
      expect(contract.totalValue).toBe(35);
    });

    it('should round values to 2 decimal places', () => {
      const offer: ContractOffer = {
        years: 3,
        salary: 10.123456,
        bonus: 5.987654
      };

      const contract = createContractFromOffer(offer);

      expect(contract.salary).toBe(10.12);
      expect(contract.bonus).toBe(5.99);
      // Total value = (10.12 * 3) + 5.99 = 30.36 + 5.99 = 36.35 (but with floating point rounding)
      expect(contract.totalValue).toBeCloseTo(36.36, 2);
    });

    it('should handle contract with no bonus', () => {
      const offer: ContractOffer = {
        years: 5,
        salary: 15,
        bonus: 0
      };

      const contract = createContractFromOffer(offer);

      expect(contract.bonus).toBe(0);
      expect(contract.totalValue).toBe(75);
    });

    it('should set yearsLeft equal to years', () => {
      const offer: ContractOffer = {
        years: 7,
        salary: 50,
        bonus: 30
      };

      const contract = createContractFromOffer(offer);

      expect(contract.yearsLeft).toBe(7);
      expect(contract.years).toBe(7);
    });
  });

  describe('calculateCapHit', () => {
    it('should calculate cap hit equal to APY', () => {
      const contract = {
        years: 3,
        salary: 10,
        bonus: 6,
        yearsLeft: 3,
        totalValue: 36
      };

      const capHit = calculateCapHit(contract);
      expect(capHit).toBe(12); // (10*3 + 6) / 3 = 12
    });

    it('should handle contract with no bonus', () => {
      const contract = {
        years: 4,
        salary: 20,
        bonus: 0,
        yearsLeft: 4,
        totalValue: 80
      };

      const capHit = calculateCapHit(contract);
      expect(capHit).toBe(20);
    });

    it('should calculate cap hit for any year (currently returns same value)', () => {
      const contract = {
        years: 5,
        salary: 15,
        bonus: 10,
        yearsLeft: 3,
        totalValue: 85
      };

      const capHitYear1 = calculateCapHit(contract, 1);
      const capHitYear3 = calculateCapHit(contract, 3);

      expect(capHitYear1).toBe(capHitYear3);
      expect(capHitYear1).toBe(17); // (15*5 + 10) / 5 = 17
    });
  });

  describe('Integration: Full Contract Negotiation Flow', () => {
    it('should accept perfect match offer', () => {
      const demand: ContractDemand = {
        years: 4,
        salary: 12,
        bonus: 8,
        interest: 'Money'
      };

      const offer: ContractOffer = {
        years: 4,
        salary: 12,
        bonus: 8
      };

      const score = getInterestScore(offer, demand);
      const evaluation = evaluateContractOffer(score);
      const isValid = validateCapSpace(offer, 20);

      expect(score).toBe(100);
      expect(evaluation.status).toBe('ACCEPTED');
      expect(isValid).toBe(true);
    });

    it('should reject underpaid offer even within cap', () => {
      const demand: ContractDemand = {
        years: 3,
        salary: 15,
        bonus: 10,
        interest: 'Money'
      };

      const offer: ContractOffer = {
        years: 3,
        salary: 8,  // Much lower
        bonus: 3
      };

      const score = getInterestScore(offer, demand);
      const evaluation = evaluateContractOffer(score);
      const isValid = validateCapSpace(offer, 20);

      expect(score).toBeLessThan(70);
      expect(evaluation.status).toBe('OPEN');
      expect(evaluation.feedback).toContain('insulting');
      expect(isValid).toBe(true);
    });

    it('should reject overpaid offer that exceeds cap', () => {
      const demand: ContractDemand = {
        years: 2,
        salary: 5,
        bonus: 2
      };

      const offer: ContractOffer = {
        years: 1,
        salary: 30,  // Way too high for cap
        bonus: 20
      };

      const score = getInterestScore(offer, demand);
      const evaluation = evaluateContractOffer(score);
      const isValid = validateCapSpace(offer, 10);

      expect(score).toBeGreaterThan(95); // Player would love it
      expect(evaluation.status).toBe('ACCEPTED');
      expect(isValid).toBe(false); // But can't afford it!
    });

    it('should negotiate to acceptance through iterations', () => {
      const demand: ContractDemand = {
        years: 3,
        salary: 10,
        bonus: 5
      };

      // First offer - too low
      let offer: ContractOffer = {
        years: 3,
        salary: 8,
        bonus: 3
      };
      let score = getInterestScore(offer, demand);
      let evaluation = evaluateContractOffer(score);
      expect(evaluation.status).toBe('OPEN');
      expect(score).toBeLessThan(85);

      // Second offer - closer
      offer = { years: 3, salary: 9.5, bonus: 4.5 };
      score = getInterestScore(offer, demand);
      evaluation = evaluateContractOffer(score);
      expect(evaluation.status).toBe('OPEN');
      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThan(95);

      // Third offer - accepted
      offer = { years: 3, salary: 10, bonus: 5.5 };
      score = getInterestScore(offer, demand);
      evaluation = evaluateContractOffer(score);
      expect(evaluation.status).toBe('ACCEPTED');
      expect(score).toBeGreaterThanOrEqual(95);
    });
  });
});
