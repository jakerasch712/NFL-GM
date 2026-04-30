import React, { useState } from 'react';
import { MOCK_COACHES, TEAMS_DB } from '../constants';
import { Shield, Zap, Award, Users, ChevronRight, Star } from 'lucide-react';
import { Coach } from '../types';

interface StaffViewProps {
  selectedTeamId: string;
  coaches: Coach[];
  setCoaches: React.Dispatch<React.SetStateAction<Coach[]>>;
  teams: Record<string, any>;
}

const StaffView: React.FC<StaffViewProps> = ({ selectedTeamId, coaches, setCoaches, teams }) => {
  const teamCoaches = coaches.filter(c => c.teamId === selectedTeamId);
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-[#05070a]">
      <header className="mb-10 border-b border-[#1a222e] pb-6">
        <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">PERSONNEL_MANAGEMENT</h2>
        <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
          <Users size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
          ACTIVE_STAFF_DIRECTIVE // NODE_LINK::COACHING_REGISTRY
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {teamCoaches.map(coach => (
          <div key={coach.id} className="bg-[#0a0e14] border border-[#1a222e] overflow-hidden shadow-xl group hover:border-cyan-500/30 transition-all duration-500 relative">
            <div className="p-8 bg-[#0d121a]/50 border-b border-[#1a222e]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-[#05070a] border border-[#1a222e] flex items-center justify-center font-bold text-cyan-500 mono-font text-lg shadow-[0_0_15px_rgba(0,209,255,0.1)] group-hover:border-cyan-500/50 transition-all">
                  {coach.role}
                </div>
                <div className="flex items-center gap-1.5 text-amber-500">
                  {Array.from({ length: Math.min(5, coach.experience) }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" className="animate-pulse" />
                  ))}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 header-font uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">{coach.name}</h3>
              <div className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold mono-font italic">
                {coach.specialty}_SPEC // SCHEME::{coach.scheme}
              </div>
            </div>

            <div className="p-8 space-y-4">
              <div className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] mono-font italic mb-6 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-slate-800"></div> ACTIVE_LOGIC_TRAITS
              </div>
              {coach.traits.map((trait, i) => (
                <div key={i} className="bg-[#05070a] border border-[#1a222e] p-5 group/trait hover:border-cyan-500/20 transition-all">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center shrink-0 group-hover/trait:scale-110 transition-transform">
                      <Zap size={18} className="text-cyan-500/50" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-2 uppercase italic tracking-tight font-mono">{trait.name}</div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-mono uppercase tracking-widest italic">{trait.description}</p>
                      <div className="mt-3 text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold">
                        MOD::+{trait.bonus.value} {trait.bonus.stat}_VAL
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[#05070a] border-t border-[#1a222e] flex justify-between items-center bg-gradient-to-r from-transparent to-cyan-500/5">
              <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mono-font italic">SERVICE_RECORD:: {coach.experience}YR</div>
              <button className="text-[10px] text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-[0.2em] mono-font transition-all flex items-center gap-2 italic">
                SKILL_TREE_ACCESS <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {/* Hiring Slot */}
        <div className="bg-[#05070a]/30 border border-dashed border-[#1a222e] flex flex-col items-center justify-center p-12 text-center group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden h-full min-h-[400px]">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-[#0a0e14] border border-[#1a222e] flex items-center justify-center mb-6 group-hover:scale-110 transition-all group-hover:border-cyan-500/50 relative z-10 shadow-xl">
            <Users size={32} className="text-slate-700 group-hover:text-cyan-500 transition-colors" />
          </div>
          <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-[0.3em] font-mono italic group-hover:text-white transition-colors relative z-10">HIRE_NEW_COORDINATOR</h3>
          <p className="text-[9px] text-slate-800 mono-font uppercase tracking-widest max-w-[200px] italic group-hover:text-slate-600 transition-colors relative z-10">Expand management tree to unlock cross-unit biometric bonuses.</p>
        </div>
      </div>
    </div>
  );
};

export default StaffView;
