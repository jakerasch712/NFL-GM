import { promises as fs } from 'fs';
import path from 'path';
import { TeamRosterSnapshot } from '../../engine/rosterTypes';

/** Storage for normalized team rosters. Ratings are never cached, so model changes need no refetch. */
export interface RosterStore {
  read(teamId: string): Promise<TeamRosterSnapshot | null>;
  write(snapshot: TeamRosterSnapshot): Promise<void>;
}

/** One JSON file per team. MVP storage: fine for one server process, not for several. */
export function createFileRosterStore(directory: string): RosterStore {
  const fileFor = (teamId: string) => path.join(directory, `${teamId}.json`);
  return {
    async read(teamId) {
      try {
        return JSON.parse(await fs.readFile(fileFor(teamId), 'utf8')) as TeamRosterSnapshot;
      } catch {
        return null;
      }
    },
    async write(snapshot) {
      await fs.mkdir(directory, { recursive: true });
      const target = fileFor(snapshot.teamId);
      const temp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(temp, JSON.stringify(snapshot));
      await fs.rename(temp, target); // atomic replace, so a crash never leaves a half written file
    }
  };
}

/** Read only store backed by the committed league snapshot file. */
export function createSnapshotFileStore(filePath: string): Pick<RosterStore, 'read'> {
  let loaded: Record<string, TeamRosterSnapshot> | null | undefined;
  return {
    async read(teamId) {
      if (loaded === undefined) {
        try {
          loaded = JSON.parse(await fs.readFile(filePath, 'utf8')).teams ?? null;
        } catch {
          loaded = null;
        }
      }
      return loaded?.[teamId] ?? null;
    }
  };
}
