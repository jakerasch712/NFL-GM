import { Player, Coach, TradeRecord, DraftProspect, Scout, DraftPick, LeagueState, ScheduleMatch, HallOfFamer, DraftSelection } from '../types';

const SAVE_KEY = 'nflgm.save.v1';
const SAVE_VERSION = 1;

export interface FranchiseState {
  selectedTeamId: string | null;
  teams: Record<string, any>;
  allPlayers: Player[];
  coaches: Coach[];
  tradeHistory: TradeRecord[];
  prospects: DraftProspect[];
  scouts: Scout[];
  picks: DraftPick[];
  leagueState: LeagueState;
  schedule: ScheduleMatch[];
  inductees: HallOfFamer[];
  draftHistory: DraftSelection[];
}

interface SaveFile {
  version: number;
  savedAt: string;
  state: FranchiseState;
}

export const loadSave = (): FranchiseState | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: SaveFile = JSON.parse(raw);
    if (parsed.version !== SAVE_VERSION || !parsed.state) return null;
    return parsed.state;
  } catch {
    return null;
  }
};

export const persistSave = (state: FranchiseState): void => {
  try {
    const file: SaveFile = { version: SAVE_VERSION, savedAt: new Date().toISOString(), state };
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  } catch {
    // Quota or serialization errors must never crash the app
  }
};

export const clearSave = (): void => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};
