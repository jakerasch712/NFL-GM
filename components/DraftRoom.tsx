import React, { useState } from 'react';
import { DRAFT_CLASS, INITIAL_PICKS } from '../constants';
import { Timer, Search, Filter, Star, ArrowRight, History, TrendingUp } from 'lucide-react';
import { DraftProspect, DraftPick } from '../types';

const DraftRoom: React.FC = () => {
  const [prospects, setProspects] = useState<DraftProspect[]>(DRAFT_CLASS);
  const [picks, setPicks] = useState<DraftPick[]>(INITIAL_PICKS);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<{pick: DraftPick, prospect: DraftProspect}[]>([]);

  const currentPick = picks[currentPickIndex];
  const selectedProspect = prospects.find(p => p.id === selectedProspectId);

  const handleDraftPlayer = () => {
    if (!selectedProspect || !currentPick) return;

    setDraftHistory([...draftHistory, { pick: currentPick, prospect: selectedProspect }]);
    setProspects(prospects.filter(p => p.id !== selectedProspectId));
    setSelectedProspectId(null);
    setCurrentPickIndex(currentPickIndex + 1);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
        <header className="mb-6 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                     <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                     <span className="text-red-500 font-bold text-sm tracking-widest uppercase">Live Draft Simulator</span>
                </div>
                <h2 className="text-4xl font-bold text-white header-font">WAR ROOM</h2>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-6xl font-mono font-bold text-cyan-400 tabular-nums tracking-tighter">04:32</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">
                    Round {currentPick?.round} • Pick {currentPick?.pickNumber} • {currentPick?.currentTeamId}
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
                        <button className="text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest">Consensus</button>
                        <button className="text-xs text-cyan-500 uppercase font-bold tracking-widest">Custom</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400"><Search size={16} /></button>
                        <button className="p-2 hover:bg-slate-700 rounded text-slate-400"><Filter size={16} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-lg">
                            <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                <th className="p-4 font-normal w-12">Rank</th>
                                <th className="p-4 font-normal">Prospect</th>
                                <th className="p-4 font-normal">School</th>
                                <th className="p-4 font-normal text-center">Grade</th>
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
                                            {prospect.traits.slice(0, 2).map(t => (
                                                <div key={t} className="text-[10px] text-emerald-500/70 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded uppercase">{t}</div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">{prospect.school}</td>
                                    <td className="p-4 text-center">
                                        <div className={`text-xl font-bold font-mono ${prospect.scoutingGrade > 95 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                            {prospect.scoutingGrade}
                                        </div>
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
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-lg uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 mb-3 flex items-center justify-center gap-2"
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
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                        <TrendingUp size={14} /> Trade Analyzer
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
                                <div className="text-xs font-bold text-emerald-500">A-</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DraftRoom;
