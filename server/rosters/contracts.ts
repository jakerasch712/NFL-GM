import { Contract, Position } from '../../types';
import { CONTRACT_CONFIG, ContractConfig } from './config';
import { seededInt } from './seed';

export interface ContractInput {
  gsisId: string;
  position: Position;
  overall: number;
  age: number;
  experience: number;
  season: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Modelled contract (USD millions). This is a game model, not league data:
 * no live contract source is wired in yet. Deterministic for a given input.
 */
export function modelContract(input: ContractInput, config: ContractConfig = CONTRACT_CONFIG): Contract {
  const { gsisId, position, overall, age, experience, season } = input;

  // Rating position on the pay curve: 0 at floorOverall, 1 at ceilingOverall.
  const ratingShare = Math.min(1, Math.max(0, (overall - config.floorOverall) / (config.ceilingOverall - config.floorOverall)));

  // Market APY = position top of market × ratingShare ^ exponent, never below the minimum salary.
  const marketApy = Math.max(config.minimumSalaryM, config.topApyM[position] * Math.pow(ratingShare, config.apyExponent));

  // Rookie deals pay a fixed share of market APY, never below the minimum salary.
  const onRookieDeal = experience <= config.rookieDealMaxExperience;
  const apy = onRookieDeal ? Math.max(config.minimumSalaryM, marketApy * config.rookieDealApyShare) : marketApy;

  // Length: rookie deals use the fixed rookie length, veterans use the first matching age band.
  const years = onRookieDeal
    ? config.rookieDealYears
    : (config.yearsByAge.find(band => age <= band.maxAge) ?? config.yearsByAge[config.yearsByAge.length - 1]).years;

  // Years left: a rookie has used `experience` years; a veteran gets a seeded point in the deal.
  const yearsLeft = onRookieDeal
    ? Math.max(1, years - experience)
    : seededInt(`${gsisId}:${season}:yearsLeft`, 1, years);

  // Total value = APY × years.
  const totalValue = apy * years;
  // Signing bonus = total value × bonus share.
  const bonus = totalValue * config.bonusShare;
  // Base salary per year = (total value − signing bonus) / years, so salary × years + bonus = total value.
  const salary = (totalValue - bonus) / years;
  // Guaranteed money = total value × guaranteed share.
  const guaranteed = totalValue * config.guaranteedShare;
  // Cap hit = base salary + signing bonus prorated evenly over the deal (matches financeService.calculateCapHit).
  const capHit = salary + bonus / years;
  // Dead cap = unamortized signing bonus = yearly proration × years left.
  const deadCap = (bonus / years) * yearsLeft;

  return {
    years,
    salary: round1(salary),
    bonus: round1(bonus),
    guaranteed: round1(guaranteed),
    yearsLeft,
    totalValue: round1(totalValue),
    capHit: round1(capHit),
    deadCap: round1(deadCap),
    voidYears: 0,
    startYear: season - (years - yearsLeft),
    totalLength: years
  };
}
