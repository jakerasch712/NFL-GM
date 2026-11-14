/**
 * Fetches all 32 rosters and writes the committed fallback snapshot.
 * Usage: FIRECRAWL_API_KEY=... npm run rosters:snapshot
 * Cost: one roster call per team (32 calls in 4 batched requests) plus one cap page per team.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { TeamContractSnapshot, TeamRosterSnapshot } from '../engine/rosterTypes';
import { createRosterServiceFromEnv } from '../server/rosters/bootstrap';

async function main() {
  const { service, settings } = createRosterServiceFromEnv();
  if (!settings.apiKey) {
    console.error('FIRECRAWL_API_KEY is not set.');
    process.exit(1);
  }
  const { snapshots, contracts: capPages, errors } = await service.refreshLeague();
  const teams: Record<string, TeamRosterSnapshot> = {};
  for (const snapshot of snapshots) teams[snapshot.teamId] = snapshot;
  const contracts: Record<string, TeamContractSnapshot> = {};
  for (const page of capPages) contracts[page.teamId] = page;

  await fs.mkdir(path.dirname(settings.snapshotFile), { recursive: true });
  await fs.writeFile(settings.snapshotFile, JSON.stringify({ generatedAt: new Date().toISOString(), teams, contracts }));

  const unmapped = new Map<string, number>();
  for (const s of snapshots) for (const k of s.skipped) {
    if (k.reason === 'unknown_position' || k.reason === 'unknown_status') {
      const key = `${k.reason}:${k.detail}`;
      unmapped.set(key, (unmapped.get(key) ?? 0) + 1);
    }
  }
  console.log(`Wrote ${snapshots.length} of 32 rosters and ${capPages.length} of 32 cap pages to ${settings.snapshotFile}`);
  if (unmapped.size) console.log('Unmapped provider codes (add to server/rosters/config.ts):', Object.fromEntries(unmapped));
  if (Object.keys(errors).length) {
    console.error('Teams that failed:', errors);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
