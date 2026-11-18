import { promises as fs } from 'fs';
import path from 'path';

/** Storage for one JSON document per team. Ratings are never cached, so model changes need no refetch. */
export interface TeamStore<T> {
  read(teamId: string): Promise<T | null>;
  write(teamId: string, value: T): Promise<void>;
}

/** One JSON file per team. MVP storage: fine for one server process, not for several. */
export function createFileStore<T>(directory: string): TeamStore<T> {
  const fileFor = (teamId: string) => path.join(directory, `${teamId}.json`);
  return {
    async read(teamId) {
      try {
        return JSON.parse(await fs.readFile(fileFor(teamId), 'utf8')) as T;
      } catch {
        return null;
      }
    },
    async write(teamId, value) {
      await fs.mkdir(directory, { recursive: true });
      const target = fileFor(teamId);
      const temp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(temp, JSON.stringify(value));
      await fs.rename(temp, target); // atomic replace, so a crash never leaves a half written file
    }
  };
}

/** Read only store backed by one section (`teams` or `contracts`) of the committed league snapshot file. */
export function createSnapshotSectionStore<T>(filePath: string, section: string): Pick<TeamStore<T>, 'read'> {
  let loaded: Record<string, T> | null | undefined;
  return {
    async read(teamId) {
      if (loaded === undefined) {
        try {
          loaded = JSON.parse(await fs.readFile(filePath, 'utf8'))[section] ?? null;
        } catch {
          loaded = null;
        }
      }
      return loaded?.[teamId] ?? null;
    }
  };
}
