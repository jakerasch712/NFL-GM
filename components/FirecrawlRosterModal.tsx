import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, RefreshCw, UserCheck, X } from 'lucide-react';
import { Player } from '../types';
import { TeamRosterResponse } from '../engine/rosterTypes';
import { mergeTeamRoster, RosterChange } from '../engine/rosterMerge';
import { rosterService, RosterPipelineStatus } from '../services/rosterService';

interface FirecrawlRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId: string;
  team: { city: string; name: string };
  allPlayers: Player[];
  /** Receives the full league player list after the merge. */
  onApplyRoster: (players: Player[]) => void;
}

const SOURCE_LABEL: Record<TeamRosterResponse['source'], string> = {
  firecrawl: 'LIVE FETCH',
  cache: 'CACHED',
  stale_cache: 'STALE CACHE (LIVE FETCH FAILED)',
  snapshot: 'OFFLINE SNAPSHOT'
};

const ChangeList: React.FC<{ title: string; tone: string; items: RosterChange[] }> = ({ title, tone, items }) => (
  <div className="bg-[#05070a] border border-[#1a222e] p-3">
    <div className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${tone}`}>{title} ({items.length})</div>
    {items.length === 0 ? (
      <div className="text-[11px] text-slate-600">None</div>
    ) : (
      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
        {items.map(item => (
          <div key={item.id} className="flex justify-between gap-2 text-[11px] text-slate-300">
            <span className="truncate">{item.position} {item.name}</span>
            <span className="text-slate-500 shrink-0">{item.detail ? `${item.detail} · ` : ''}OVR {item.overall}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const FirecrawlRosterModal: React.FC<FirecrawlRosterModalProps> = ({ isOpen, onClose, selectedTeamId, team, allPlayers, onApplyRoster }) => {
  const [status, setStatus] = useState<RosterPipelineStatus | null>(null);
  const [roster, setRoster] = useState<TeamRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setRoster(null);
    setError(null);
    rosterService.fetchStatus().then(setStatus);
  }, [isOpen, selectedTeamId]);

  // The merge is pure, so the preview is exactly what Apply will commit.
  const preview = useMemo(
    () => (roster ? mergeTeamRoster(allPlayers, roster.players, selectedTeamId) : null),
    [roster, allPlayers, selectedTeamId]
  );

  if (!isOpen) return null;

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRoster(await rosterService.fetchTeamRoster(selectedTeamId));
    } catch (err: any) {
      setError(err.message || 'Roster request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onApplyRoster(preview.players);
    onClose();
  };

  const skippedCount = roster?.skipped.filter(s => s.reason === 'unknown_position' || s.reason === 'unknown_status').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0a0e14] border-2 border-orange-500/60 max-w-4xl w-full p-6 relative flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start border-b border-[#1a222e] pb-4 mb-4">
          <div>
            <span className="text-[11px] text-orange-400 font-bold uppercase tracking-widest">LIVE ROSTER SYNC // NFL.COM VIA FIRECRAWL</span>
            <h3 className="text-2xl font-bold text-white header-font uppercase italic tracking-tight">{team.city} {team.name}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-white p-3 -m-2 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0d121a]/80 p-4 border border-[#1a222e]">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Database size={15} className="text-orange-400" />
              {status === null
                ? 'Checking roster source...'
                : status.liveSourceConfigured
                  ? `Live source ready. Cached for ${status.cacheTtlHours} h per team.`
                  : status.snapshotAvailable
                    ? 'No live key on the server. Using the offline snapshot.'
                    : 'No live key and no snapshot on the server. Sync is unavailable.'}
            </div>
            <button
              onClick={handleFetch}
              disabled={isLoading}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'FETCHING ROSTER...' : roster ? 'FETCH AGAIN' : 'FETCH ROSTER'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {roster && preview && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-[#05070a] border border-[#1a222e] p-3">
                  <div className="text-slate-500 uppercase font-bold">Source</div>
                  <div className="text-white font-bold mt-1">{SOURCE_LABEL[roster.source]}</div>
                </div>
                <div className="bg-[#05070a] border border-[#1a222e] p-3">
                  <div className="text-slate-500 uppercase font-bold">Data as of</div>
                  <div className="text-white font-bold mt-1">{new Date(roster.fetchedAt).toLocaleString()}</div>
                </div>
                <div className="bg-[#05070a] border border-[#1a222e] p-3">
                  <div className="text-slate-500 uppercase font-bold">Season</div>
                  <div className="text-white font-bold mt-1">{roster.season ?? 'Current'}</div>
                </div>
                <div className="bg-[#05070a] border border-[#1a222e] p-3">
                  <div className="text-slate-500 uppercase font-bold">Imported / listed</div>
                  <div className="text-white font-bold mt-1">{roster.players.length} / {roster.providerRosterSize}</div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                Names, positions and roster status are real. Ratings and contracts for new players are modelled by the game, not league data.
                Players already in your save keep their ratings, contracts and progression.
                {skippedCount > 0 && ` ${skippedCount} listed players were skipped because their position or status code is not mapped yet.`}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ChangeList title="New to the league" tone="text-emerald-400" items={preview.diff.added} />
                <ChangeList title="Arriving from another team" tone="text-cyan-400" items={preview.diff.arrived} />
                <ChangeList title="Staying" tone="text-slate-300" items={preview.diff.kept} />
                <ChangeList title="Released to free agency" tone="text-red-400" items={preview.diff.released} />
              </div>
              {preview.diff.placeholdersRemoved > 0 && (
                <div className="text-[11px] text-slate-500">{preview.diff.placeholdersRemoved} generated placeholder players will be removed.</div>
              )}
            </>
          )}
        </div>

        {roster && preview && (
          <div className="flex justify-end gap-3 border-t border-[#1a222e] pt-4 mt-4">
            <button onClick={onClose} className="px-5 py-3 border border-[#1a222e] text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              {roster.source === 'firecrawl' || roster.source === 'cache' ? <CheckCircle2 size={14} /> : <UserCheck size={14} />}
              APPLY TO TEAM ROSTER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirecrawlRosterModal;
