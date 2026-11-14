import { TeamRosterResponse } from '../engine/rosterTypes';

export interface RosterPipelineStatus {
  liveSourceConfigured: boolean;
  snapshotAvailable: boolean;
  season: number | null;
  cacheTtlHours: number;
  provider: string;
  contractSource: string;
  ratingInputs: { generatedAt: string; seasons: number[]; depthChartAsOf: string | null } | null;
}

/** Single client entry point for live rosters. The server owns keys, caching and ratings. */
export const rosterService = {
  async fetchStatus(): Promise<RosterPipelineStatus | null> {
    try {
      const res = await fetch('/api/rosters/status');
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  /** Rosters the server already holds (cache or snapshot). Returns [] when none or on any error. */
  async fetchStoredLeague(): Promise<TeamRosterResponse[]> {
    try {
      const res = await fetch('/api/rosters/league');
      const body = await res.json();
      return res.ok && body?.success ? body.teams : [];
    } catch {
      return [];
    }
  },

  async fetchTeamRoster(teamId: string): Promise<TeamRosterResponse> {
    const res = await fetch(`/api/rosters/${encodeURIComponent(teamId)}`);
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) throw new Error(body?.error || `Roster request failed (${res.status})`);
    return body as TeamRosterResponse;
  }
};
