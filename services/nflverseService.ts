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
      console.error('Error fetching nflverse teams:', error);
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
      console.error(`Error fetching nflverse schedules for ${year}:`, error);
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
      console.error(`Error fetching nflverse rosters for ${year}:`, error);
      return [];
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
