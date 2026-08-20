import { Player, Position, DraftProspect, DraftPick } from "../types";

export const syncSpotracRoster = async (teamName: string, teamId: string): Promise<{ players: Player[], spotracUrl: string }> => {
  try {
    const res = await fetch('/api/rosters/spotrac-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, teamId })
    });
    
    if (!res.ok) throw new Error('Failed to fetch from Spotrac sync endpoint');
    const data = await res.json();
    const playersData = data.players || [];
    const spotracUrl = data.spotracUrl || `https://www.spotrac.com/nfl/${teamName.toLowerCase().replace(/\s+/g, '-')}/cap/`;

    const mappedPlayers: Player[] = playersData.map((p: any, index: number) => {
      const posString = (p.position || 'WR').toUpperCase().trim();
      let posEnum = Position.WR;
      if (Object.values(Position).includes(posString as Position)) {
        posEnum = posString as Position;
      }

      const ovr = p.overall || (85 - index);
      const salary = p.salary || Math.max(1.2, Math.round((ovr - 65) * 0.75 * 10) / 10);
      const capHit = p.capHit || salary;
      const totalValue = p.totalValue || Math.round(salary * (p.years || 3) * 10) / 10;
      const bonus = p.bonus || Math.round(totalValue * 0.3 * 10) / 10;
      const guaranteed = p.guaranteed || Math.round(totalValue * 0.5 * 10) / 10;

      return {
        id: `spotrac-${teamId.toLowerCase()}-${index}-${Date.now()}`,
        name: p.name,
        position: posEnum,
        age: p.age || 26,
        overall: ovr,
        schemeOvr: ovr + (Math.random() > 0.4 ? 2 : -1),
        morale: 90,
        fatigue: 98,
        archetype: p.archetype || (posEnum === Position.QB ? 'Field General' : posEnum === Position.RB ? 'Elusive Back' : posEnum === Position.WR ? 'Route Technician' : 'Standard'),
        personality: 'Leader',
        scheme: p.scheme || 'Balanced',
        developmentTrait: ovr >= 90 ? 'X-Factor' : ovr >= 84 ? 'Superstar' : ovr >= 77 ? 'Star' : 'Normal',
        potential: ovr >= 85 ? 'Superstar' : 'Star',
        stats: { gamesPlayed: 17 },
        contract: {
          years: p.years || 3,
          salary,
          bonus,
          guaranteed,
          yearsLeft: p.yearsLeft || 2,
          totalValue,
          capHit,
          deadCap: p.deadCap || Math.round(bonus * 0.5 * 10) / 10,
          voidYears: 0,
          startYear: 2024,
          totalLength: p.years || 3
        },
        teamId: teamId,
        depth: p.depth || (index + 1)
      };
    });

    return { players: mappedPlayers, spotracUrl };
  } catch (e) {
    console.error("Failed to sync Spotrac roster:", e);
    return { 
      players: [], 
      spotracUrl: `https://www.spotrac.com/nfl/${teamName.toLowerCase().replace(/\s+/g, '-')}/cap/` 
    };
  }
};

export const syncTeamRoster = async (teamName: string): Promise<Player[]> => {
  try {
    const res = await fetch('/api/rosters/live-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, query: `Gather active 2025/2026 starter roster for ${teamName}` })
    });
    
    if (!res.ok) throw new Error('Failed to fetch from live search server endpoint');
    const data = await res.json();
    const playersData = data.players || [];

    return playersData.map((p: any, index: number) => {
      const posString = (p.position || 'WR').toUpperCase().trim();
      let posEnum = Position.WR;
      if (Object.values(Position).includes(posString as Position)) {
        posEnum = posString as Position;
      }

      const ovr = p.overall || 80;
      return {
        id: `sync-${Date.now()}-${index}`,
        name: p.name,
        position: posEnum,
        age: p.age || 26,
        overall: ovr,
        schemeOvr: ovr + (Math.random() > 0.5 ? 2 : -1),
        morale: 85,
        fatigue: 100,
        archetype: p.archetype || 'Standard',
        personality: 'Normal',
        scheme: p.scheme || 'Balanced',
        developmentTrait: ovr >= 90 ? 'X-Factor' : ovr >= 85 ? 'Superstar' : ovr >= 78 ? 'Star' : 'Normal',
        potential: ovr >= 85 ? 'Superstar' : 'Star',
        stats: { gamesPlayed: 17 },
        contract: {
          years: 3,
          salary: Math.max(1, Math.round((ovr - 65) * 0.6)),
          bonus: 5,
          guaranteed: 10,
          yearsLeft: 2,
          totalValue: Math.max(3, Math.round((ovr - 65) * 1.8)),
          capHit: Math.max(1, Math.round((ovr - 65) * 0.6)),
          deadCap: 2,
          voidYears: 0,
          startYear: 2026,
          totalLength: 3
        },
        teamId: '' // Filled by caller
      };
    });
  } catch (e) {
    console.error("Failed to parse roster sync data", e);
    return [];
  }
};

export const getDraftStrategy = async (
  teamId: string, 
  prospects: DraftProspect[], 
  picks: DraftPick[]
): Promise<string> => {
  try {
    const res = await fetch('/api/draft/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, prospects, picks })
    });
    if (!res.ok) throw new Error('Draft strategy request failed');
    const data = await res.json();
    return data.text || "Strategy analysis unavailable.";
  } catch (err) {
    console.error("Failed to load draft strategy:", err);
    return "Draft strategy server endpoint unavailable.";
  }
};
