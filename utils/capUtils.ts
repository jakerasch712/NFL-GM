import { Player, Contract } from '@/types';

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
