import React, { useState } from 'react';
import { Shield, Zap, Target, AlertCircle, Activity, ChevronRight, Clipboard, Flame } from 'lucide-react';
import { MOCK_PLAYERS } from '../constants';
import { Player } from '../types';

const GamePlan: React.FC = () => {
  const [players] = useState<Player[]>(MOCK_PLAYERS.filter(p => p.teamId === 'HOU'));
  const [focus, setFocus] = useState<'OFFENSE' | 'DEFENSE' | 'BALANCED'>('BALANCED');
  const [intensity, setIntensity] = useState(50);

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8">
        <h2 className="text-4xl font-bold text-white header-font tracking-tight">GAME WEEK PREP</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">Week 8 vs Indianapolis Colts</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Left: Game Planning */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clipboard size={24} className="text-cyan-400" />
                Weekly Strategy
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
                {(['OFFENSE', 'DEFENSE', 'BALANCED'] as const).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFocus(f)}
                        className={`p-4 rounded-xl border transition-all ${
                            focus === f 
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-900/20' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{f}</div>
                        <div className="text-xs font-medium">Focus Training</div>
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Practice Intensity</label>
                        <span className={`text-sm font-mono font-bold ${intensity > 75 ? 'text-red-400' : 'text-cyan-400'}`}>{intensity}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={intensity} 
                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 uppercase font-bold">
                        <span>Walkthrough</span>
                        <span>Full Pads</span>
                    </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertCircle size={20} className="text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Injury Risk Warning</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            High intensity practice increases <span className="text-red-400">Fatigue</span> and <span className="text-red-400">Injury Risk</span>. 
                            Current settings: <span className="text-amber-500 font-bold">+12% Fatigue</span> this week.
                        </p>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target size={24} className="text-purple-400" />
                Opponent Tendencies
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Offensive Style</div>
                    <div className="text-sm text-white font-bold">Heavy Run / RPO</div>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Defensive Weakness</div>
                    <div className="text-sm text-white font-bold">Deep Passing / Slot</div>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Roster Health & Wear and Tear */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={24} className="text-emerald-400" />
                Roster Health
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {players.map(player => (
                <div key={player.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="font-bold text-white text-sm">{player.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">{player.position}</div>
                        </div>
                        <div className={`text-xs font-mono font-bold ${player.fatigue < 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {player.fatigue}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${player.fatigue < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{width: `${player.fatigue}%`}}
                        ></div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                        <div className="flex gap-1">
                            {player.fatigue < 90 && (
                                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] font-bold uppercase tracking-tighter">Wear & Tear</span>
                            )}
                        </div>
                        <button className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hover:text-cyan-300 transition-colors">
                            Rest Player
                        </button>
                    </div>
                </div>
            ))}
          </div>
          <div className="p-4 bg-slate-800/20 border-t border-slate-800">
            <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all">
                Finalize Game Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlan;
