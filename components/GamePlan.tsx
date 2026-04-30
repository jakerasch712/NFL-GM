import React, { useState } from 'react';
import { Shield, Zap, Target, AlertCircle, Activity, ChevronRight, Clipboard, Flame } from 'lucide-react';
import { MOCK_PLAYERS, TEAMS_DB } from '../constants';
import { Player } from '../types';
import { SCHEDULE_2027 } from '../schedule';

interface GamePlanProps {
  selectedTeamId: string;
  currentWeek: number;
  allPlayers: Player[];
  teams: Record<string, any>;
}

const GamePlan: React.FC<GamePlanProps> = ({ selectedTeamId, currentWeek, allPlayers, teams }) => {
  const players = allPlayers.filter(p => p.teamId === selectedTeamId);
  const [focus, setFocus] = useState<'OFFENSE' | 'DEFENSE' | 'BALANCED'>('BALANCED');
  const [intensity, setIntensity] = useState(50);

  // Find next match
  const nextMatch = SCHEDULE_2027.find(m => 
    m.week >= currentWeek && (m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId)
  );

  let nextOpp: any = { name: 'BYE', code: 'BYE' };
  if (nextMatch) {
    const oppId = nextMatch.homeTeamId === selectedTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId;
    const oppTeam = teams[oppId] || TEAMS_DB[oppId];
    nextOpp = {
      name: `${oppTeam.city} ${oppTeam.name}`,
      code: oppId
    };
  }

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-[#05070a]">
      <header className="mb-10 border-b border-[#1a222e] pb-6">
        <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">TACTICAL_PREP_COMMAND</h2>
        <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
          <Activity size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
          SESSION::WEEK {currentWeek.toString().padStart(2, '0')} // NODE_TARGET::{nextOpp.name.replace(' ', '_').toUpperCase()}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 flex-1 overflow-hidden">
        {/* Left: Game Planning */}
        <div className="lg:col-span-2 space-y-1 overflow-y-auto pr-1">
          <div className="bg-[#0a0e14] border border-[#1a222e] p-8 shadow-xl">
            <h3 className="text-[10px] font-bold text-white mb-8 flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Clipboard size={18} className="text-cyan-400 animate-pulse" />
                STRATEGIC_PROTOCOL_INITIALIZATION
            </h3>
            
            <div className="grid grid-cols-3 gap-1 mb-10">
                {(['OFFENSE', 'DEFENSE', 'BALANCED'] as const).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFocus(f)}
                        className={`p-6 border transition-all relative overflow-hidden group ${
                            focus === f 
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(0,209,255,0.1)]' 
                            : 'bg-[#05070a] border-[#1a222e] text-slate-600 hover:border-slate-700'
                        }`}
                    >
                        {focus === f && <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500 animate-pulse"></div>}
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 mono-font italic">{f}</div>
                        <div className="text-[9px] font-mono tracking-widest opacity-50 uppercase">FOCUS_LOAD</div>
                    </button>
                ))}
            </div>

            <div className="space-y-10">
                <div>
                    <div className="flex justify-between mb-4 items-end">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mono-font italic">PRACTICE_INTENSITY_CORE</label>
                        <span className={`text-2xl font-mono font-bold tracking-tighter ${intensity > 75 ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-cyan-500 shadow-[0_0_10px_rgba(0,209,255,0.3)]'}`}>{intensity}%</span>
                    </div>
                    <div className="relative pt-2">
                        <input 
                            type="range" min="0" max="100" 
                            value={intensity} 
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className="w-full h-1 bg-[#1a222e] appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all border-x border-[#1a222e]" 
                        />
                        <div className="flex justify-between text-[8px] text-slate-700 mt-3 uppercase font-bold tracking-widest mono-font italic">
                            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-[#1a222e]"></div> MIN_THRESHOLD::WALKTHROUGH</span>
                            <span className="flex items-center gap-2">MAX_THRESHOLD::FULL_GEAR <div className="w-1 h-1 bg-[#1a222e]"></div></span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#05070a] border border-[#1a222e] p-6 flex items-start gap-4 group hover:border-amber-500/30 transition-colors">
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
                        <AlertCircle size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-white mb-2 uppercase tracking-[0.2em] mono-font italic">BIOMETRIC_RISK_ASSESSMENT</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-mono uppercase tracking-widest italic">
                            High intensity engagement increases <span className="text-red-500 underline decoration-red-500/20 underline-offset-4">FATIGUE_NODE</span> & <span className="text-red-500 underline decoration-red-500/20 underline-offset-4">STRUCT_FAILURE</span>. 
                            Active settings: <span className="text-amber-500 font-bold">+12% FATIGUE_ACCELERATION</span>.
                        </p>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-[#0a0e14] border border-[#1a222e] p-8 shadow-xl">
            <h3 className="text-[10px] font-bold text-white mb-8 flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Target size={18} className="text-fuchsia-400 animate-pulse" />
                ADVERSARY_SIGNATURE_READOUT
            </h3>
            <div className="grid grid-cols-2 gap-1">
                <div className="p-6 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                    <div className="text-[9px] text-slate-600 uppercase font-bold mb-3 tracking-widest italic">OFFENSIVE_TENDENCY</div>
                    <div className="text-xs text-white font-bold tracking-widest font-mono uppercase">HEAVY_RUN // RPO_ENGINE</div>
                </div>
                <div className="p-6 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                    <div className="text-[9px] text-slate-600 uppercase font-bold mb-3 tracking-widest italic">DEFENSIVE_VULNERABILITY</div>
                    <div className="text-xs text-white font-bold tracking-widest font-mono uppercase">DEEP_PASS_VECTOR // SLOT_ENTRY</div>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Roster Health & Wear and Tear */}
        <div className="bg-[#0a0e14] border border-[#1a222e] flex flex-col overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-[#1a222e] bg-[#0d121a]/50">
            <h3 className="text-[10px] font-bold text-white flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Activity size={18} className="text-emerald-500 animate-pulse" />
                BIOMETRIC_REGISTRY
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-1 bg-[#05070a]/20">
            {players.map(player => (
                <div key={player.id} className="p-5 bg-[#0a0e14] border border-[#1a222e] group hover:border-cyan-500/30 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="font-bold text-white text-xs tracking-tight uppercase italic header-font group-hover:text-cyan-400 transition-colors">{player.name}</div>
                            <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mono-font mt-1">{player.position} // NODE_ID::{player.id.slice(0, 4)}</div>
                        </div>
                        <div className={`text-lg font-mono font-bold tracking-tighter ${player.fatigue < 80 ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>
                            {player.fatigue}%
                        </div>
                    </div>
                    <div className="w-full bg-[#05070a] h-[2px] border border-[#1a222e] overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${player.fatigue < 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} 
                            style={{width: `${player.fatigue}%`}}
                        ></div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <div className="flex gap-1">
                            {player.fatigue < 90 && (
                                <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-bold uppercase tracking-widest mono-font animate-pulse italic">LIMIT_EXCEEDED</span>
                            )}
                        </div>
                        <button className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mono-font hover:text-cyan-400 transition-colors italic">
                            INIT_REST_PROTOCOL
                        </button>
                    </div>
                </div>
            ))}
          </div>
          <div className="p-8 bg-[#0d121a] border-t border-[#1a222e]">
            <button className="w-full py-4 bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-500 hover:border-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl mono-font italic">
                FINALIZE_TACTICAL_DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlan;
