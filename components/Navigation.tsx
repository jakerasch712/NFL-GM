import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Play, Briefcase, ShoppingBag, ArrowLeftRight, Shield, Zap, Microscope, LogOut, Award } from 'lucide-react';
import { AppView, Player } from '../types';
import { TEAMS_DB } from '../constants';
import { getTeamCapSpace } from '../services/financeService';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  selectedTeamId: string;
  teams: Record<string, any>;
  allPlayers: Player[];
  salaryCap: number;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, selectedTeamId, teams, allPlayers, salaryCap }) => {
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];
  const capSpace = getTeamCapSpace(allPlayers.filter(p => p.teamId === selectedTeamId), salaryCap);
  const navItems = [
    { id: AppView.DASHBOARD, label: 'HQ Dashboard', icon: LayoutDashboard },
    { id: AppView.ROSTER, label: 'Roster & Depth', icon: Users },
    { id: AppView.FREE_AGENCY, label: 'Free Agency', icon: ShoppingBag },
    { id: AppView.TRADE_CENTER, label: 'Trade Center', icon: ArrowLeftRight },
    { id: AppView.GAMEPLAN, label: 'Gameplan', icon: ClipboardList },
    { id: AppView.MATCH, label: 'Match Sim', icon: Play },
    { id: AppView.DRAFT, label: 'War Room', icon: Shield },
    { id: AppView.STAFF, label: 'Staff', icon: Zap },
    { id: AppView.SCOUTING, label: 'Scouting', icon: Microscope },
    { id: AppView.HALL_OF_FAME, label: 'Hall of Fame', icon: Award },
  ];

  return (
    <div className="w-64 bg-[#0a0e14] border-r border-[#1a222e] flex flex-col h-full shrink-0 z-20">
      <div className="p-6 border-b border-[#1a222e] flex items-center gap-3 bg-[#0d121a]/50">
        <div className="w-12 h-12 bg-[#05070a] border border-[#1a222e] flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
        </div>
        <div>
            <h1 className="text-xl font-bold text-white tracking-widest header-font uppercase leading-tight italic">{team.name}</h1>
            <span className="text-[10px] text-cyan-500 font-mono tracking-[0.2em] uppercase">{team.city}</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-sm transition-all duration-300 group border ${
              currentView === item.id 
                ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/40 shadow-[inset_0_0_10px_rgba(0,209,255,0.05)]' 
                : 'text-slate-500 border-transparent hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <item.icon size={18} className={currentView === item.id ? "text-cyan-400" : "text-slate-600 group-hover:text-cyan-400 transition-colors"} />
            <span className={`text-[11px] uppercase tracking-[0.1em] font-bold ${currentView === item.id ? 'mono-font' : ''}`}>{item.label}</span>
            {currentView === item.id && (
                <div className="ml-auto w-1 h-3 bg-cyan-400 shadow-[0_0_10px_rgba(0,209,255,1)] animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 border-t border-[#1a222e] bg-[#0d121a]/50">
        <div className="flex justify-between text-[10px] mono-font text-slate-500">
            <span className="tracking-widest">CAP_SPACE</span>
            <span className={capSpace < 0 ? 'text-red-500' : 'text-white'}>${capSpace.toFixed(1)}M</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-red-500 transition-all border border-[#1a222e] rounded-sm hover:bg-red-500/5 hover:border-red-500/30"
        >
          <LogOut size={12} />
          TERMINATE_SESSION
        </button>
      </div>
    </div>
  );
};

export default Navigation;