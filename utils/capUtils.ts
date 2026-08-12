import { Player, Contract } from '@/types';

/** Base salary floor a restructure must leave in place (veteran minimum, $M). */
export const VETERAN_MINIMUM = 1.21;

/**
 * Models a restructure: convert base salary above the veteran minimum into
 * signing bonus, prorated over the remaining years plus any void years.
 *
 * The returned contract is the single source of truth — the preview modal and
 * the code that applies the move both use it, so they cannot disagree. Because
 * the new base salary is the veteran minimum, restructuring the same contract
 * again yields zero further savings rather than compounding indefinitely.
 */
export const calculateRestructure = (contract: Contract, voidYears: number) => {
  const amountToRestructure = Math.max(0, contract.salary - VETERAN_MINIMUM);
  const salary = parseFloat((contract.salary - amountToRestructure).toFixed(2));
  const bonus = parseFloat((contract.bonus + amountToRestructure).toFixed(2));
  const totalLength = contract.totalLength + voidYears;
  const capHit = parseFloat((salary + bonus / totalLength).toFixed(2));

  const newContract: Contract = {
    ...contract,
    salary,
    bonus,
    voidYears: contract.voidYears + voidYears,
    totalLength,
    capHit,
    deadCap: parseFloat(((bonus / totalLength) * (contract.yearsLeft + contract.voidYears + voidYears)).toFixed(2)),
  };

  return {
    amountToRestructure,
    capSavings: parseFloat((contract.capHit - capHit).toFixed(2)),
    futureDeadCap: parseFloat(((bonus / totalLength) * voidYears).toFixed(2)),
    newContract,
  };
};

/**
 * Calculates the dead cap impact for a player cut or trade.
 */
export const calculateDeadCap = (
  contract: Contract, 
  isPostJune1: boolean, 
  currentYear: number = 2026
) => {
  const yearsRemaining = contract.yearsLeft;
  // In our simplified model, bonus is total signing bonus.
  // Proration is bonus / totalLength
  const yearlyProration = contract.bonus / contract.totalLength;
  const totalRemainingProration = yearlyProration * yearsRemaining;

  if (isPostJune1 && yearsRemaining > 1) {
    // Current year only takes its scheduled portion
    const currentYearProration = yearlyProration;
    
    return {
      deadCap2026: currentYearProration,
      deadCap2027: totalRemainingProration - currentYearProration,
      savings2026: contract.salary
    };
  }

  // Standard Cut: Everything accelerates to the current year
  return {
    deadCap2026: totalRemainingProration,
    deadCap2027: 0,
    savings2026: contract.salary - totalRemainingProration
  };
};

/**
 * Processes a Post-June 1 Cut vs Standard Cut
 */
export const executePlayerRelease = (player: Player, isPostJune1: boolean) => {
  const contract = player.contract;
  const yearlyProration = contract.bonus / contract.totalLength;
  const remainingProration = yearlyProration * contract.yearsLeft;

  if (isPostJune1) {
    return {
      type: "POST_JUNE_1",
      immediateDeadCap: yearlyProration,
      deferredDeadCap: remainingProration - yearlyProration,
      net2026Savings: contract.salary,
      note: "Savings applied to 2026 cap; balance moves to 2027."
    };
  }

  return {
    type: "STANDARD",
    immediateDeadCap: remainingProration,
    deferredDeadCap: 0,
    net2026Savings: contract.salary - remainingProration,
    note: "Entire dead cap hit taken in 2026."
  };
};
