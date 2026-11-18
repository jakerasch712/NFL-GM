import { Router } from 'express';
import { existsSync } from 'fs';
import { rateLimit, requireAdminToken } from '../middleware/security';
import { createRosterServiceFromEnv } from '../rosters/bootstrap';
import { isTeamId, RosterUnavailableError } from '../rosters/service';

/** Live roster routes. Mounted at /api/rosters. */
export function createRosterRouter() {
  const router = Router();
  const { service, settings, ratingInputs } = createRosterServiceFromEnv();
  const adminOnly = requireAdminToken(() => settings.adminToken);

  router.use(rateLimit({ windowMs: 60_000, max: 60 }));

  router.get('/status', (_req, res) => {
    res.json({
      success: true,
      liveSourceConfigured: !!settings.apiKey,
      snapshotAvailable: existsSync(settings.snapshotFile),
      season: settings.season ?? null,
      cacheTtlHours: settings.cacheTtlHours,
      provider: 'NFL.com via Firecrawl',
      contractSource: settings.contractsEnabled ? 'Spotrac cap pages via Firecrawl' : 'modelled',
      ratingInputs: ratingInputs ? { generatedAt: ratingInputs.generatedAt, seasons: ratingInputs.seasons, depthChartAsOf: ratingInputs.depthChartAsOf } : null
    });
  });

  // Stored rosters only (cache and snapshot). Never calls the provider, so it is safe to hit at startup.
  router.get('/league', async (_req, res) => {
    try {
      res.json({ success: true, teams: await service.getStoredLeague() });
    } catch (err) {
      console.error('[rosters] League lookup failed:', err);
      res.status(500).json({ success: false, error: 'League roster lookup failed' });
    }
  });

  // League wide refresh spends provider credits (one call per team), so it is admin only.
  router.post('/refresh', adminOnly, async (_req, res) => {
    try {
      const { snapshots, contracts, errors } = await service.refreshLeague();
      res.json({ success: true, refreshed: snapshots.map(s => s.teamId), contractsRefreshed: contracts.map(c => c.teamId), errors });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message || 'League refresh failed' });
    }
  });

  router.get('/:team', async (req, res) => {
    const teamId = String(req.params.team).toUpperCase();
    if (!isTeamId(teamId)) return res.status(400).json({ success: false, error: 'Unknown team' });
    try {
      res.json(await service.getTeamRoster(teamId));
    } catch (err) {
      if (err instanceof RosterUnavailableError) {
        return res.status(503).json({ success: false, error: 'No live roster, cache or snapshot available for this team' });
      }
      console.error('[rosters] Unexpected error:', err);
      res.status(500).json({ success: false, error: 'Roster lookup failed' });
    }
  });

  return router;
}
