import React from 'react';
import { Target, FileText, ChevronRight, Brain } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const GamePlan: React.FC = () => {
  const chartData = [
    { subject: 'Run Def', A: 120, fullMark: 150 },
    { subject: 'Pass Rush', A: 98, fullMark: 150 },
    { subject: 'Coverage', A: 86, fullMark: 150 },
    { subject: 'Turnovers', A: 99, fullMark: 150 },
    { subject: 'Red Zone', A: 85, fullMark: 150 },
    { subject: '3rd Down', A: 65, fullMark: 150 },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
        <header className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 header-font">WEEKLY GAMEPLAN</h2>
            <div className="flex items-center gap-4">
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">vs Kansas City</span>
                <span className="text-slate-500 text-sm">Defensive Coordinator: Steve Spagnuolo</span>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
            {/* Analysis */}
            <div className="col-span-12 md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
                 <div className="absolute top-4 right-4 text-slate-700">
                    <Brain size={24} />
                 </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Opponent DNA</h3>
                
                <div className="h-[300px] w-full flex items-center justify-center -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar
                            name="Chiefs"
                            dataKey="A"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="#ef4444"
                            fillOpacity={0.3}
                        />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="space-y-4 mt-4">
                    <div className="p-4 bg-slate-950 rounded border border-slate-800">
                        <h4 className="text-white font-bold text-sm mb-1">Tendency: Blitz Heavy</h4>
                        <p className="text-xs text-slate-400">KC blitzes DBs on 34% of 3rd downs. Recommend: Quick slant concepts.</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded border border-slate-800">
                        <h4 className="text-white font-bold text-sm mb-1">Weakness: Slot Coverage</h4>
                        <p className="text-xs text-slate-400">Their nickel corner allows 72% completion rate. T. Dell should be primary read.</p>
                    </div>
                </div>
            </div>

            {/* Strategy Selectors */}
            <div className="col-span-12 md:col-span-7 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target size={16} /> Offensive Focus
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-white font-medium">Run / Pass Ratio</span>
                                <span className="text-slate-400 font-mono">40 / 60</span>
                            </div>
                            <input type="range" className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                            <div className="flex justify-between text-xs text-slate-500 mt-1 uppercase tracking-wider">
                                <span>Heavy Run</span>
                                <span>Heavy Pass</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-white font-medium">Tempo</span>
                                <span className="text-slate-400 font-mono">No Huddle</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button className="p-2 border border-slate-700 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors">Chew Clock</button>
                                <button className="p-2 border border-slate-700 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors">Normal</button>
                                <button className="p-2 bg-cyan-600 border border-cyan-500 text-white rounded text-xs font-bold shadow-lg shadow-cyan-900/40">No Huddle</button>
                            </div>
                        </div>

                         <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-white font-medium">Primary Target</span>
                                <span className="text-slate-400 font-mono">N. Collins</span>
                            </div>
                             <select className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded p-2 focus:border-cyan-500 outline-none">
                                <option>Balanced Distribution</option>
                                <option selected>Feed N. Collins (WR1)</option>
                                <option>Establish J. Mixon (RB)</option>
                                <option>Test Deep w/ T. Dell</option>
                             </select>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:border-cyan-500/50 transition-colors">
                    <div>
                        <h3 className="text-white font-bold mb-1">Practice Script</h3>
                        <p className="text-slate-400 text-xs">Manage weekly reps and install plays.</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors text-slate-400">
                        <FileText size={20} />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded font-bold tracking-wide uppercase text-sm shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all">
                        Finalize Plan <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GamePlan;