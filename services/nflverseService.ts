import Papa from 'papaparse';
import { Team, ScheduleMatch, Player, Position, PlayerPersonality } from '../types';

const BASE_URL = 'https://github.com/nflverse/nflverse-data/releases/download';
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

  async fetchSchedules(year: number): Promise<any[]> {
    try {
      // Use 2024 data for futuristic years as a base
      const targetYear = year > 2024 ? 2024 : year;
      const url = `${BASE_URL}/schedules/schedules_${targetYear}.csv`;
      console.log(`Fetching schedules from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          }
        });
      });
    } catch (error) {
      console.warn(`NFLverse schedules data for ${year} unavailable, using local default.`);
      return [];
    }
  },

  async fetchRosters(year: number): Promise<any[]> {
    try {
      // Use 2024 data for futuristic years as a base
      const targetYear = year > 2024 ? 2024 : year;
      const url = `${BASE_URL}/rosters/roster_${targetYear}.csv`;
      console.log(`Fetching rosters from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        // Try alternate filename rosters_YEAR.csv if roster_YEAR.csv fails
        const altUrl = `${BASE_URL}/rosters/rosters_${targetYear}.csv`;
        console.log(`Retrying with alternate rosters URL: ${altUrl}`);
        const altResponse = await fetch(altUrl);
        
        if (!altResponse.ok) {
          throw new Error(`HTTP error! status: ${altResponse.status}`);
        }
        
        const csvText = await altResponse.text();
        return parseRosters(csvText);
      }
      
      const csvText = await response.text();
      return parseRosters(csvText);
    } catch (error) {
      console.warn(`NFLverse rosters data for ${year} unavailable, using local MOCK_PLAYERS default.`);
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

function normalizePosition(pos: string): Position {
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

function parseRosters(csvText: string): Promise<any[]> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const players = (results.data as any[]).map(p => ({
          id: p.gsis_id || p.pfr_id || Math.random().toString(),
          name: p.full_name || p.player_name,
          position: normalizePosition(p.position),
          age: p.age ? parseInt(p.age) : 25,
          overall: 70 + Math.floor(Math.random() * 25),
          schemeOvr: 70, 
          morale: 80,
          fatigue: 100,
          archetype: 'Standard',
          personality: 'Normal',
          scheme: 'Balanced',
          developmentTrait: 'Normal',
          potential: 'Normal',
          stats: {},
          contract: { years: 1, salary: 1, bonus: 0, guaranteed: 0, yearsLeft: 1, totalValue: 1, capHit: 1, deadCap: 0, voidYears: 0, startYear: 2026, totalLength: 1 },
          teamId: p.team || p.team_abbr
        }));
        resolve(players);
      }
    });
  });
}
