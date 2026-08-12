// Typed access to the vendored league data emitted by scripts/generateLeagueData.ts.
// Regenerate with: npm run generate:data
import playersJson from './leaguePlayers.json';
import scheduleJson from './leagueSchedule.json';
import { Player, ScheduleMatch } from '../types';

export const LEAGUE_PLAYERS = playersJson as unknown as Player[];
export const LEAGUE_SCHEDULE = scheduleJson as unknown as ScheduleMatch[];
