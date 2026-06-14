import React, { useState } from 'react';
import { TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { Shield, TrendingUp, Battery, AlertCircle, Briefcase, Search, Filter, UserMinus, DollarSign, RefreshCw, CheckCircle2, Loader2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { RestructureModal, ReleasePlayerModal } from './CapModals';
import { Player, Position } from '../types';
import { syncTeamRoster } from '../services/geminiService';
import { getTeamCapSpace, restructureContract } from '../services/financeService';
import { motion, AnimatePresence } from 'motion/react';

interface RosterViewProps {
  selectedTeamId: string;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teams: Record<string, any>;
}

const RosterView: React.FC<RosterViewProps> = ({ selectedTeamId, allPlayers, setAllPlayers, teams }) => {
  const players = allPlayers.filter(p => p.teamId === selectedTeamId);
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];
  
  const [capSpace, setCapSpace] = useState(14.2);
  const [deadCap, setDeadCap] = useState(12.8);
  
  // Real Cap Calculation using Finance Service
  const realCapSpace = getTeamCapSpace(players, 255.4);
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [restructuringPlayerId, setRestructuringPlayerId] = useState<string | null>(null);
  const [releasingPlayerId, setReleasingPlayerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'financial' | 'depth_chart'>('standard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);
  const activeRestructurePlayer = players.find(p => p.id === restructuringPlayerId);
  const activeReleasePlayer = players.find(p => p.id === releasingPlayerId);

  const handleUpdateMorale = (playerId: string, moraleChange: number) => {
    setAllPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, morale: Math.min(100, Math.max(0, p.morale + moraleChange)) };
      }
      return p;
    }));
  };

  const handleSignContract = (playerId: string, newContract: any) => {
    setAllPlayers(prev => prev.map(p => {
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
    
    setAllPlayers(prev => prev.filter(p => p.id !== activeReleasePlayer.id));
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
    setAllPlayers(prev => prev.map(p => {
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
        setAllPlayers(updatedPlayers);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reorders depth positions for drag-and-drop / select movements
  const handleReorder = (draggedId: string, targetId: string) => {
    const dragged = allPlayers.find(p => p.id === draggedId);
    const target = allPlayers.find(p => p.id === targetId);
    if (!dragged || !target || dragged.position !== target.position || dragged.teamId !== target.teamId) return;

    const pos = dragged.position;
    const posPlayers = allPlayers.filter(p => p.teamId === selectedTeamId && p.position === pos);
    
    // Sort logically to map custom ranks securely
    const sortedPosPlayers = [...posPlayers].sort((a, b) => {
      if (a.depth !== undefined && b.depth !== undefined) {
        return a.depth - b.depth;
      }
      return b.overall - a.overall;
    });

    const draggedIdx = sortedPosPlayers.findIndex(p => p.id === draggedId);
    const targetIdx = sortedPosPlayers.findIndex(p => p.id === targetId);

    const newOrder = [...sortedPosPlayers];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, dragged);

    const updatedPlayers = allPlayers.map(p => {
      if (p.teamId === selectedTeamId && p.position === pos) {
        const idx = newOrder.findIndex(np => np.id === p.id);
        return { ...p, depth: idx + 1 };
      }
      return p;
    });

    setAllPlayers(updatedPlayers);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-[#05070a]">
      <header className="mb-10 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">ROSTER_REGISTRY</h2>
          <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
            <Shield size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
            {team.city} {team.name} // NODE_LIMIT::53_MAN
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSyncRoster}
            disabled={isSyncing}
            className={`flex items-center gap-3 px-6 py-3 border transition-all font-bold uppercase tracking-[0.2em] text-[10px] mono-font ${
              syncSuccess 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                : 'bg-[#0d121a]/50 border-[#1a222e] text-slate-500 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/5'
            }`}
          >
            {isSyncing ? (
              <Loader2 size={16} className="animate-spin text-cyan-500" />
            ) : syncSuccess ? (
              <CheckCircle2 size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            {isSyncing ? 'SYNC_IN_PROGRESS...' : syncSuccess ? 'ROSTER_REFLOW::SYNC_SUCCESS' : 'INIT_REAL_TIME_SYNC'}
          </button>
          <div className="bg-[#0a0e14] border border-[#1a222e] p-5 min-w-[180px] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/50"></div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1 mono-font">CAP_AVAILABILITY // TOP_51</div>
            <div className="text-3xl font-mono font-bold text-emerald-500 tracking-tighter">${realCapSpace.toFixed(1)}M</div>
          </div>
          <div className="bg-[#0a0e14] border border-[#1a222e] p-5 min-w-[180px] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 h-full bg-red-500/50"></div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1 mono-font">DEAD_CAP_LIABILITY</div>
            <div className="text-3xl font-mono font-bold text-red-500 tracking-tighter">${deadCap.toFixed(1)}M</div>
          </div>
        </div>
      </header>

      <div className="bg-[#0a0e14] border border-[#1a222e] flex-1 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-[#1a222e] flex justify-between items-center bg-[#0d121a]/50">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                type="text" 
                placeholder="QUERY_PLAYER_DATABASE..." 
                className="bg-[#05070a] border border-[#1a222e] pl-10 pr-4 py-2 text-[10px] font-mono text-cyan-500 focus:outline-none focus:border-cyan-500/50 transition-all w-80 placeholder:text-slate-700 tracking-widest"
              />
            </div>
            <div className="flex bg-[#05070a] p-1 border border-[#1a222e]">
              <button 
                onClick={() => setViewMode('standard')}
                className={`px-6 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase transition-all ${viewMode === 'standard' ? 'bg-cyan-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}
              >
                TACTICAL
              </button>
              <button 
                onClick={() => setViewMode('financial')}
                className={`px-6 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase transition-all ${viewMode === 'financial' ? 'bg-cyan-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}
              >
                FINANCIAL
              </button>
              <button 
                onClick={() => setViewMode('depth_chart')}
                className={`px-6 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase transition-all ${viewMode === 'depth_chart' ? 'bg-cyan-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}
              >
                DEPTH CHART
              </button>
            </div>
            <button className="flex items-center gap-2 px-6 py-2 bg-[#05070a] border border-[#1a222e] text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all">
              <Filter size={14} />
              DATABASE_FILTERS
            </button>
          </div>
          <div className="flex gap-6 text-[9px] font-bold uppercase tracking-[0.2em] mono-font text-slate-600 italic">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 shadow-[0_0_5px_rgba(0,209,255,1)]"></div> SCHEME_FIT</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]"></div> EXP_THRESHOLD</span>
          </div>
        </div>

        {viewMode === 'depth_chart' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#05070a]/50">
            <div className="p-4 bg-[#0a0e14] border border-[#1a222e] flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-3 text-cyan-400 font-bold">
                <AlertCircle size={14} className="animate-pulse" />
                <span>GRID_INTERACTION :: DRAG_PLAYERS OR CLICK CHEVRONS TO SET STARTER & BACKUP SLOTS.</span>
              </div>
              <div className="text-slate-500 font-bold">
                SCHEMATIC_RANKING :: AUTO_CALCULATED
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Offense PANEL */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-cyan-500 font-mono tracking-[0.4em] uppercase border-b border-cyan-500/20 pb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-500 shadow-[0_0_5px_rgba(0,209,255,1)]"></div>
                  OFFENSIVE_TACTICAL_UNITS
                </h3>
                {[Position.QB, Position.RB, Position.WR, Position.TE, Position.OL].map(pos => {
                  const posPlayers = players.filter(p => p.position === pos);
                  const sortedPosPlayers = [...posPlayers].sort((a, b) => {
                    if (a.depth !== undefined && b.depth !== undefined) {
                      return a.depth - b.depth;
                    }
                    return b.overall - a.overall;
                  });

                  return (
                    <div key={pos} className="bg-[#0a0e14] border border-[#1a222e] p-5">
                      <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mb-4 uppercase border-b border-[#1a222e]/40 pb-2">
                        {pos} - {pos === 'QB' ? 'QUARTERBACK' : pos === 'RB' ? 'RUNNING BACK' : pos === 'WR' ? 'WIDE RECEIVER' : pos === 'TE' ? 'TIGHT END' : 'OFFENSIVE LINE'} ({sortedPosPlayers.length})
                      </h4>
                      <div className="space-y-1.5">
                        {sortedPosPlayers.length === 0 ? (
                          <div className="text-center p-6 text-[10px] text-slate-700 font-mono tracking-widest uppercase">NO_ACTIVE_PLAYER_IN_NODE</div>
                        ) : (
                          sortedPosPlayers.map((player, idx) => {
                            const isStarter = idx === 0;
                            return (
                              <div 
                                key={player.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', player.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  const draggedId = e.dataTransfer.getData('text/plain');
                                  handleReorder(draggedId, player.id);
                                }}
                                className={`flex items-center justify-between p-3 border transition-all ${isStarter ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-[#05070a] border-[#1a222e]'} hover:border-cyan-500/40 cursor-grab active:cursor-grabbing group`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-slate-600 group-hover:text-cyan-500/70 transition-colors">
                                    <GripVertical size={14} />
                                  </div>
                                  <div className={`w-16 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-none text-center border ${isStarter ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_8px_rgba(0,209,255,0.05)]' : 'bg-[#0a0e14] text-slate-500 border-slate-800'}`}>
                                    {isStarter ? 'STARTER' : `DEPTH ${idx + 1}`}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">{player.name}</span>
                                    <span className="text-[7.5px] px-1.5 py-0.2 bg-cyan-500/5 text-slate-500 rounded-none font-bold border border-cyan-500/10 ml-3 uppercase tracking-tighter">{player.archetype}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <div className="text-[10px] font-mono text-slate-500">OVR // SCH_V</div>
                                    <div className="text-xs font-mono font-bold text-white tracking-widest">{player.overall} // <span className="text-cyan-400">{player.schemeOvr}</span></div>
                                  </div>
                                  <div className="flex flex-col border border-[#1a222e] divide-y divide-[#1a222e]">
                                    <button 
                                      onClick={() => {
                                        if (idx > 0) handleReorder(player.id, sortedPosPlayers[idx - 1].id);
                                      }}
                                      disabled={idx === 0}
                                      className="p-1 hover:bg-cyan-500 hover:text-black hover:border-cyan-500 text-slate-600 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                      title="Move Up"
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (idx < sortedPosPlayers.length - 1) handleReorder(player.id, sortedPosPlayers[idx + 1].id);
                                      }}
                                      disabled={idx === sortedPosPlayers.length - 1}
                                      className="p-1 hover:bg-cyan-500 hover:text-black hover:border-cyan-500 text-slate-600 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                      title="Move Down"
                                    >
                                      <ChevronDown size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Defense PANEL */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-emerald-400 font-mono tracking-[0.4em] uppercase border-b border-emerald-500/20 pb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
                  DEFENSIVE_TACTICAL_UNITS
                </h3>
                {[Position.DL, Position.LB, Position.CB, Position.S, Position.K].map(pos => {
                  const posPlayers = players.filter(p => p.position === pos);
                  const sortedPosPlayers = [...posPlayers].sort((a, b) => {
                    if (a.depth !== undefined && b.depth !== undefined) {
                      return a.depth - b.depth;
                    }
                    return b.overall - a.overall;
                  });

                  return (
                    <div key={pos} className="bg-[#0a0e14] border border-[#1a222e] p-5">
                      <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mb-4 uppercase border-b border-[#1a222e]/40 pb-2">
                        {pos} - {pos === 'DL' ? 'DEFENSIVE LINE' : pos === 'LB' ? 'LINEBACKER' : pos === 'CB' ? 'CORNERBACK' : pos === 'S' ? 'SAFETY' : 'SPECIALISTS'} ({sortedPosPlayers.length})
                      </h4>
                      <div className="space-y-1.5">
                        {sortedPosPlayers.length === 0 ? (
                          <div className="text-center p-6 text-[10px] text-slate-700 font-mono tracking-widest uppercase">NO_ACTIVE_PLAYER_IN_NODE</div>
                        ) : (
                          sortedPosPlayers.map((player, idx) => {
                            const isStarter = idx === 0;
                            return (
                              <div 
                                key={player.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', player.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  const draggedId = e.dataTransfer.getData('text/plain');
                                  handleReorder(draggedId, player.id);
                                }}
                                className={`flex items-center justify-between p-3 border transition-all ${isStarter ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#05070a] border-[#1a222e]'} hover:border-emerald-500/40 cursor-grab active:cursor-grabbing group`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-slate-600 group-hover:text-emerald-500/70 transition-colors">
                                    <GripVertical size={14} />
                                  </div>
                                  <div className={`w-16 text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-none text-center border ${isStarter ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]' : 'bg-[#0a0e14] text-slate-500 border-slate-800'}`}>
                                    {isStarter ? 'STARTER' : `DEPTH ${idx + 1}`}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">{player.name}</span>
                                    <span className="text-[7.5px] px-1.5 py-0.2 bg-emerald-500/5 text-slate-500 rounded-none font-bold border border-emerald-500/10 ml-3 uppercase tracking-tighter">{player.archetype}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <div className="text-[10px] font-mono text-slate-500">OVR // SCH_V</div>
                                    <div className="text-xs font-mono font-bold text-white tracking-widest">{player.overall} // <span className="text-emerald-400">{player.schemeOvr}</span></div>
                                  </div>
                                  <div className="flex flex-col border border-[#1a222e] divide-y divide-[#1a222e]">
                                    <button 
                                      onClick={() => {
                                        if (idx > 0) handleReorder(player.id, sortedPosPlayers[idx - 1].id);
                                      }}
                                      disabled={idx === 0}
                                      className="p-1 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-slate-600 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                      title="Move Up"
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (idx < sortedPosPlayers.length - 1) handleReorder(player.id, sortedPosPlayers[idx + 1].id);
                                      }}
                                      disabled={idx === sortedPosPlayers.length - 1}
                                      className="p-1 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-slate-600 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                      title="Move Down"
                                    >
                                      <ChevronDown size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0d121a] z-10">
                  <tr className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold border-b border-[#1a222e] mono-font">
                    <th className="px-6 py-5 font-bold">NODE_ID</th>
                    <th className="px-4 py-5 font-bold">POS_V</th>
                    {viewMode === 'standard' ? (
                      <>
                        <th className="px-4 py-5 font-bold text-center">OVR</th>
                        <th className="px-4 py-5 font-bold text-center">SCH_V</th>
                        <th className="px-4 py-5 font-bold text-center">DEV_STATUS</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-5 font-bold">TOTAL_VAL</th>
                        <th className="px-4 py-5 font-bold">BONUS_STR</th>
                        <th className="px-4 py-5 font-bold">REM_YRS</th>
                      </>
                    )}
                    <th className="px-4 py-5 font-bold">CAP_VAL</th>
                    <th className="px-4 py-5 font-bold">DEAD_VAL</th>
                    <th className="px-6 py-5 font-bold text-right">PROTOCOLS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a222e]/30">
                  {players.map(player => (
                    <tr key={player.id} className="hover:bg-cyan-500/5 transition-all duration-300 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-[2px] h-10 bg-[#1a222e] relative overflow-hidden">
                            <div 
                              className={`absolute bottom-0 w-full transition-all duration-1000 ${player.morale > 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : player.morale > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ height: `${player.morale}%` }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight italic header-font">{player.name}</div>
                            <div className="flex items-center gap-3 mt-1 mono-font">
                              <span className="text-[9px] text-slate-600 uppercase tracking-widest">{player.archetype} // {player.age}_CYCLES</span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-cyan-500/5 text-cyan-500/80 rounded-none font-bold border border-cyan-500/20 uppercase tracking-tighter">{player.personality}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-[#05070a] border border-[#1a222e] text-[9px] font-bold text-slate-500 tracking-widest mono-font">{player.position}</span>
                      </td>
                      {viewMode === 'standard' ? (
                        <>
                          <td className="px-4 py-4 text-center">
                            <div className="text-xl font-mono font-bold text-white tracking-widest">{player.overall}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <div className={`text-xl font-mono font-bold tracking-widest ${player.schemeOvr >= player.overall ? 'text-cyan-400' : 'text-slate-600'}`}>
                                    {player.schemeOvr}
                                </div>
                                {player.schemeOvr > player.overall && <TrendingUp size={12} className="text-cyan-400 animate-pulse" />}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] mono-font italic ${
                              player.developmentTrait === 'X-Factor' ? 'text-fuchsia-400 border border-fuchsia-500/30 bg-fuchsia-500/5' :
                              player.developmentTrait === 'Superstar' ? 'text-amber-400 border border-amber-500/30 bg-amber-500/5' :
                              player.developmentTrait === 'Star' ? 'text-cyan-400 border border-cyan-500/30 bg-cyan-500/5' :
                              'text-slate-600 border border-slate-800'
                            }`}>
                              {player.developmentTrait}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 font-mono text-xs text-white tracking-widest">${player.contract.totalValue.toFixed(1)}M</td>
                          <td className="px-4 py-4 font-mono text-xs text-purple-400 tracking-widest">${player.contract.bonus.toFixed(1)}M</td>
                          <td className="px-4 py-4 font-mono text-xs text-slate-500 tracking-widest">{player.contract.yearsLeft} _CY</td>
                        </>
                      )}
                      <td className="px-4 py-4 font-mono text-xs text-slate-300 tracking-widest">${player.contract.capHit.toFixed(1)}M</td>
                      <td className="px-4 py-4 font-mono text-xs text-red-500/60 tracking-widest">${player.contract.deadCap.toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          {player.contract.yearsLeft === 0 && (
                            <button 
                              onClick={() => setNegotiatingPlayerId(player.id)}
                              className="p-2 hover:bg-emerald-500 hover:text-black text-emerald-500 border border-emerald-500/20 transition-all"
                              title="Extend Contract"
                            >
                              <DollarSign size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => setRestructuringPlayerId(player.id)}
                            className="p-2 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/20 transition-all"
                            title="Restructure"
                          >
                            <TrendingUp size={14} />
                          </button>
                          <button 
                            onClick={() => setReleasingPlayerId(player.id)}
                            className="p-2 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 transition-all"
                            title="Release"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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
