import Papa from 'papaparse';
import { Team, ScheduleMatch, Player, Position, PlayerPersonality } from '../types';

const BASE_URL = 'https://raw.githubusercontent.com/nflverse/nflverse-data/master/data';
const TEAMS_URL = 'https://raw.githubusercontent.com/nflverse/nflfastR-data/master/teams_colors_logos.csv';

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return new Promise((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const players = (results.data as any[]).map(p => ({
              id: p.gsis_id || p.pfr_id || Math.random().toString(),
              name: p.full_name,
              position: p.position,
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
              teamId: p.team
            }));
            resolve(players);
          }
        });
      });
    } catch (error) {
      console.error(`Error fetching nflverse rosters for ${year}:`, error);
      return [];
    }
  }
};
