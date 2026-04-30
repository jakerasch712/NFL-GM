import React, { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Activity, Trophy, ChevronDown, MapPin, UserCheck, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { LeaguePhase } from '../types';
import { SCHEDULE_2027 } from '../schedule';

// Helper to get next opponent and standings
// Moved inside component to use dynamic teams

interface DashboardProps {
  selectedTeamId: string;
  leaguePhase: LeaguePhase;
  currentWeek: number;
  teams: Record<string, any>;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedTeamId, leaguePhase, currentWeek, teams }) => {
  const getTeamData = (teamId: string, currentWeek: number) => {
    const team = teams[teamId] || TEAMS_DB[teamId];
    const divisionTeams = Object.values(teams).filter((t: any) => t.division === team.division);
    
    // Find next match
    const nextMatch = SCHEDULE_2027.find(m => 
      m.week >= currentWeek && (m.homeTeamId === teamId || m.awayTeamId === teamId)
    );

    let nextOpp: any = { name: 'BYE WEEK', code: 'BYE', record: '-', threat: 'NONE', winProb: 0, location: '-', date: '-', logo: '' };
    
    if (nextMatch) {
      const oppId = nextMatch.homeTeamId === teamId ? nextMatch.awayTeamId : nextMatch.homeTeamId;
      const opp = teams[oppId] || TEAMS_DB[oppId];
      nextOpp = {
        name: `${opp.city} ${opp.name}`,
        code: opp.id,
        record: opp.record,
        threat: opp.stats.off > 85 ? 'EXTREME' : opp.stats.off > 78 ? 'HIGH' : 'MEDIUM',
        winProb: Math.round(50 + (team.stats.off - opp.stats.def) / 2),
        location: nextMatch.homeTeamId === teamId ? 'Home' : 'Away',
        date: 'Sunday',
        logo: opp.logo
      };
    }
    
    return {
      ...team,
      nextOpp,
      standings: divisionTeams.map((t: any) => ({
        team: t.id,
        w: parseInt(t.record.split('-')[0]),
        l: parseInt(t.record.split('-')[1]),
        diff: '+0'
      })).sort((a, b) => b.w - a.w)
    };
  };

  const team = getTeamData(selectedTeamId, currentWeek);
  
  const getAdvisorTip = () => {
    switch(leaguePhase) {
      case LeaguePhase.REGULAR_SEASON:
        return {
          title: "In-Season Management",
          text: "Focus on fatigue management. Your starters are at 85% fresh. Consider resting them in practice.",
          icon: <Activity className="text-emerald-400" size={18} />
        };
      case LeaguePhase.OFFSEASON_FA:
        return {
          title: "Financial Strategy",
          text: "Wait for the second wave of FA. Prices drop by 40% after the first 48 hours for mid-tier players.",
          icon: <TrendingUp className="text-cyan-400" size={18} />
        };
      case LeaguePhase.OFFSEASON_DRAFT:
        return {
          title: "Draft Strategy",
          text: "The QB class is shallow. If you need one, trade up to the top 10 now while costs are stable.",
          icon: <Trophy className="text-amber-400" size={18} />
        };
      default:
        return {
          title: "Team Advisory",
          text: "Keep an eye on locker room chemistry. High morale increases attribute boosts by up to +3 OVR.",
          icon: <UserCheck className="text-purple-400" size={18} />
        };
    }
  };

  const advisor = getAdvisorTip();

  const teamStats = [
    { name: 'OFF', val: team.stats.off, color: '#22d3ee' },
    { name: 'DEF', val: team.stats.def, color: '#34d399' },
    { name: 'ST', val: team.stats.st, color: '#a78bfa' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-10 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 header-font tracking-tighter uppercase italic">SYSTEM_OVERVIEW</h2>
          <p className="text-cyan-500 flex items-center gap-2 text-[10px] mono-font uppercase tracking-[0.3em]">
            <Calendar size={14} className="text-cyan-500 animate-pulse" /> PHASE::{leaguePhase.replace('_', '_')}
          </p>
        </div>
        <div className="flex items-center gap-10">
            <div className="text-right border-l border-[#1a222e] pl-10">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">REGISTRY_RECORD</div>
                <div className="text-3xl font-bold font-mono text-white tracking-widest">{team.record}</div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-1">
        {/* Next Opponent Card */}
        <div className="col-span-12 lg:col-span-8 bg-[#0a0e14] border border-[#1a222e] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity size={180} />
            </div>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>

            <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 bg-[#05070a] border border-[#1a222e] flex items-center justify-center shadow-2xl relative overflow-hidden">
                        {team.nextOpp.logo ? (
                            <img src={team.nextOpp.logo} alt={team.nextOpp.name} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                        ) : (
                            <Activity size={32} className="text-slate-700" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent"></div>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-cyan-500 tracking-[0.4em] uppercase mb-2 block">TERMINAL::UPCOMING_ENGAGEMENT</span>
                        <h3 className="text-5xl font-bold text-white header-font mb-2 tracking-tighter">{team.nextOpp.name}</h3>
                        <div className="text-slate-500 font-mono text-xs flex items-center gap-3 tracking-widest uppercase">
                            <MapPin size={14} className="text-cyan-500" /> {team.nextOpp.location} // {team.nextOpp.date}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-6xl font-bold text-[#1a222e] header-font tracking-tighter opacity-50">{team.nextOpp.code}</div>
                    <div className="text-[10px] text-cyan-500 font-mono mt-2 tracking-widest font-bold bg-cyan-500/5 px-2 py-0.5 border border-cyan-500/20">{team.nextOpp.record} LOG</div>
                </div>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-1 relative z-10">
                <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-red-500/30 transition-colors">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">THREAT_VECTOR</div>
                    <div className={`text-xl font-bold font-mono tracking-widest ${team.nextOpp.threat === 'EXTREME' ? 'text-red-500' : team.nextOpp.threat === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {team.nextOpp.threat}
                    </div>
                </div>
                <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-cyan-500/30 transition-colors">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">WIN_PROBABILITY</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono tracking-widest">{team.nextOpp.winProb}%</div>
                </div>
                <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-emerald-500/30 transition-colors">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">HEALTH_STATUS</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono tracking-widest">94%</div>
                </div>
            </div>
        </div>

        {/* Team OVR Chart */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] p-8 flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mono-font italic">UNIT_MATRIX</h3>
                <TrendingUp size={16} className="text-cyan-500 animate-pulse" />
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <BarChart data={teamStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#05070a', borderColor: '#1a222e', color: '#fff', borderRadius: '0px'}} 
                            cursor={{fill: 'rgba(0,209,255,0.05)'}}
                        />
                        <Bar dataKey="val" radius={[0, 0, 0, 0]}>
                            {teamStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#00d1ff' : index === 1 ? '#10b981' : '#f59e0b'} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Standings */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] overflow-hidden mt-6">
            <div className="p-4 border-b border-[#1a222e] bg-[#0d121a]/50 flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-white mono-font uppercase tracking-widest italic">{team.division} :: RANKINGS</h3>
                <Trophy size={14} className="text-cyan-500" />
            </div>
            <table className="w-full text-[11px] font-mono">
                <thead>
                    <tr className="text-left text-slate-600 border-b border-[#1a222e]">
                        <th className="px-6 py-4 font-bold tracking-widest uppercase">NODE</th>
                        <th className="px-4 py-4 font-bold text-center">W</th>
                        <th className="px-4 py-4 font-bold text-center">L</th>
                        <th className="px-6 py-4 font-bold text-right">DF</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#1a222e]/30">
                    {team.standings.map((row: any, i: number) => {
                        const standingTeam = TEAMS_DB[row.team];
                        return (
                            <tr key={row.team} className={`hover:bg-cyan-500/5 transition-colors ${row.team === team.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : ''}`}>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="w-6 h-6 flex-shrink-0 bg-[#05070a] border border-[#1a222e] p-0.5">
                                        <img src={standingTeam.logo} alt={standingTeam.id} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className={`font-bold tracking-tight ${row.team === team.id ? 'text-cyan-400' : 'text-slate-200'}`}>{row.team}</span>
                                </td>
                                <td className="px-4 py-4 text-center text-slate-400">{row.w}</td>
                                <td className="px-4 py-4 text-center text-slate-400">{row.l}</td>
                                <td className={`px-6 py-4 text-right font-mono ${row.diff.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{row.diff}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* Action Items */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-1 mt-6">
            <div className="bg-[#0a0e14] border border-[#1a222e] p-8">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 mono-font italic">
                    <HelpCircle size={16} className="text-cyan-400 animate-bounce" />
                    AGM_ADVISORY
                </h3>
                <div className="bg-[#05070a] p-6 border border-[#1a222e] flex gap-6 items-start">
                    <div className="mt-1 p-2 bg-cyan-500/10 rounded-sm border border-cyan-500/20">{advisor.icon}</div>
                    <div>
                        <div className="text-white font-bold text-sm mb-2 uppercase tracking-wide italic">{advisor.title}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed font-mono opacity-80">{advisor.text}</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-8">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 mono-font italic">
                    <AlertCircle size={18} className="text-amber-500 animate-pulse" />
                    PRIORITY_PROTOCOLS
                </h3>
                <div className="space-y-1">
                    <div className="flex items-center justify-between bg-[#05070a] p-4 border border-[#1a222e] hover:border-cyan-500/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-4 bg-amber-500 group-hover:bg-cyan-400 transition-colors"></div>
                            <div>
                                <div className="text-white font-bold text-[10px] mono-font group-hover:text-cyan-400 transition-colors uppercase tracking-widest">CONTRACT::TUNSIL_L</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-tighter">DEADLINE_EXPIRY_THRESHOLD</div>
                            </div>
                        </div>
                        <button className="text-[9px] bg-[#0d121a] hover:bg-cyan-500 hover:text-black text-slate-400 px-3 py-1 font-bold border border-[#1a222e] transition-all">RESOLVE</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;