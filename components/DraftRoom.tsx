import React from 'react';
import { DRAFT_CLASS } from '../constants';
import { Timer, Search, Filter, Star } from 'lucide-react';

const DraftRoom: React.FC = () => {
  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
        <header className="mb-6 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                     <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                     <span className="text-red-500 font-bold text-sm tracking-widest uppercase">Live Draft</span>
                </div>
                <h2 className="text-4xl font-bold text-white header-font">WAR ROOM</h2>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-6xl font-mono font-bold text-cyan-400 tabular-nums tracking-tighter">04:32</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">On The Clock: Houston Texans</div>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Big Board */}
            <div className="col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" />
                        Big Board
                    </h3>
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
                            {DRAFT_CLASS.map((prospect, i) => (
                                <tr key={prospect.id} className="hover:bg-cyan-900/10 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-cyan-500">
                                    <td className="p-4 font-mono text-slate-400">{i + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white text-lg group-hover:text-cyan-400">{prospect.name}</div>
                                        <div className="text-xs text-slate-500 font-bold bg-slate-800 inline-block px-1.5 py-0.5 rounded mt-1">{prospect.position}</div>
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

            {/* Team Needs & Action */}
            <div className="col-span-4 flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-xs mb-4">Top Team Needs</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-red-900/50">
                            <span className="font-bold text-white">DT</span>
                            <span className="text-red-500 text-xs font-bold uppercase">Critical</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                            <span className="font-bold text-white">LB</span>
                            <span className="text-amber-500 text-xs font-bold uppercase">High</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                            <span className="font-bold text-white">TE</span>
                            <span className="text-emerald-500 text-xs font-bold uppercase">Moderate</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-900 to-slate-900 border border-cyan-500/30 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-[0_0_30px_rgba(8,145,178,0.15)] flex-1">
                    <div className="mb-4">
                        <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Selected Prospect</div>
                        <div className="text-2xl font-bold text-white mb-1">Arch Manning</div>
                        <div className="text-cyan-400 font-bold">QB • Texas</div>
                    </div>
                    
                    <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded text-lg uppercase tracking-wider shadow-lg transition-transform hover:scale-105 mb-3">
                        Submit Pick
                    </button>
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded text-sm uppercase tracking-wider transition-colors">
                        Explore Trades
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DraftRoom;