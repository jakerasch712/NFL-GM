import React, { useState } from 'react';
import { MOCK_COACHES } from '../constants';
import { Shield, Zap, Award, Users, ChevronRight, Star } from 'lucide-react';
import { Coach } from '../types';

const StaffView: React.FC = () => {
  const [coaches] = useState<Coach[]>(MOCK_COACHES);

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
              <button className="text-xs text-cyan-400 font-bold flex items-center gap-1 hover:text-cyan-300 transition-colors">
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
    </div>
  );
};

export default StaffView;
