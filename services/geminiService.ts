import { Player, Position, DraftProspect, DraftPick } from "../types";

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
