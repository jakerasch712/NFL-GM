import Papa from 'papaparse';
import { Position, PlayerPersonality } from '../types';

const TEAMS_URL = 'https://github.com/nflverse/nflverse-data/releases/download/teams/teams.csv';

export interface NFLVerseTeam {
  team_abbr: string;
  team_name: string;
  team_id: string;
  team_nick: string;
  team_conf: string;
  team_division: string;
  team_color: string;
  team_color2: string;
  team_logo_wikipedia: string;
  team_logo_espn: string;
}

export const nflverseService = {
  async fetchTeams(): Promise<NFLVerseTeam[]> {
    try {
      console.log(`Fetching NFL teams from: ${TEAMS_URL}`);
      const response = await fetch(TEAMS_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as NFLVerseTeam[]);
          }
        });
      });
    } catch (error) {
      console.warn('NFLverse teams external data unavailable, using local TEAMS_DB default.');
      return [];
    }
  },

  async fetchLiveSearchRoster(teamName?: string, query?: string): Promise<{ players: any[]; sources: any[] }> {
    try {
      const res = await fetch('/api/rosters/live-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, query })
      });
      if (!res.ok) throw new Error('Live roster search request failed');
      const data = await res.json();
      
      const formattedPlayers = (data.players || []).map((p: any) => ({
        id: `live_${p.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: p.name,
        position: normalizePosition(p.position),
        age: p.age || 26,
        overall: p.overall || 80,
        schemeOvr: p.overall || 80,
        morale: 85,
        fatigue: 100,
        archetype: 'Standard',
        personality: 'Normal' as PlayerPersonality,
        scheme: 'Balanced',
        developmentTrait: p.overall >= 90 ? 'X-Factor' : p.overall >= 84 ? 'Superstar' : p.overall >= 78 ? 'Star' : 'Normal',
        potential: p.overall >= 88 ? 'S' : p.overall >= 82 ? 'A' : 'B',
        stats: { gamesPlayed: 17, yards: 0, touchdowns: 0 },
        contract: {
          years: 2,
          salary: Math.max(1, Math.round((p.overall - 65) * 0.7)),
          bonus: 1,
          guaranteed: Math.max(1, Math.round((p.overall - 65) * 0.7)),
          yearsLeft: 2,
          totalValue: Math.max(2, Math.round((p.overall - 65) * 1.4)),
          capHit: Math.max(1, Math.round((p.overall - 65) * 0.7)),
          deadCap: 0,
          voidYears: 0,
          startYear: 2026,
          totalLength: 2
        },
        teamId: p.teamAbbr || 'KC',
        depth: p.depth || 1,
        notes: p.notes
      }));

      return { players: formattedPlayers, sources: data.sources || [] };
    } catch (err) {
      console.warn('Error fetching live search roster:', err);
      return { players: [], sources: [] };
    }
  }
};

export function normalizePosition(pos: string): Position {
  const p = (pos || '').toUpperCase().trim();
  if (['QB'].includes(p)) return Position.QB;
  if (['RB', 'FB', 'HB'].includes(p)) return Position.RB;
  if (['WR'].includes(p)) return Position.WR;
  if (['TE'].includes(p)) return Position.TE;
  if (['OL', 'OT', 'OG', 'C', 'LT', 'RT', 'LG', 'RG', 'T', 'G', 'LS'].includes(p)) return Position.OL;
  if (['DL', 'DE', 'DT', 'NT'].includes(p)) return Position.DL;
  if (['LB', 'OLB', 'ILB', 'MLB'].includes(p)) return Position.LB;
  if (['CB'].includes(p)) return Position.CB;
  if (['S', 'FS', 'SS', 'DB'].includes(p)) return Position.S;
  if (['K', 'P', 'PK'].includes(p)) return Position.K;
  return Position.WR; // fallback
}
