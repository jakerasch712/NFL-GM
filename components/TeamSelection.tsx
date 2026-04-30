import React from 'react';
import { TEAMS_DB } from '../constants';
import { Shield, TrendingUp, Users, Trophy } from 'lucide-react';

interface TeamSelectionProps {
  onSelect: (teamId: string) => void;
  teams: Record<string, any>;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ onSelect, teams: teamsMap }) => {
  const teams = Object.values(teamsMap);

  return (
    <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-7xl w-full">
        <header className="text-center mb-6 border-b border-[#1a222e] pb-4">
          <h1 className="text-3xl font-bold text-white header-font tracking-tighter uppercase italic">FRANCHISE_SELECTOR</h1>
          <p className="text-cyan-500 text-[9px] mono-font mt-1 uppercase tracking-[0.4em] font-bold italic">
            NFL_HC_2027 // NODE_ESTABLISHMENT_PROTOCOL
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-[#1a222e]">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => onSelect(team.id)}
              className="group relative bg-[#0a0e14] p-3 text-left transition-all hover:bg-cyan-500/5 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-10 h-10 bg-[#05070a] border border-[#1a222e] flex items-center justify-center group-hover:border-cyan-500/50 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-hidden"
                  style={{ borderColor: team.primaryColor ? `${team.primaryColor}44` : undefined }}
                >
                  <img src={team.logo} alt={team.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                </div>
                <div className="text-right">
                  <div className="text-[7px] text-slate-600 font-bold uppercase tracking-widest italic">{team.division}</div>
                  <div className="text-[7px] text-slate-500 font-mono italic opacity-50">{team.record}</div>
                </div>
              </div>

              <div>
                <h3 className="text-slate-600 text-[7px] font-bold uppercase tracking-widest mono-font">{team.city}</h3>
                <h2 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors header-font italic tracking-tighter uppercase truncate leading-tight">{team.name}</h2>
              </div>

              <div className="grid grid-cols-3 gap-1 mt-1 border-t border-[#1a222e]/50 pt-2">
                <div className="text-center">
                  <div className="text-[7px] text-slate-600 font-bold">OFF</div>
                  <div className="text-[10px] font-mono font-bold text-white tracking-tighter">{team.stats.off}</div>
                </div>
                <div className="text-center border-x border-[#1a222e]/50">
                  <div className="text-[7px] text-slate-600 font-bold">DEF</div>
                  <div className="text-[10px] font-mono font-bold text-white tracking-tighter">{team.stats.def}</div>
                </div>
                <div className="text-center">
                  <div className="text-[7px] text-slate-600 font-bold">ST</div>
                  <div className="text-[10px] font-mono font-bold text-white tracking-tighter">{team.stats.st}</div>
                </div>
              </div>
              
              {/* Hover highlight bar */}
              <div 
                className="absolute bottom-0 left-0 w-0 h-[1px] bg-cyan-500 group-hover:w-full transition-all duration-500 shadow-[0_0_8px_rgba(0,209,255,1)]"
                style={{ backgroundColor: team.primaryColor || '#06b6d4', boxShadow: team.primaryColor ? `0 0 8px ${team.primaryColor}` : undefined }}
              ></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSelection;
