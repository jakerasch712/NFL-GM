import React, { useState } from 'react';
import { Timer, Search, Filter, Star, ArrowRight, History, TrendingUp, RefreshCcw, X, Sparkles } from 'lucide-react';
import { DraftProspect, DraftPick } from '../types';
import { TEAMS_DB } from '../constants';

interface DraftRoomProps {
  prospects: DraftProspect[];
  setProspects: React.Dispatch<React.SetStateAction<DraftProspect[]>>;
  picks: DraftPick[];
  setPicks: React.Dispatch<React.SetStateAction<DraftPick[]>>;
}

const DraftRoom: React.FC<DraftRoomProps> = ({ prospects, setProspects, picks, setPicks }) => {
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<{pick: DraftPick, prospect: DraftProspect}[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  
  // Trade State
  const [tradeTargetTeam, setTradeTargetTeam] = useState('KC');
  const [userTradePicks, setUserTradePicks] = useState<string[]>([]);
  const [targetTradePicks, setTargetTradePicks] = useState<string[]>([]);

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
        return { ...pick, currentTeamId: 'HOU' }; // Assuming user is HOU
      }
      return pick;
    }));
    setIsTradeModalOpen(false);
    setUserTradePicks([]);
    setTargetTradePicks([]);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950 relative">
        <header className="mb-6 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                     <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                     <span className="text-red-500 font-bold text-sm tracking-widest uppercase">Live Draft Simulator</span>
                </div>
                <h2 className="text-4xl font-bold text-white header-font uppercase">War Room</h2>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-6xl font-mono font-bold text-cyan-400 tabular-nums tracking-tighter">04:32</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">
                    {currentPick ? (
                      <>Round {currentPick.round} • Pick {currentPick.pickNumber} • {currentPick.currentTeamId}</>
                    ) : (
                      "Draft Complete"
                    )}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Big Board */}
            <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div className="flex gap-4">
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" />
                            Big Board
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400"><Search size={16} /></button>
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400"><Filter size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-lg">
                            <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                <th className="p-4 font-normal w-12">Rank</th>
                                <th className="p-4 font-normal">Prospect</th>
                                <th className="p-4 font-normal">School</th>
                                <th className="p-4 font-normal text-center">Grade</th>
                                <th className="p-4 font-normal text-center">Pot.</th>
                                <th className="p-4 font-normal text-right">Combine</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {prospects.map((prospect, i) => (
                                <tr 
                                    key={prospect.id} 
                                    onClick={() => setSelectedProspectId(prospect.id)}
                                    className={`hover:bg-cyan-900/10 transition-colors group cursor-pointer border-l-4 ${selectedProspectId === prospect.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-transparent hover:border-cyan-500'}`}
                                >
                                    <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white text-lg group-hover:text-cyan-400">{prospect.name}</div>
                                        <div className="flex gap-2 mt-1">
                                            <div className="text-[10px] text-slate-500 font-bold bg-slate-800 px-1.5 py-0.5 rounded uppercase">{prospect.position}</div>
                                            {prospect.scoutingProgress >= 90 && prospect.hiddenTraits.slice(0, 1).map(t => (
                                                <div key={t} className="text-[10px] text-emerald-500/70 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                  <Sparkles size={8} /> {t}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">{prospect.school}</td>
                                    <td className="p-4 text-center">
                                        <div className={`text-xl font-bold font-mono ${prospect.scoutingGrade > 95 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                            {prospect.scoutingGrade}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                      {prospect.scoutingProgress >= 50 ? (
                                        <span className={`text-lg font-bold ${
                                          prospect.potential === 'S' ? 'text-yellow-400' : 
                                          prospect.potential === 'A' ? 'text-emerald-400' : 'text-slate-300'
                                        }`}>{prospect.potential}</span>
                                      ) : (
                                        <span className="text-slate-700 font-bold">?</span>
                                      )}
                                    </td>
                                    <td className="p-4 text-right text-xs font-mono text-slate-400">
                                        <div>40yd: <span className="text-white">{prospect.combineStats.fortyYard}</span></div>
                                        <div>Bench: <span className="text-white">{prospect.combineStats.bench}</span></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Panel */}
            <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
                {/* Selection Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col shadow-xl">
                    {selectedProspect ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-slate-500 text-xs uppercase tracking-widest mb-2">Selected Prospect</div>
                            <div className="text-3xl font-bold text-white mb-1 header-font">{selectedProspect.name}</div>
                            <div className="text-cyan-400 font-bold mb-4">{selectedProspect.position} • {selectedProspect.school}</div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Proj. Round</div>
                                    <div className="text-white font-bold">{selectedProspect.projectedRound}</div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Scout Grade</div>
                                    <div className="text-cyan-400 font-bold">{selectedProspect.scoutingGrade}</div>
                                </div>
                            </div>

                            <button 
                                onClick={handleDraftPlayer}
                                disabled={!currentPick || currentPick.currentTeamId !== 'HOU'}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-lg uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 mb-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRight size={20} /> Submit Pick
                            </button>
                        </div>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
                            <Search size={32} className="mb-2 opacity-20" />
                            <p className="text-xs uppercase tracking-widest font-bold">Select a prospect</p>
                        </div>
                    )}
                    <button 
                      onClick={() => setIsTradeModalOpen(true)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={14} /> Trade Picks
                    </button>
                </div>

                {/* Draft History */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                            <History size={14} className="text-slate-400" />
                            Recent Picks
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {draftHistory.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-xs italic">No picks yet</div>
                        )}
                        {draftHistory.slice().reverse().map((entry, i) => (
                            <div key={i} className="flex items-center gap-3 bg-slate-950 p-3 rounded border border-slate-800">
                                <div className="text-[10px] font-mono text-slate-500">#{entry.pick.pickNumber}</div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{entry.prospect.name}</div>
                                    <div className="text-[10px] text-slate-500">{entry.prospect.position} • {entry.pick.currentTeamId}</div>
                                </div>
                                <div className={`text-xs font-bold ${
                                  entry.prospect.potential === 'S' ? 'text-yellow-400' : 
                                  entry.prospect.potential === 'A' ? 'text-emerald-400' : 'text-slate-300'
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-full flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white header-font uppercase tracking-tight">Trade Center</h3>
                <button onClick={() => setIsTradeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-slate-800">
                {/* User Side */}
                <div className="p-6 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">HOU</div>
                    <div>
                      <h4 className="text-white font-bold">Houston Texans</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Your Assets</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {picks.filter(p => p.currentTeamId === 'HOU').map(pick => (
                      <button
                        key={pick.id}
                        onClick={() => setUserTradePicks(prev => prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id])}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          userTradePicks.includes(pick.id) 
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">Round {pick.round} Pick {pick.pickNumber}</div>
                        <div className="text-[10px] opacity-60">Value: {pick.value}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Side */}
                <div className="p-6 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <select 
                      value={tradeTargetTeam} 
                      onChange={(e) => setTradeTargetTeam(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {Object.keys(TEAMS_DB).filter(id => id !== 'HOU' && id !== 'FA').map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    <div>
                      <h4 className="text-white font-bold">{TEAMS_DB[tradeTargetTeam]?.name || tradeTargetTeam}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Target Assets</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {picks.filter(p => p.currentTeamId === tradeTargetTeam).map(pick => (
                      <button
                        key={pick.id}
                        onClick={() => setTargetTradePicks(prev => prev.includes(pick.id) ? prev.filter(id => id !== pick.id) : [...prev, pick.id])}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          targetTradePicks.includes(pick.id) 
                          ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">Round {pick.round} Pick {pick.pickNumber}</div>
                        <div className="text-[10px] opacity-60">Value: {pick.value}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div className="flex gap-8">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Giving Value</div>
                    <div className="text-xl font-mono font-bold text-white">
                      {picks.filter(p => userTradePicks.includes(p.id)).reduce((acc, p) => acc + p.value, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Receiving Value</div>
                    <div className="text-xl font-mono font-bold text-white">
                      {picks.filter(p => targetTradePicks.includes(p.id)).reduce((acc, p) => acc + p.value, 0)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={executeTrade}
                  disabled={userTradePicks.length === 0 && targetTradePicks.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Propose Trade
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DraftRoom;
