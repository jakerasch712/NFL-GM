import React from 'react';
import { TEAMS_DB } from '../constants';
import { Shield, TrendingUp, Users, Trophy } from 'lucide-react';

interface TeamSelectionProps {
  onSelect: (teamId: string) => void;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ onSelect }) => {
  const teams = Object.values(TEAMS_DB);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-6xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white header-font tracking-tight mb-4">SELECT YOUR FRANCHISE</h1>
          <p className="text-slate-400 uppercase tracking-[0.2em] text-sm font-medium">NFL Head Coach 2026 • Choose Your Path</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => onSelect(team.id)}
              className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-left transition-all hover:bg-slate-800/60 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <Shield className="text-slate-500 group-hover:text-cyan-400 transition-colors" size={24} />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{team.division}</div>
                  <div className="text-xs text-slate-400 font-mono">{team.record}</div>
                </div>
              </div>

              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{team.city}</h3>
                <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors header-font">{team.name}</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">OFF</div>
                  <div className="text-sm font-mono font-bold text-white">{team.stats.off}</div>
                </div>
                <div className="text-center border-x border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">DEF</div>
                  <div className="text-sm font-mono font-bold text-white">{team.stats.def}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">ST</div>
                  <div className="text-sm font-mono font-bold text-white">{team.stats.st}</div>
                </div>
              </div>

              <div className="absolute inset-0 border-2 border-cyan-500/0 rounded-2xl group-hover:border-cyan-500/20 transition-all pointer-events-none"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
