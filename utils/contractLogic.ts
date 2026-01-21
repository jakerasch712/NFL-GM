import { Contract } from '../types';

export interface ContractDemand {
  years: number;
  salary: number;
  bonus: number;
  interest?: string;
}

export interface ContractOffer {
  years: number;
  salary: number;
  bonus: number;
}

export type DealStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED';

/**
 * Calculates the average per year (APY) of a contract
 * @param salary - Annual salary in millions
 * @param years - Contract length
 * @param bonus - Signing bonus in millions
 * @returns Average value per year in millions
 */
export const calculateAPY = (salary: number, years: number, bonus: number): number => {
  const totalValue = (salary * years) + bonus;
  return totalValue / years;
};

/**
 * Calculates the total value of a contract
 * @param salary - Annual salary in millions
 * @param years - Contract length
 * @param bonus - Signing bonus in millions
 * @returns Total contract value in millions
 */
export const calculateTotalValue = (salary: number, years: number, bonus: number): number => {
  return (salary * years) + bonus;
};

/**
 * Calculates how interested a player is in the contract offer
 * @param offer - The contract offer being presented
 * @param demand - The player's contract demands
 * @returns Interest score from 0-100
 */
export const getInterestScore = (offer: ContractOffer, demand: ContractDemand): number => {
  const demandValue = calculateTotalValue(demand.salary, demand.years, demand.bonus);
  const offerValue = calculateTotalValue(offer.salary, offer.years, offer.bonus);

  // Base score on value comparison (offer / demand * 100)
  let score = (offerValue / demandValue) * 100;

  // Penalize for year mismatch (10 points per year difference)
  const yearDifference = Math.abs(offer.years - demand.years);
  score -= yearDifference * 10;

  // Clamp score between 0 and 100
  return Math.min(100, Math.max(0, score));
};

/**
 * Determines the outcome and feedback for a contract offer
 * @param score - Interest score from getInterestScore
 * @returns Object with deal status and feedback message
 */
export const evaluateContractOffer = (score: number): { status: DealStatus; feedback: string } => {
  if (score >= 95) {
    return {
      status: 'ACCEPTED',
      feedback: "The client is thrilled. We have a deal!"
    };
  } else if (score >= 85) {
    return {
      status: 'OPEN',
      feedback: "We're close. Increase the guaranteed money (bonus) slightly and we'll sign."
    };
  } else if (score >= 70) {
    return {
      status: 'OPEN',
      feedback: "This is below market value. The years look okay, but the APY needs to come up significantly."
    };
  } else {
    return {
      status: 'OPEN',
      feedback: "This offer is insulting. We are far apart."
    };
  }
};

/**
 * Validates if a contract offer is within cap space constraints
 * @param offer - The contract offer
 * @param availableCapSpace - Available cap space in millions
 * @returns True if the offer is valid, false otherwise
 */
export const validateCapSpace = (offer: ContractOffer, availableCapSpace: number): boolean => {
  const apy = calculateAPY(offer.salary, offer.years, offer.bonus);
  return apy <= availableCapSpace;
};

/**
 * Creates a new contract object from an accepted offer
 * @param offer - The accepted contract offer
 * @returns Contract object ready to be assigned to a player
 */
export const createContractFromOffer = (offer: ContractOffer): Contract => {
  const totalValue = calculateTotalValue(offer.salary, offer.years, offer.bonus);

  return {
    years: offer.years,
    salary: parseFloat(offer.salary.toFixed(2)),
    bonus: parseFloat(offer.bonus.toFixed(2)),
    yearsLeft: offer.years,
    totalValue: parseFloat(totalValue.toFixed(2))
  };
};

/**
 * Calculates the cap hit for a given contract year
 * @param contract - The contract
 * @param year - The contract year (1-indexed)
 * @returns Cap hit for that year in millions
 */
export const calculateCapHit = (contract: Contract, year: number = 1): number => {
  // Simplified: In real NFL, bonus is prorated over contract length
  // For now, we'll use APY as the cap hit
  return calculateAPY(contract.salary, contract.years, contract.bonus);
};
