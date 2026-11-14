import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Player, Position } from '../types';
import { TeamRosterSnapshot } from '../engine/rosterTypes';
import { mergeTeamRoster, seedLeagueRosters } from '../engine/rosterMerge';
import { normalizeTeamRoster } from '../server/rosters/normalize';
import { ageForSeason, buildTeamPlayers } from '../server/rosters/ratings';
import { modelContract } from '../server/rosters/contracts';
import { CONTRACT_CONFIG, RATINGS_CONFIG } from '../server/rosters/config';
import { createRosterService, RosterUnavailableError } from '../server/rosters/service';
import { createFirecrawlClient, FirecrawlError } from '../server/providers/firecrawl';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/atl-roster.sample.json', import.meta.url), 'utf8'));
const snapshot = () => normalizeTeamRoster('ATL', fixture, '2026-01-01T00:00:00.000Z');
const build = (curated: Player[] = []) => buildTeamPlayers(snapshot(), { season: 2026, curated });

// ---------- normalize ----------

test('normalize keeps mapped players and reports the rest', () => {
  const s = snapshot();
  assert.equal(s.teamId, 'ATL');
  assert.equal(s.season, 2026);
  assert.equal(s.providerRosterSize, 91);
  assert.equal(s.fetchedAt, new Date(1794694072188).toISOString());
  // 24 fixture players: TRC, TRT and RSN are unmapped statuses.
  assert.equal(s.records.length, 21);
  assert.deepEqual(s.skipped.map(k => `${k.reason}:${k.detail}`).sort(), ['unknown_status:RSN', 'unknown_status:TRC', 'unknown_status:TRT']);
});

test('normalize maps provider position codes, including the undocumented ones', () => {
  const byName = new Map(snapshot().records.map(r => [r.name, r]));
  assert.equal(byName.get('Sydney Brown')!.position, Position.S); // SAF
  assert.equal(byName.get('Mike Ford')!.position, Position.CB); // DB
  assert.equal(byName.get('Michael Jerrell')!.position, Position.OL); // OT
  assert.equal(byName.get('Liam McCullough')!.position, Position.OL); // LS
  assert.equal(byName.get('Jake Bailey')!.position, Position.K); // P
  assert.equal(byName.get('Gervon Dexter Sr.')!.position, Position.DL); // DT
});

test('normalize maps statuses and tolerates null fields', () => {
  const byName = new Map(snapshot().records.map(r => [r.name, r]));
  assert.equal(byName.get('DeAngelo Malone')!.status, 'reserve'); // PUP
  assert.equal(byName.get('Vinny Anthony II')!.status, 'practice_squad'); // DEV
  assert.equal(byName.get('Nick Folk')!.status, 'departed'); // CUT
  assert.equal(byName.get('James Brockermeyer')!.status, 'departed'); // TRD
  assert.equal(byName.get('Andy Dalton')!.jerseyNumber, null);
  assert.equal(byName.get('Drake London')!.jerseyNumber, '5');
});

test('normalize skips unknown positions, missing IDs and duplicates instead of guessing', () => {
  const s = normalizeTeamRoster('ATL', {
    players: [
      { display_name: 'A', gsis_id: '00-1', position: 'XYZ', status: 'ACT' },
      { display_name: 'B', gsis_id: '', position: 'QB', status: 'ACT' },
      { display_name: 'C', gsis_id: '00-3', position: 'QB', status: 'ACT' },
      { display_name: 'C again', gsis_id: '00-3', position: 'QB', status: 'ACT' }
    ]
  }, '2026-01-01T00:00:00.000Z');
  assert.equal(s.records.length, 1);
  assert.deepEqual(s.skipped.map(k => k.reason), ['unknown_position', 'missing_id', 'duplicate']);
  assert.equal(s.fetchedAt, '2026-01-01T00:00:00.000Z');
});

// ---------- ratings ----------

test('age is computed against 1 September of the season', () => {
  assert.equal(ageForSeason('2000-05-08', 2026, 0), 26);
  assert.equal(ageForSeason('1999-11-23', 2026, 0), 26); // birthday after 1 September
  assert.equal(ageForSeason(null, 2026, 24), 24);
});

test('build imports only active and reserve players', () => {
  const players = build();
  // 21 normalized − 1 practice squad − 2 departed = 18
  assert.equal(players.length, 18);
  assert.ok(!players.some(p => ['Nick Folk', 'Vinny Anthony II', 'James Brockermeyer'].includes(p.name)));
  assert.equal(players.find(p => p.name === 'JD Bertrand')!.rosterStatus, 'reserve');
});

test('build is deterministic and uses the gsis ID as player ID', () => {
  assert.deepEqual(build(), build());
  for (const p of build()) {
    assert.equal(p.id, p.gsisId);
    assert.equal(p.teamId, 'ATL');
    assert.ok(p.overall >= RATINGS_CONFIG.minOverall && p.overall <= RATINGS_CONFIG.maxModelledOverall, `${p.name} ${p.overall}`);
    assert.equal(p.schemeOvr, p.overall);
  }
});

test('depth ranks players by overall within each position', () => {
  const qbs = build().filter(p => p.position === Position.QB).sort((a, b) => a.depth! - b.depth!);
  assert.deepEqual(qbs.map(p => p.depth), [1, 2]);
  assert.ok(qbs[0].overall >= qbs[1].overall);
});

test('curated ratings win over the model; curated contract only applies on the same team', () => {
  const base = build().find(p => p.name === 'Bijan Robinson')!;
  const curated = (teamId: string): Player => ({ ...base, id: 'atl_x', gsisId: undefined, overall: 95, developmentTrait: 'X-Factor', archetype: 'Elusive Back', teamId, contract: { ...base.contract, salary: 99 } });
  const same = build([curated('ATL')]).find(p => p.name === 'Bijan Robinson')!;
  assert.equal(same.overall, 95);
  assert.equal(same.developmentTrait, 'X-Factor');
  assert.equal(same.contract.salary, 99);
  assert.equal(same.id, '00-0038542');
  const moved = build([curated('DAL')]).find(p => p.name === 'Bijan Robinson')!;
  assert.equal(moved.overall, 95);
  assert.notEqual(moved.contract.salary, 99);
});

// ---------- contracts ----------

test('modelled contracts are internally consistent', () => {
  for (const p of build()) {
    const c = p.contract;
    assert.ok(Math.abs(c.salary * c.years + c.bonus - c.totalValue) < 0.3, `${p.name}: salary × years + bonus = total`);
    assert.ok(Math.abs(c.capHit - (c.salary + c.bonus / c.totalLength)) < 0.11, `${p.name}: cap hit`);
    assert.ok(c.yearsLeft >= 1 && c.yearsLeft <= c.years);
    assert.ok(c.guaranteed <= c.totalValue);
    assert.equal(c.startYear, 2026 - (c.years - c.yearsLeft));
  }
});

test('contract value rises with rating and never drops below the minimum salary', () => {
  const input = { gsisId: '00-1', position: Position.QB, age: 28, experience: 6, season: 2026 };
  const low = modelContract({ ...input, overall: 62 });
  const mid = modelContract({ ...input, overall: 80 });
  const top = modelContract({ ...input, overall: 99 });
  assert.ok(low.totalValue / low.years >= CONTRACT_CONFIG.minimumSalaryM - 0.05);
  assert.ok(mid.totalValue / mid.years > low.totalValue / low.years);
  assert.ok(Math.abs(top.totalValue / top.years - CONTRACT_CONFIG.topApyM[Position.QB]) < 0.1);
  assert.deepEqual(modelContract({ ...input, overall: 80 }), mid);
});

// ---------- merge ----------

const league = (): Player[] => {
  const live = build();
  const tpl = live[0];
  const bijan = live.find(p => p.name === 'Bijan Robinson')!;
  return [
    // Legacy curated player on the team with custom ID, no gsisId, and save state to protect.
    { ...bijan, id: 'atl_1', gsisId: undefined, overall: 97, morale: 55, skillPoints: 3, contract: { ...bijan.contract, salary: 12.5 } },
    // Player the save has on another team who is now on ATL (nflverse style: ID is the gsis ID).
    { ...live.find(p => p.name === 'Drake London')!, gsisId: undefined, teamId: 'NYJ', overall: 91 },
    // On ATL in the save, no longer on the live roster.
    { ...tpl, id: 'atl_old', gsisId: undefined, name: 'Old Veteran', position: Position.TE, teamId: 'ATL' },
    // Namesake at another position must not be merged by name.
    { ...tpl, id: 'atl_namesake', gsisId: undefined, name: 'Mike Ford', position: Position.WR, teamId: 'ATL' },
    { ...tpl, id: 'gen_ATL_QB_1', gsisId: undefined, name: 'QB Starter 1', position: Position.QB, teamId: 'ATL' },
    { ...tpl, id: 'kc_1', gsisId: undefined, name: 'Other Team Player', teamId: 'KC' }
  ];
};

test('merge keeps save state for matched players and takes roster facts from the live record', () => {
  const { players, diff } = mergeTeamRoster(league(), build(), 'ATL');
  const bijan = players.find(p => p.name === 'Bijan Robinson')!;
  assert.equal(bijan.id, 'atl_1'); // ID preserved so references in the save stay valid
  assert.equal(bijan.gsisId, '00-0038542');
  assert.equal(bijan.overall, 97);
  assert.equal(bijan.morale, 55);
  assert.equal(bijan.skillPoints, 3);
  assert.equal(bijan.contract.salary, 12.5);
  assert.equal(bijan.jerseyNumber, '7');
  assert.ok(diff.kept.some(c => c.id === 'atl_1'));
});

test('merge moves players between teams, releases missing players and removes placeholders', () => {
  const before = league();
  const { players, diff } = mergeTeamRoster(before, build(), 'ATL');
  const london = players.find(p => p.name === 'Drake London')!;
  assert.equal(london.teamId, 'ATL');
  assert.equal(london.overall, 91);
  assert.deepEqual(diff.arrived.map(c => [c.name, c.detail]), [['Drake London', 'NYJ']]);

  assert.equal(players.find(p => p.id === 'atl_old')!.teamId, 'FA');
  assert.equal(players.find(p => p.id === 'atl_namesake')!.teamId, 'FA');
  assert.deepEqual(diff.released.map(c => c.id).sort(), ['atl_namesake', 'atl_old']);

  assert.ok(!players.some(p => p.id.startsWith('gen_ATL')));
  assert.equal(diff.placeholdersRemoved, 1);
  assert.equal(players.find(p => p.id === 'kc_1')!.teamId, 'KC');

  assert.equal(players.filter(p => p.teamId === 'ATL').length, 18);
  assert.equal(diff.added.length, 16);
  assert.equal(new Set(players.map(p => p.id)).size, players.length);
  assert.equal(before.find(p => p.id === 'atl_old')!.teamId, 'ATL'); // input not mutated
});

test('merge is idempotent', () => {
  const once = mergeTeamRoster(league(), build(), 'ATL');
  const twice = mergeTeamRoster(once.players, build(), 'ATL');
  assert.deepEqual(twice.players.filter(p => p.teamId === 'ATL').map(p => p.id).sort(), once.players.filter(p => p.teamId === 'ATL').map(p => p.id).sort());
  assert.equal(twice.diff.added.length, 0);
  assert.equal(twice.diff.released.length, 0);
  assert.equal(twice.diff.kept.length, 18);
});

test('seed replaces covered teams, drops duplicates elsewhere and leaves other teams alone', () => {
  const seeded = seedLeagueRosters(league(), [{ teamId: 'ATL', players: build() }]);
  assert.equal(seeded.filter(p => p.teamId === 'ATL').length, 18);
  assert.equal(seeded.filter(p => p.name === 'Drake London').length, 1); // NYJ copy dropped
  assert.equal(seeded.find(p => p.name === 'Drake London')!.teamId, 'ATL');
  assert.ok(seeded.some(p => p.id === 'kc_1'));
  assert.ok(seeded.every(p => p.teamId !== 'ATL' || p.id === p.gsisId));
  assert.deepEqual(seedLeagueRosters(league(), []), league());
});

// ---------- service fallback chain ----------

const memoryStore = (initial: TeamRosterSnapshot | null = null) => {
  let value = initial;
  return { read: async () => value, write: async (s: TeamRosterSnapshot) => { value = s; }, get: () => value };
};
const NOW = new Date('2026-11-15T00:00:00.000Z');
const service = (overrides: Record<string, unknown>) => createRosterService({
  client: null, cache: memoryStore(), snapshot: memoryStore(), curated: [], cacheTtlMs: 7 * 24 * 3_600_000, now: () => NOW, ...overrides
} as any);
const liveClient = (calls: { n: number }) => ({ runBatch: async () => { calls.n++; return [{ data: fixture, error: null }]; }, getCreditsUsed: () => 0 });
const failingClient = { runBatch: async () => { throw new Error('down'); }, getCreditsUsed: () => 0 };
const aged = (days: number): TeamRosterSnapshot => ({ ...snapshot(), fetchedAt: new Date(NOW.getTime() - days * 86_400_000).toISOString() });

test('service: fresh cache is served without a provider call', async () => {
  const calls = { n: 0 };
  const res = await service({ client: liveClient(calls), cache: memoryStore(aged(1)) }).getTeamRoster('ATL');
  assert.equal(res.source, 'cache');
  assert.equal(calls.n, 0);
  assert.equal(res.players.length, 18);
});

test('service: expired cache triggers one live fetch and rewrites the cache', async () => {
  const calls = { n: 0 };
  const cache = memoryStore(aged(30));
  const svc = service({ client: liveClient(calls), cache });
  const [a, b] = await Promise.all([svc.getTeamRoster('ATL'), svc.getTeamRoster('ATL')]);
  assert.equal(a.source, 'firecrawl');
  assert.equal(b.source, 'firecrawl');
  assert.equal(calls.n, 1); // concurrent requests share one call
  assert.equal(cache.get()!.fetchedAt, new Date(1794694072188).toISOString());
});

test('service: live failure falls back to stale cache, then snapshot, then errors', async () => {
  assert.equal((await service({ client: failingClient, cache: memoryStore(aged(30)) }).getTeamRoster('ATL')).source, 'stale_cache');
  assert.equal((await service({ client: failingClient, snapshot: memoryStore(aged(90)) }).getTeamRoster('ATL')).source, 'snapshot');
  assert.equal((await service({ snapshot: memoryStore(aged(90)) }).getTeamRoster('ATL')).source, 'snapshot');
  await assert.rejects(service({}).getTeamRoster('ATL'), RosterUnavailableError);
});

test('service: Arizona is requested with the provider code AZ', async () => {
  let sent: any;
  const client = { runBatch: async (calls: any[]) => { sent = calls[0]; return [{ data: fixture, error: null }]; }, getCreditsUsed: () => 0 };
  await service({ client, season: 2026 }).getTeamRoster('ARI');
  assert.deepEqual(sent, { provider: 'nfl-com', capability: 'sports-league-data/team_roster', options: { team: 'AZ', season: 2026 } });
});

// ---------- Firecrawl client ----------

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

test('client: sends the alexandria body with the bearer key and parses results in order', async () => {
  let request: any;
  const client = createFirecrawlClient({
    apiKey: 'fc-test',
    fetchImpl: (async (url: string, init: any) => {
      request = { url, init };
      return jsonResponse(200, { success: true, data: { alexandria: [{ data: { a: 1 } }, { error: { code: 'bad_input' } }], creditsCost: 5 } });
    }) as any
  });
  const results = await client.runBatch([{ provider: 'p', capability: 'c', options: {} }, { provider: 'p', capability: 'c', options: {} }]);
  assert.equal(request.url, 'https://api.firecrawl.dev/v2/scrape');
  assert.equal(request.init.headers.Authorization, 'Bearer fc-test');
  assert.equal(JSON.parse(request.init.body).alexandria.length, 2);
  assert.deepEqual(results, [{ data: { a: 1 }, error: null }, { data: null, error: 'bad_input' }]);
  assert.equal(client.getCreditsUsed(), 5);
});

test('client: retries 429 and 5xx, does not retry 4xx', async () => {
  let attempts = 0;
  const retrying = createFirecrawlClient({
    apiKey: 'k', sleep: async () => {},
    fetchImpl: (async () => (++attempts < 3 ? jsonResponse(503, {}) : jsonResponse(200, { data: { alexandria: [{ data: {} }] } }))) as any
  });
  await retrying.runBatch([{ provider: 'p', capability: 'c', options: {} }]);
  assert.equal(attempts, 3);

  let unauthorized = 0;
  const failing = createFirecrawlClient({ apiKey: 'k', sleep: async () => {}, fetchImpl: (async () => { unauthorized++; return jsonResponse(401, {}); }) as any });
  await assert.rejects(failing.runBatch([{ provider: 'p', capability: 'c', options: {} }]), FirecrawlError);
  assert.equal(unauthorized, 1);
});

test('service: stored league returns cache or snapshot teams without calling the provider', async () => {
  const calls = { n: 0 };
  const teams = await service({ client: liveClient(calls), snapshot: memoryStore(aged(90)) }).getStoredLeague();
  assert.equal(calls.n, 0);
  assert.equal(teams.length, 32); // the memory store answers for every team ID
  assert.equal(teams[0].source, 'snapshot');
});

