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
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 z-20">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-cyan-500/20">
          {selectedTeamId.substring(0, 2)}
        </div>
        <div>
            <h1 className="text-lg font-bold text-white tracking-tight header-font uppercase leading-tight">{team.name}</h1>
            <span className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">{team.city}</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 space-y-2 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} className={currentView === item.id ? "text-cyan-400" : "text-slate-500 group-hover:text-white"} />
            <span className="font-medium text-sm tracking-wide">{item.label}</span>
            {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/50">
        <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-slate-500 uppercase font-bold">Trust</span>
            <span className="text-xs text-emerald-400 font-mono">88%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
        <div className="mt-4 flex justify-between text-xs font-mono text-slate-400">
            <span>CAP SPACE</span>
            <span className="text-white">$14.2M</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors border border-slate-800 rounded-lg hover:border-red-500/30"
        >
          <LogOut size={12} />
          Resign Position
        </button>
      </div>
    </div>
  );
};

export default Navigation;