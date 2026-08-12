import { DecisionImpact, Player, ScheduleMatch, TradeRecord } from '../types';
import { getTeamCapSpace } from './financeService';

export const DEFAULT_OWNER_APPROVAL = 75;
export const DEFAULT_FAN_APPROVAL = 70;

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/**
 * Owner and fan approval move with results. Fans react harder and faster to a
 * given game; owners weight the season body of work more heavily, so their
 * meter drifts more slowly.
 */
export const approvalAfterGame = (
  team: any,
  won: boolean,
  tied: boolean,
  pointDiff: number
): { ownerApproval: number; fanApproval: number } => {
  const owner = team?.ownerApproval ?? DEFAULT_OWNER_APPROVAL;
  const fan = team?.fanApproval ?? DEFAULT_FAN_APPROVAL;

  // A blowout counts for more than a squeaker, capped so one game can't swing it
  const margin = Math.min(3, Math.abs(pointDiff) / 7);
  const base = tied ? 0 : won ? 2 + margin : -(2 + margin);

  return {
    ownerApproval: clamp(owner + base * 0.6),
    fanApproval: clamp(fan + base),
  };
};

/**
 * Owners also care about the books. Called when the calendar advances so a
 * team living in cap trouble steadily loses patience.
 */
export const approvalAfterCapReview = (
  team: any,
  roster: Player[],
  salaryCap: number
): { ownerApproval: number } => {
  const owner = team?.ownerApproval ?? DEFAULT_OWNER_APPROVAL;
  const space = getTeamCapSpace(roster, salaryCap);
  const delta = space < 0 ? -2 : space < 5 ? -0.5 : space > 25 ? 0.5 : 0;
  return { ownerApproval: clamp(owner + delta) };
};

/**
 * The front-office ledger, derived from what actually happened this season:
 * completed games and executed trades. Nothing here is hardcoded.
 */
export const buildDecisionLedger = (
  teamId: string,
  schedule: ScheduleMatch[],
  tradeHistory: TradeRecord[],
  limit = 8
): DecisionImpact[] => {
  const gameEvents: DecisionImpact[] = schedule
    .filter(m => m.isCompleted && m.score && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .map(m => {
      const isHome = m.homeTeamId === teamId;
      const own = isHome ? m.score!.home : m.score!.away;
      const opp = isHome ? m.score!.away : m.score!.home;
      const diff = own - opp;
      const won = diff > 0;
      const tied = diff === 0;
      const margin = Math.min(3, Math.abs(diff) / 7);
      const base = tied ? 0 : won ? 2 + margin : -(2 + margin);
      return {
        id: `game-w${m.week}-${teamId}`,
        category: 'GAME' as const,
        title: tied
          ? `Week ${m.week} tie vs ${isHome ? m.awayTeamId : m.homeTeamId} (${own}-${opp})`
          : `Week ${m.week} ${won ? 'win over' : 'loss to'} ${isHome ? m.awayTeamId : m.homeTeamId} (${own}-${opp})`,
        ownerDelta: Math.round(base * 0.6),
        fanDelta: Math.round(base),
        date: `Week ${m.week}`,
      };
    });

  const tradeEvents: DecisionImpact[] = tradeHistory
    .filter(t => t.myTeamId === teamId)
    .map(t => ({
      id: t.id,
      category: 'ROSTER' as const,
      // Winning the value on a trade pleases the owner; fans miss the names
      title: `Traded ${t.sentAssets.join(', ') || 'assets'} for ${t.receivedAssets.join(', ') || 'assets'}`,
      ownerDelta: t.valueDelta > 0 ? 2 : t.valueDelta < 0 ? -2 : 0,
      fanDelta: t.valueDelta > 0 ? 1 : -1,
      date: t.date,
    }));

  return [...gameEvents, ...tradeEvents].reverse().slice(0, limit);
};
