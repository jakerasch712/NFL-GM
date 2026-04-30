import React, { useState } from 'react';
import { Timer, Search, Filter, Star, ArrowRight, History, TrendingUp, RefreshCcw, X, Sparkles, Brain, Loader2 } from 'lucide-react';
import { DraftProspect, DraftPick } from '../types';
import { TEAMS_DB } from '../constants';
import { getDraftStrategy } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface DraftRoomProps {
  selectedTeamId: string;
  prospects: DraftProspect[];
  setProspects: React.Dispatch<React.SetStateAction<DraftProspect[]>>;
  picks: DraftPick[];
  setPicks: React.Dispatch<React.SetStateAction<DraftPick[]>>;
  teams: Record<string, any>;
}

const DraftRoom: React.FC<DraftRoomProps> = ({ selectedTeamId, prospects, setProspects, picks, setPicks, teams }) => {
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<{pick: DraftPick, prospect: DraftProspect}[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  
  // Trade State
  const [tradeTargetTeam, setTradeTargetTeam] = useState(selectedTeamId === 'FA' ? 'BAL' : Object.keys(teams).find(id => id !== selectedTeamId) || 'KC');
  const [userTradePicks, setUserTradePicks] = useState<string[]>([]);
  const [targetTradePicks, setTargetTradePicks] = useState<string[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const currentPick = picks[currentPickIndex];
  const selectedProspect = prospects.find(p => p.id === selectedProspectId);

  const handleDraftPlayer = () => {
    if (!selectedProspect || !currentPick) return;

    setDraftHistory([...draftHistory, { pick: currentPick, prospect: selectedProspect }]);
    setProspects(prospects.filter(p => p.id !== selectedProspectId));
    setSelectedProspectId(null);
    setCurrentPickIndex(currentPickIndex + 1);
  };

  const executeTrade = () => {
    // Simple trade logic: swap currentTeamId for selected picks
    setPicks(prevPicks => prevPicks.map(pick => {
      if (userTradePicks.includes(pick.id)) {
        return { ...pick, currentTeamId: tradeTargetTeam };
      }
      if (targetTradePicks.includes(pick.id)) {
        return { ...pick, currentTeamId: selectedTeamId };
      }
      return pick;
    }));
    setIsTradeModalOpen(false);
    setUserTradePicks([]);
    setTargetTradePicks([]);
  };

  const handleAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    setIsAiModalOpen(true);
    try {
      const strategy = await getDraftStrategy(selectedTeamId, prospects, picks);
      setAiAnalysis(strategy);
    } catch (error) {
      console.error("AI Analysis failed", error);
      setAiAnalysis("Failed to generate strategy analysis.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-[#05070a] relative">
        <header className="mb-6 flex justify-between items-start border-b border-[#1a222e] pb-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                     <span className="w-2 h-2 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                     <span className="text-red-500 font-bold text-[10px] tracking-[0.3em] uppercase mono-font italic">LIVE_DRAFT_STREAM // ACTIVE</span>
                </div>
                <h2 className="text-5xl font-bold text-white header-font uppercase tracking-tighter italic">WAR_ROOM</h2>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={handleAiAnalysis}
                    className="flex items-center gap-2 px-6 py-2 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-black transition-all text-[10px] font-bold uppercase tracking-[0.2em] mono-font italic"
                  >
                    <Brain size={14} />
                    AI_STRATEGIC_ADVISORY
                  </button>
                </div>
                <div className="text-7xl font-mono font-bold text-cyan-400 tabular-nums tracking-tighter shadow-[0_0_30px_rgba(0,209,255,0.1)]">04:32</div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em] mt-2 mono-font italic">
                    {currentPick ? (
                      <>ROUND_{currentPick.round} // PICK_{currentPick.pickNumber} // {currentPick.currentTeamId}</>
                    ) : (
                      "DRAFT_PROTOCOL_TERMINATED"
                    )}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-1 flex-1 min-h-0">
            {/* Big Board */}
            <div className="col-span-8 bg-[#0a0e14] border border-[#1a222e] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-4 border-b border-[#1a222e] flex justify-between items-center bg-[#0d121a]/50">
                    <div className="flex gap-4">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2 mono-font italic">
                            <Star size={14} className="text-amber-500 animate-pulse" />
                            PRIMARY_BOARD_REGISTRY
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 bg-[#05070a] border border-[#1a222e] text-slate-500 hover:text-cyan-400 transition-all"><Search size={14} /></button>
                        <button className="p-2.5 bg-[#05070a] border border-[#1a222e] text-slate-500 hover:text-cyan-400 transition-all"><Filter size={14} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#0d121a] z-10 border-b border-[#1a222e]">
                            <tr className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mono-font italic">
                                <th className="px-6 py-5 font-bold w-20">RANK</th>
                                <th className="px-4 py-5 font-bold">PROSPECT_NODE</th>
                                <th className="px-4 py-5 font-bold">SCHOOL_ORIGIN</th>
                                <th className="px-4 py-5 font-bold text-center">QUAL_V</th>
                                <th className="px-4 py-5 font-bold text-center">POT_V</th>
                                <th className="px-6 py-5 font-bold text-right">METRICS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a222e]/30">
                            {prospects.map((prospect, i) => (
                                <tr 
                                    key={prospect.id} 
                                    onClick={() => setSelectedProspectId(prospect.id)}
                                    className={`hover:bg-cyan-500/5 transition-all duration-300 group cursor-pointer relative ${selectedProspectId === prospect.id ? 'bg-cyan-500/10' : ''}`}
                                >
                                    {selectedProspectId === prospect.id && <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,209,255,1)]"></div>}
                                    <td className="px-6 py-5 font-mono text-slate-600 text-xs font-bold italic">#{i + 1}</td>
                                    <td className="px-4 py-5">
                                        <div className="font-bold text-white text-base group-hover:text-cyan-400 header-font uppercase italic tracking-tight">{prospect.name}</div>
                                        <div className="flex gap-3 mt-1.5 mono-font">
                                            <div className="text-[9px] text-slate-500 font-bold bg-[#05070a] border border-[#1a222e] px-2 py-0.5 uppercase tracking-widest">{prospect.position}</div>
                                            {prospect.scoutingProgress >= 90 && prospect.hiddenTraits.slice(0, 1).map(t => (
                                                <div key={t} className="text-[9px] text-emerald-500 font-bold bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 uppercase tracking-widest flex items-center gap-2">
                                                  <Sparkles size={10} className="animate-pulse" /> {t}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 font-mono text-[10px] text-slate-500 uppercase tracking-widest">{prospect.school}</td>
                                    <td className="px-4 py-5 text-center">
                                        <div className={`text-xl font-bold font-mono tracking-tighter ${prospect.scoutingGrade > 95 ? 'text-cyan-400 shadow-[0_0_10px_rgba(0,209,255,0.2)]' : 'text-emerald-400'}`}>
                                            {prospect.scoutingGrade}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                      {prospect.scoutingProgress >= 50 ? (
                                        <span className={`text-xl font-mono font-bold tracking-widest ${
                                          prospect.potential === 'S' ? 'text-amber-500' : 
                                          prospect.potential === 'A' ? 'text-emerald-500' : 'text-slate-600'
                                        }`}>{prospect.potential}</span>
                                      ) : (
                                        <span className="text-slate-800 font-bold font-mono italic">?</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-5 text-right text-[10px] font-mono text-slate-600 italic">
                                        <div className="flex justify-end gap-4">
                                          <span>40YD: <span className="text-white font-bold">{prospect.combineStats.fortyYard}</span></span>
                                          <span>BENCH: <span className="text-white font-bold">{prospect.combineStats.bench}</span></span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Panel */}
            <div className="col-span-4 flex flex-col gap-1 overflow-hidden">
                {/* Selection Card */}
                <div className="bg-[#0a0e14] border border-[#1a222e] p-8 flex flex-col shadow-xl">
                    {selectedProspect ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                            <div className="text-slate-600 text-[10px] uppercase tracking-[0.3em] font-bold mb-4 mono-font italic border-b border-[#1a222e] pb-2">TARGET_SELECTION</div>
                            <div className="text-4xl font-bold text-white mb-2 header-font italic tracking-tighter uppercase">{selectedProspect.name}</div>
                            <div className="text-cyan-500 font-bold mb-8 mono-font italic text-xs tracking-widest uppercase">{selectedProspect.position} // ORIGIN::{selectedProspect.school}</div>
                            
                            <div className="grid grid-cols-2 gap-1 mb-10 font-mono">
                                <div className="bg-[#05070a] border border-[#1a222e] p-5 group hover:border-cyan-500/30 transition-colors">
                                    <div className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-widest">PROJ_ROUND</div>
                                    <div className="text-white font-bold text-xl tracking-tighter">{selectedProspect.projectedRound}</div>
                                </div>
                                <div className="bg-[#05070a] border border-[#1a222e] p-5 group hover:border-cyan-500/30 transition-colors">
                                    <div className="text-[9px] text-slate-600 uppercase mb-2 font-bold tracking-widest">QUAL_V</div>
                                    <div className="text-cyan-400 font-bold text-xl tracking-tighter">{selectedProspect.scoutingGrade}</div>
                                </div>
                            </div>

                            <button 
                                onClick={handleDraftPlayer}
                                disabled={!currentPick || currentPick.currentTeamId !== selectedTeamId}
                                className="w-full bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-500 hover:border-cyan-400 font-bold py-5 text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl mono-font italic flex items-center justify-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> SUBMIT_SELECTION_PROTOCOL
                            </button>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-700 border border-dashed border-[#1a222e] bg-[#05070a]/30">
                            <Search size={32} className="mb-4 opacity-10" />
                            <p className="text-[9px] uppercase tracking-[0.4em] font-bold mono-font italic animate-pulse">AWAITING_SELECTION_INPUT</p>
                        </div>
                    )}
                    <button 
                      onClick={() => setIsTradeModalOpen(true)}
                      className="w-full mt-1 bg-[#05070a] hover:bg-[#0d121a] text-slate-600 hover:text-cyan-400 font-bold py-3 text-[9px] uppercase tracking-[0.3em] transition-colors flex items-center justify-center gap-3 mono-font border border-[#1a222e]"
                    >
                        <RefreshCcw size={14} /> INITIALIZE_TRADE_INTERFACE
                    </button>
                </div>

                {/* Draft History */}
                <div className="bg-[#0a0e14] border border-[#1a222e] flex-1 flex flex-col overflow-hidden shadow-xl mt-1">
                    <div className="p-5 border-b border-[#1a222e] bg-[#0d121a]/50 flex justify-between items-center">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2 mono-font italic">
                            <History size={14} className="text-slate-500" />
                            RECENT_TRANSACTIONS
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 space-y-1 bg-[#05070a]/20">
                        {draftHistory.length === 0 && (
                            <div className="text-center py-12 text-slate-700 text-[10px] italic font-mono uppercase tracking-widest">TRANSACTION_LOG_EMPTY</div>
                        )}
                        {draftHistory.slice().reverse().map((entry, i) => (
                            <div key={i} className="flex items-center gap-4 bg-[#0a0e14] border border-[#1a222e] p-4 group hover:bg-[#0d121a] transition-colors">
                                <div className="text-[9px] font-mono text-slate-700 font-bold italic tracking-tighter">#{entry.pick.pickNumber}</div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-white uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">{entry.prospect.name}</div>
                                    <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-0.5">{entry.prospect.position} // {entry.pick.currentTeamId}</div>
                                </div>
                                <div className={`text-sm font-bold font-mono ${
                                  entry.prospect.potential === 'S' ? 'text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 
                                  entry.prospect.potential === 'A' ? 'text-emerald-500' : 'text-slate-700'
                                }`}>
                                  {entry.prospect.potential}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Trade Modal */}
        {isTradeModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#05070a]/95 backdrop-blur-xl p-8">
            <div className="bg-[#0a0e14] border border-[#1a222e] w-full max-w-5xl h-5/6 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300">
              <div className="p-8 border-b border-[#1a222e] flex justify-between items-center bg-[#0d121a]/50">
                <h3 className="text-3xl font-bold text-white header-font uppercase tracking-tighter italic">ASSET_REALLOCATION_HUB</h3>
                <button onClick={() => setIsTradeModalOpen(false)} className="text-slate-600 hover:text-white transition-all bg-[#05070a] border border-[#1a222e] p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-[#1a222e]">
                {/* User Side */}
                <div className="p-8 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 bg-[#05070a] p-4 border border-[#1a222e]">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold mono-font text-xl">{selectedTeamId}</div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-widest uppercase italic font-mono">{(teams[selectedTeamId] || TEAMS_DB[selectedTeamId])?.name}</h4>
                      <p className="text-[9px] text-slate-600 uppercase font-bold mono-font tracking-[0.2em] mt-1">AVAILABLE_ASSETS // SOURCE</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {picks.filter(p => p.currentTeamId === selectedTeamId).map(pick => (
                      <button
                        key={pick.id}
                        onClick={() => setUserTradePicks(prev => prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id])}
                        className={`w-full p-5 text-left transition-all border mono-font italic ${
                          userTradePicks.includes(pick.id) 
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                          : 'bg-[#05070a] border-[#1a222e] text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-1">ROUND_{pick.round} // PICK_{pick.pickNumber}</div>
                        <div className="text-[9px] opacity-40 uppercase tracking-tighter font-bold">VALUATION_V::{pick.value}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Side */}
                <div className="p-8 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-4 mb-8 bg-[#05070a] p-4 border border-[#1a222e]">
                    <select 
                      value={tradeTargetTeam} 
                      onChange={(e) => setTradeTargetTeam(e.target.value)}
                      className="bg-[#0a0e14] border border-[#1a222e] px-4 py-2 text-[10px] text-cyan-500 font-bold mono-font focus:outline-none focus:border-cyan-500 uppercase tracking-widest"
                    >
                      {Object.keys(teams).filter(id => id !== selectedTeamId && id !== 'FA').map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-sm tracking-widest uppercase italic font-mono">{(teams[tradeTargetTeam] || TEAMS_DB[tradeTargetTeam])?.name || tradeTargetTeam}</h4>
                      <p className="text-[9px] text-slate-600 uppercase font-bold mono-font tracking-[0.2em] mt-1">TARGET_ASSETS // RECIPIENT</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 text-mono italic">
                    {picks.filter(p => p.currentTeamId === tradeTargetTeam).map(pick => (
                      <button
                        key={pick.id}
                        onClick={() => setTargetTradePicks(prev => prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id])}
                        className={`w-full p-5 text-left transition-all border ${
                          targetTradePicks.includes(pick.id) 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                          : 'bg-[#05070a] border-[#1a222e] text-slate-600 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-1 font-mono">ROUND_{pick.round} // PICK_{pick.pickNumber}</div>
                        <div className="text-[9px] opacity-40 uppercase tracking-tighter font-bold font-mono">VALUATION_V::{pick.value}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-[#1a222e] bg-[#0d121a] flex justify-between items-center text-mono italic font-bold">
                <div className="flex gap-12">
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] mb-2 font-mono">XFER_VALUE_GIVE</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                      {picks.filter(p => userTradePicks.includes(p.id)).reduce((acc, p) => acc + p.value, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] mb-2 font-mono">XFER_VALUE_TAKE</div>
                    <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                      {picks.filter(p => targetTradePicks.includes(p.id)).reduce((acc, p) => acc + p.value, 0)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={executeTrade}
                  disabled={userTradePicks.length === 0 && targetTradePicks.length === 0}
                  className="bg-[#0a0e14] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-500 hover:border-cyan-400 font-bold py-5 px-12 text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl mono-font italic disabled:opacity-10 disabled:cursor-not-allowed"
                >
                  INITIALIZE_EXCHANGE_PROTOCOL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Strategy Modal */}
        <AnimatePresence>
          {isAiModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-[#05070a]/95 backdrop-blur-2xl p-8"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0a0e14] border border-[#1a222e] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
              >
                <div className="p-8 border-b border-[#1a222e] flex justify-between items-center bg-fuchsia-900/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30">
                      <Brain className="text-fuchsia-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white header-font uppercase tracking-tighter italic">AI_WAR_ROOM_ANALYSIS</h3>
                      <p className="text-[9px] text-fuchsia-500/60 uppercase font-bold mono-font tracking-[0.3em] mt-1 italic">ENCRYPTED_ADVISORY_DATA_STREAM</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAiModalOpen(false)} className="text-slate-600 hover:text-white transition-all bg-[#05070a] border border-[#1a222e] p-2">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-markdown relative">
                  {isAiAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                      <div className="relative">
                        <Loader2 className="text-fuchsia-500 animate-spin" size={64} />
                        <div className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full scale-110"></div>
                      </div>
                      <p className="text-fuchsia-400 font-bold animate-pulse uppercase tracking-[0.4em] text-[10px] mono-font italic">DEEP_COGNITION_IN_PROGRESS...</p>
                    </div>
                  ) : (
                    <div className="markdown-body monokai-theme">
                      <Markdown>{aiAnalysis}</Markdown>
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-[#1a222e] bg-[#0d121a]/50 flex justify-end">
                  <button 
                    onClick={() => setIsAiModalOpen(false)}
                    className="bg-[#0a0e14] hover:bg-slate-700 text-white px-12 py-4 border border-[#1a222e] text-[10px] font-bold uppercase tracking-[0.3em] transition-all mono-font italic"
                  >
                    TERMINATE_ENCRYPTION
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default DraftRoom;
