import { Player, Contract } from '../types';

export const calculateCapHit = (contract: Contract): number => {
  return contract.salary + (contract.bonus / contract.totalLength);
};

export const calculateDeadCap = (contract: Contract): number => {
  const yearsLeftIncludingVoids = contract.yearsLeft + contract.voidYears;
  const prorationRemaining = (contract.bonus / contract.totalLength) * yearsLeftIncludingVoids;
  return contract.guaranteed + prorationRemaining;
};

export const restructureContract = (player: Player): Player => {
  const { contract } = player;
  
  // Design: Convert 80% of current base salary into bonus spread over remaining years
  const amountToRestructure = contract.salary * 0.8;
  const newSalary = contract.salary - amountToRestructure;
  const newBonus = contract.bonus + amountToRestructure;
  
  const newContract: Contract = {
    ...contract,
    salary: newSalary,
    bonus: newBonus,
    capHit: newSalary + (newBonus / contract.totalLength)
  };

  return {
    ...player,
    contract: newContract
  };
};

export const getTeamCapSpace = (teamRoster: Player[], salaryCap: number): number => {
  // Top-51 Rule Implementation
  const sortedByCapHit = [...teamRoster].sort((a, b) => b.contract.capHit - a.contract.capHit);
  const top51 = sortedByCapHit.slice(0, 51);
  const totalCapHit = top51.reduce((sum, p) => sum + p.contract.capHit, 0);
  
  return salaryCap - totalCapHit;
};
