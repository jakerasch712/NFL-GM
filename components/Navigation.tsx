import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Play, Briefcase, ShoppingBag, ArrowLeftRight, Shield, Zap, Microscope, LogOut } from 'lucide-react';
import { AppView } from '../types';
import { TEAMS_DB } from '../constants';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  selectedTeamId: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, selectedTeamId }) => {
  const team = TEAMS_DB[selectedTeamId];
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
  ];

  return (
    <div className="w-64 bg-[#0a0e14] border-r border-[#1a222e] flex flex-col h-full shrink-0 z-20">
      <div className="p-6 border-b border-[#1a222e] flex items-center gap-3 bg-[#0d121a]/50">
        <div className="w-10 h-10 bg-cyan-500 rounded-sm flex items-center justify-center font-bold text-slate-900 shadow-[0_0_15px_rgba(0,209,255,0.3)]">
          {selectedTeamId.substring(0, 2)}
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
        <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Stability</span>
            <span className="text-[10px] text-emerald-400 font-mono">88% v2.6</span>
        </div>
        <div className="w-full bg-[#05070a] h-1 rounded-full overflow-hidden border border-[#1a222e]">
            <div className="bg-emerald-500 h-full w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
        <div className="mt-4 flex justify-between text-[10px] mono-font text-slate-500">
            <span className="tracking-widest">CAP_REFLOW</span>
            <span className="text-white">$14.2M</span>
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