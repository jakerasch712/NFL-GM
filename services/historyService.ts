import { Player, PlayerStats } from '../types';

export interface AwardHistory {
  year: number;
  award: 'MVP' | 'OPOY' | 'DPOY' | 'OROY' | 'DROY' | 'COY';
  playerName?: string;
  teamId: string;
}

export const checkHallOfFameEligibility = (player: Player, careerStats: PlayerStats): boolean => {
  // GDD: Logic uses Career AV (Approximate Value) and Championships.
  // Simplified for now: 100+ TDs or 50+ Sacks and 10+ years experience
  if (player.age < 35) return false;
  
  const yards = careerStats.yards || 0;
  const tds = careerStats.touchdowns || 0;
  const sacks = careerStats.sacks || 0;
  
  if (tds > 100 || yards > 10000 || sacks > 100) {
    return true;
  }
  
  return false;
};

export const generateSeasonAwards = (players: Player[], year: number): AwardHistory[] => {
  const sortedByYards = [...players].sort((a, b) => (b.stats.yards || 0) - (a.stats.yards || 0));
  const sortedBySacks = [...players].sort((a, b) => (b.stats.sacks || 0) - (a.stats.sacks || 0));
  
  return [
    { year, award: 'MVP', playerName: sortedByYards[0].name, teamId: sortedByYards[0].teamId },
    { year, award: 'OPOY', playerName: sortedByYards[0].name, teamId: sortedByYards[0].teamId },
    { year, award: 'DPOY', playerName: sortedBySacks[0].name, teamId: sortedBySacks[0].teamId }
  ];
};
