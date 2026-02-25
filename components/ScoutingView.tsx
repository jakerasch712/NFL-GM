import React, { useState } from 'react';
import { DRAFT_CLASS } from '../constants';
import { Search, Filter, Target, Microscope, BarChart3, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { DraftProspect } from '../types';

const ScoutingView: React.FC = () => {
  const [prospects, setProspects] = useState<DraftProspect[]>(DRAFT_CLASS);
  const [scoutingHours, setScoutingHours] = useState(100);
  const [scoutedIds, setScoutedIds] = useState<string[]>([]);

  const handleScout = (id: string) => {
    if (scoutingHours >= 10 && !scoutedIds.includes(id)) {
      setScoutingHours(prev => prev - 10);
      setScoutedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tight">SCOUTING DEPARTMENT</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">2027 Draft Class • Resource Allocation</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[200px] backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Scouting Hours</div>
            <div className="text-cyan-400 font-mono font-bold">{scoutingHours}h</div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full transition-all duration-500" style={{width: `${scoutingHours}%`}}></div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Prospect List */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search prospects..." 
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors w-64"
              />
            </div>
            <div className="flex gap-2">
                <button className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Filter size={16} />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
                  <th className="p-4 font-normal">Prospect</th>
                  <th className="p-4 font-normal">Pos</th>
                  <th className="p-4 font-normal">School</th>
                  <th className="p-4 font-normal">Proj. Rd</th>
                  <th className="p-4 font-normal">Grade</th>
                  <th className="p-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {prospects.map(prospect => {
                  const isScouted = scoutedIds.includes(prospect.id);
                  return (
                    <tr key={prospect.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{prospect.name}</div>
                        <div className="flex gap-2 mt-1">
                            {prospect.traits.slice(0, 2).map((t, i) => (
                                <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">{t}</span>
                            ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300">{prospect.position}</span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{prospect.school}</td>
                      <td className="p-4 text-xs text-slate-300 font-mono">Round {prospect.projectedRound}</td>
                      <td className="p-4">
                        {isScouted ? (
                            <div className="text-lg font-mono font-bold text-cyan-400">{prospect.scoutingGrade}</div>
                        ) : (
                            <div className="text-lg font-mono font-bold text-slate-600">??</div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleScout(prospect.id)}
                          disabled={isScouted || scoutingHours < 10}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isScouted 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isScouted ? 'Scouted' : 'Scout (10h)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scouting Insights & Board */}
        <div className="space-y-6 overflow-y-auto pr-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Microscope size={20} className="text-cyan-400" />
                Scouting Report
            </h3>
            <div className="space-y-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Bust Probability</div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full w-[15%]"></div>
                        </div>
                        <span className="text-xs font-mono text-slate-300">LOW (15%)</span>
                    </div>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Gem Potential</div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%]"></div>
                        </div>
                        <span className="text-xs font-mono text-slate-300">HIGH (85%)</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-400" />
                Draft Board Strategy
            </h3>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-400">Target Positions</span>
                    <div className="flex gap-1">
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-bold">QB</span>
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-bold">WR</span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                    <span className="text-xs text-slate-400">Scouting Focus</span>
                    <span className="text-xs text-white font-bold">Combine Metrics</span>
                </div>
            </div>
            <button className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                Auto-Generate Board
            </button>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Sparkles size={20} className="text-cyan-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">AI Scout Analysis</h4>
                    <p className="text-[10px] text-slate-400">Powered by Gemini Pro</p>
                </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
                "Arch Manning shows generational arm talent. His processing speed in the pocket is already at an NFL level. Recommend prioritizing him if we can trade up to #1."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoutingView;
