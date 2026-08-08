import { Player, Position } from '@/types';

/**
 * `depth` is a 1-based rank within (team, position). Any move that changes who
 * is on a team — draft, trade, free-agent signing, release — must re-rank the
 * affected group, or the new player carries a stale rank and can never start.
 *
 * Players already holding a depth keep their relative order; newcomers (no
 * depth) are slotted by overall.
 */
export const rerankDepth = (players: Player[], teamId: string, position: Position): Player[] => {
  const group = players
    .filter(p => p.teamId === teamId && p.position === position)
    .sort((a, b) => {
      const ad = a.depth ?? Number.POSITIVE_INFINITY;
      const bd = b.depth ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return b.overall - a.overall;
    });

  const ranks = new Map(group.map((p, i) => [p.id, i + 1]));
  return players.map(p => (ranks.has(p.id) ? { ...p, depth: ranks.get(p.id) } : p));
};

/**
 * Slots a player into a team's depth chart by overall, then re-ranks the group.
 * Use for arrivals (draft picks, signings, trades) so a better player is not
 * stuck behind the incumbent.
 */
export const insertIntoDepthChart = (players: Player[], player: Player): Player[] => {
  const group = players
    .filter(p => p.teamId === player.teamId && p.position === player.position && p.id !== player.id)
    .sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || b.overall - a.overall);

  // Rank ahead of the first incumbent this player outrates
  const aheadOf = group.findIndex(p => player.overall > p.overall);
  const seeded = { ...player, depth: aheadOf === -1 ? group.length + 1 : aheadOf + 1 };

  const withPlayer = players.some(p => p.id === player.id)
    ? players.map(p => (p.id === player.id ? seeded : p))
    : [...players, seeded];

  // Nudge everyone at or below the insertion point down one, then normalize
  const bumped = withPlayer.map(p =>
    p.id !== seeded.id &&
    p.teamId === seeded.teamId &&
    p.position === seeded.position &&
    (p.depth ?? 99) >= (seeded.depth ?? 99)
      ? { ...p, depth: (p.depth ?? 99) + 1 }
      : p
  );

  return rerankDepth(bumped, seeded.teamId, seeded.position);
};

/** The starter at a position: depth 1 first, then best overall. */
export const getStarter = (roster: Player[], position: Position): Player | undefined =>
  roster
    .filter(p => p.position === position)
    .sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || b.overall - a.overall)[0];
