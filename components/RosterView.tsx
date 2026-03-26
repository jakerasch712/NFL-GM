import React, { useState } from 'react';
import { TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { Shield, TrendingUp, Battery, AlertCircle, Briefcase, Search, Filter, UserMinus, DollarSign, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { RestructureModal, ReleasePlayerModal } from './CapModals';
import { Player } from '../types';
import { syncTeamRoster } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface RosterViewProps {
  selectedTeamId: string;
}

const RosterView: React.FC<RosterViewProps> = ({ selectedTeamId }) => {
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS.filter(p => p.teamId === selectedTeamId));
  const team = TEAMS_DB[selectedTeamId];
  const [capSpace, setCapSpace] = useState(14.2);
  const [deadCap, setDeadCap] = useState(12.8);
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [restructuringPlayerId, setRestructuringPlayerId] = useState<string | null>(null);
  const [releasingPlayerId, setReleasingPlayerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'financial'>('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.archetype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);
  const activeRestructurePlayer = players.find(p => p.id === restructuringPlayerId);
  const activeReleasePlayer = players.find(p => p.id === releasingPlayerId);

  const handleUpdateMorale = (playerId: string, moraleChange: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, morale: Math.min(100, Math.max(0, p.morale + moraleChange)) };
      }
      return p;
    }));
  };

  const handleSignContract = (playerId: string, newContract: any) => {
    setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                contract: { ...p.contract, ...newContract },
                contractDemand: undefined 
            };
        }
        return p;
    }));
    
    setCapSpace(prev => parseFloat((prev - (newContract.totalValue / newContract.years)).toFixed(2)));
    setNegotiatingPlayerId(null);
  };

  const handleCutPlayer = (impact: any) => {
    if (!activeReleasePlayer) return;
    
    setPlayers(prev => prev.filter(p => p.id !== activeReleasePlayer.id));
    setCapSpace(prev => parseFloat((prev + impact.net2026Savings).toFixed(2)));
    setDeadCap(prev => parseFloat((prev + impact.immediateDeadCap).toFixed(2)));
    setReleasingPlayerId(null);
  };

  const handleRestructure = (voidYears: number) => {
    if (!activeRestructurePlayer) return;

    const amountToRestructure = activeRestructurePlayer.contract.salary - 1.21;
    const prorationTerm = activeRestructurePlayer.contract.yearsLeft + voidYears;
    const yearlyProration = amountToRestructure / prorationTerm;
    const savings = amountToRestructure - yearlyProration;

    setCapSpace(prev => parseFloat((prev + savings).toFixed(2)));
    setPlayers(prev => prev.map(p => {
        if (p.id === activeRestructurePlayer.id) {
            return {
                ...p,
                contract: {
                    ...p.contract,
                    capHit: parseFloat((p.contract.capHit - savings).toFixed(2)),
                    voidYears: p.contract.voidYears + voidYears,
                    totalLength: p.contract.totalLength + voidYears
                }
            };
        }
        return p;
    }));
    setRestructuringPlayerId(null);
  };

  const handleSyncRoster = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const syncedPlayers = await syncTeamRoster(`${team.city} ${team.name}`);
      if (syncedPlayers.length > 0) {
        const updatedPlayers = syncedPlayers.map(p => ({ ...p, teamId: selectedTeamId }));
        setPlayers(updatedPlayers);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tight">ACTIVE ROSTER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">{team.city} {team.name} • 53-Man Limit</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSyncRoster}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl border transition-all font-bold uppercase tracking-widest text-xs ${
              syncSuccess 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-cyan-500 hover:text-white'
            }`}
          >
            {isSyncing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            {isSyncing ? 'Syncing...' : syncSuccess ? 'Roster Updated' : 'Sync Real Roster'}
          </button>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[160px] backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Cap Space</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">${capSpace.toFixed(1)}M</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[160px] backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Dead Cap</div>
            <div className="text-2xl font-mono font-bold text-red-400">${deadCap.toFixed(1)}M</div>
          </div>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search players..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors w-64"
              />
            </div>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => setViewMode('standard')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'standard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => setViewMode('financial')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'financial' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Financial
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Scheme Fit</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Expiring</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
                <th className="p-4 font-normal">Player</th>
                <th className="p-4 font-normal">Pos</th>
                {viewMode === 'standard' ? (
                  <>
                    <th className="p-4 font-normal">OVR</th>
                    <th className="p-4 font-normal">Scheme OVR</th>
                    <th className="p-4 font-normal">Dev Trait</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-normal">Total Value</th>
                    <th className="p-4 font-normal">Bonus</th>
                    <th className="p-4 font-normal">Years Left</th>
                  </>
                )}
                <th className="p-4 font-normal">Cap Hit</th>
                <th className="p-4 font-normal">Dead Cap</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPlayers.map(player => (
                <tr key={player.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full bg-slate-800 overflow-hidden flex flex-col justify-end">
                        <div 
                          className={`w-full transition-all duration-500 ${player.morale > 80 ? 'bg-emerald-500' : player.morale > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ height: `${player.morale}%` }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter mt-0.5">{player.archetype} • {player.age}y</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300">{player.position}</span>
                  </td>
                  {viewMode === 'standard' ? (
                    <>
                      <td className="p-4">
                        <div className="text-lg font-mono font-bold text-white">{player.overall}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                            <div className={`text-lg font-mono font-bold ${player.schemeOvr >= player.overall ? 'text-cyan-400' : 'text-slate-400'}`}>
                                {player.schemeOvr}
                            </div>
                            {player.schemeOvr > player.overall && <TrendingUp size={12} className="text-cyan-400" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          player.developmentTrait === 'X-Factor' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' :
                          player.developmentTrait === 'Superstar' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          player.developmentTrait === 'Star' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                          'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}>
                          {player.developmentTrait}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-mono text-sm text-white">${player.contract.totalValue.toFixed(1)}M</td>
                      <td className="p-4 font-mono text-sm text-purple-400">${player.contract.bonus.toFixed(1)}M</td>
                      <td className="p-4 font-mono text-sm text-slate-300">{player.contract.yearsLeft} Yrs</td>
                    </>
                  )}
                  <td className="p-4 font-mono text-sm text-slate-300">${player.contract.capHit.toFixed(1)}M</td>
                  <td className="p-4 font-mono text-sm text-red-400/70">${player.contract.deadCap.toFixed(1)}M</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {player.contract.yearsLeft === 0 && (
                        <button 
                          onClick={() => setNegotiatingPlayerId(player.id)}
                          className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                          title="Extend Contract"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setRestructuringPlayerId(player.id)}
                        className="p-2 hover:bg-cyan-500/10 text-cyan-500 rounded-lg transition-colors"
                        title="Restructure"
                      >
                        <TrendingUp size={16} />
                      </button>
                      <button 
                        onClick={() => setReleasingPlayerId(player.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Release"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeNegotiationPlayer && (
        <ContractNegotiation 
          player={activeNegotiationPlayer}
          onSign={handleSignContract}
          onUpdateMorale={handleUpdateMorale}
          onClose={() => setNegotiatingPlayerId(null)}
          capSpace={capSpace}
        />
      )}

      {activeRestructurePlayer && (
        <RestructureModal 
          player={activeRestructurePlayer}
          onConfirm={handleRestructure}
          onClose={() => setRestructuringPlayerId(null)}
        />
      )}

      {activeReleasePlayer && (
        <ReleasePlayerModal 
          player={activeReleasePlayer}
          onConfirm={handleCutPlayer}
          onClose={() => setReleasingPlayerId(null)}
        />
      )}
    </div>
  );
};

export default RosterView;
