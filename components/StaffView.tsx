import React, { useState } from 'react';
import { MOCK_COACHES } from '../constants';
import { Shield, Zap, Users, ChevronRight, Star, X, Lock } from 'lucide-react';
import { Coach } from '../types';

interface StaffViewProps {
  selectedTeamId: string;
}

const StaffView: React.FC<StaffViewProps> = ({ selectedTeamId }) => {
  const [coaches] = useState<Coach[]>(MOCK_COACHES.filter(c => c.teamId === selectedTeamId));
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8">
        <h2 className="text-4xl font-bold text-white header-font tracking-tight">COACHING STAFF</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">Personnel & Development Tree</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map(coach => (
          <div key={coach.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl group hover:border-cyan-500/50 transition-all">
            <div className="p-6 bg-slate-800/30 border-b border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center font-bold text-cyan-400 border border-slate-800">
                  {coach.role}
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: Math.min(5, coach.experience) }).map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{coach.name}</h3>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {coach.specialty} Specialist • {coach.scheme}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Traits</div>
              {coach.traits.map((trait, i) => (
                <div key={i} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1">{trait.name}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{trait.description}</p>
                    <div className="mt-2 text-[10px] font-mono text-emerald-400 uppercase">
                      Bonus: +{trait.bonus.value} {trait.bonus.stat}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-800/20 border-t border-slate-800 flex justify-between items-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Exp: {coach.experience} Years</div>
              <button
                onClick={() => setSelectedCoach(coach)}
                className="text-xs text-cyan-400 font-bold flex items-center gap-1 hover:text-cyan-300 transition-colors"
              >
                View Skill Tree <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Hiring Slot */}
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center group hover:border-slate-700 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users size={32} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-400 mb-2">Hire New Coordinator</h3>
          <p className="text-xs text-slate-600 max-w-[200px]">Expand your coaching tree to unlock unit bonuses.</p>
        </div>
      </div>

      {/* Skill Tree Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white header-font uppercase">{selectedCoach.name}</h3>
                <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mt-1">{selectedCoach.role} • {selectedCoach.specialty}</p>
              </div>
              <button onClick={() => setSelectedCoach(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Skill Tree</div>

              {/* Active skills */}
              {selectedCoach.traits.map((trait, i) => (
                <div key={i} className="bg-slate-950 border border-emerald-500/30 p-4 rounded-xl flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-bold text-white">{trait.name}</div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Unlocked</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{trait.description}</p>
                    <div className="mt-2 text-[10px] font-mono text-emerald-400 uppercase">
                      Bonus: +{trait.bonus.value} {trait.bonus.stat}
                    </div>
                  </div>
                </div>
              ))}

              {/* Locked skills */}
              {[
                { name: 'Advanced Scheme', desc: 'Unlocks complex play concepts for your unit', req: 5 },
                { name: 'Player Developer', desc: 'Boosts XP gain for young players', req: 8 },
                { name: 'Elite Recruiter', desc: 'Increases free agent interest by 10%', req: 12 },
              ].map((skill, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4 items-start opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-bold text-slate-400">{skill.name}</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">Req. {skill.req}yr exp</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{skill.desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-2 p-3 bg-slate-800/30 rounded-lg text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  {selectedCoach.experience} / {12} Years Experience
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-cyan-500 h-full transition-all"
                    style={{ width: `${Math.min(100, (selectedCoach.experience / 12) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/20">
              <button
                onClick={() => setSelectedCoach(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffView;
