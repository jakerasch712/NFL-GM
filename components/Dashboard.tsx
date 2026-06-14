import React, { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Activity, Trophy, ChevronDown, MapPin, UserCheck, HelpCircle, Newspaper } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { LeaguePhase, Player, Position } from '../types';
import { SCHEDULE_2027 } from '../schedule';

interface DashboardProps {
  selectedTeamId: string;
  leaguePhase: LeaguePhase;
  currentWeek: number;
  teams: Record<string, any>;
  allPlayers: Player[];
}

const Dashboard: React.FC<DashboardProps> = ({ selectedTeamId, leaguePhase, currentWeek, teams, allPlayers }) => {
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
    { name: 'OFF', val: team.stats.off, color: '#00d1ff' },
    { name: 'DEF', val: team.stats.def, color: '#10b981' },
    { name: 'ST', val: team.stats.st, color: '#f59e0b' },
  ];

  // Calculate Cap Hit by Position Group Dynamically
  const roster = allPlayers.filter(p => p.teamId === selectedTeamId);
  const capDistribution = [
    { name: 'QB', val: 0, color: '#f43f5e' },
    { name: 'RB', val: 0, color: '#10b981' },
    { name: 'WR', val: 0, color: '#00d1ff' },
    { name: 'TE', val: 0, color: '#8b5cf6' },
    { name: 'OL', val: 0, color: '#f59e0b' },
    { name: 'DL', val: 0, color: '#ec4899' },
    { name: 'LB', val: 0, color: '#6366f1' },
    { name: 'DB', val: 0, color: '#14b8a6' },
    { name: 'K/ST', val: 0, color: '#f97316' },
  ];

  roster.forEach(p => {
    let group = 'K/ST';
    if (p.position === 'QB') group = 'QB';
    else if (p.position === 'RB') group = 'RB';
    else if (p.position === 'WR') group = 'WR';
    else if (p.position === 'TE') group = 'TE';
    else if (p.position === 'OL') group = 'OL';
    else if (p.position === 'DL') group = 'DL';
    else if (p.position === 'LB') group = 'LB';
    else if (p.position === 'CB' || p.position === 'S') group = 'DB';
    else if (p.position === 'K') group = 'K/ST';
    
    const capHit = p.contract?.capHit || p.contract?.salary || 0;
    const gIndex = capDistribution.findIndex(item => item.name === group);
    if (gIndex !== -1) {
      capDistribution[gIndex].val += capHit;
    }
  });

  capDistribution.forEach(item => {
    item.val = parseFloat(item.val.toFixed(1));
  });

  // Pseudo-random headlines generator (stable for current week & team)
  const getLeagueNews = () => {
    const seedHash = (currentWeek * 17) + selectedTeamId.charCodeAt(0) + (selectedTeamId.charCodeAt(1) || 0);
    const headlinesList = [];
    const allTeamIds = Object.keys(teams);
    const otherTeamIds = allTeamIds.filter(id => id !== selectedTeamId);

    const getSubTeam = (offset: number) => {
      const idx = (seedHash + offset) % otherTeamIds.length;
      const tid = otherTeamIds[idx];
      return teams[tid] || TEAMS_DB[tid] || { city: 'League', name: 'Rivals' };
    };

    const getSubPlayer = (offset: number): Player => {
      const pool = allPlayers.filter(p => p.teamId !== 'FA');
      if (pool.length === 0) {
        return { 
          id: 'mock-player', 
          name: 'Active Player', 
          position: Position.QB, 
          age: 26, 
          overall: 80, 
          schemeOvr: 80, 
          morale: 80, 
          fatigue: 100, 
          archetype: 'Standard', 
          personality: 'Normal', 
          scheme: 'Balanced', 
          developmentTrait: 'Normal', 
          potential: 'Normal', 
          stats: { gamesPlayed: 0 }, 
          contract: { years: 1, salary: 1, bonus: 0, guaranteed: 0, yearsLeft: 1, totalValue: 1, capHit: 1, deadCap: 0, voidYears: 0, startYear: 2026, totalLength: 1 }, 
          teamId: 'KC' 
        };
      }
      const pIdx = (seedHash * offset + 7) % pool.length;
      return pool[pIdx];
    };

    // Headline 1: Game Results
    const teamA = getSubTeam(1);
    const teamB = getSubTeam(2);
    const gameResults = [
      {
        headline: `${teamA.city} ${teamA.name} outlasts divisional rival in a dramatic double-overtime tactical classic.`,
        tag: 'GAME RECAP',
        time: '1h ago',
        color: 'border-l-cyan-500'
      },
      {
        headline: `Mahomes puts on another masterclass quarterback performance; coordinators call it "absolutely unstoppable".`,
        tag: 'LEAGUE EXTRA',
        time: '2h ago',
        color: 'border-l-[#10b981]'
      },
      {
        headline: `${teamB.city} ${teamB.name} defensive secondary coordinator faces questions regarding scheme matchups after consecutive deep breakdowns.`,
        tag: 'STAFF INSIDER',
        time: '4h ago',
        color: 'border-l-red-500'
      }
    ];
    headlinesList.push(gameResults[seedHash % gameResults.length]);

    // Headline 2: Player Injuries
    const injuredPlayer = getSubPlayer(5);
    const injuryTeam = teams[injuredPlayer.teamId] || TEAMS_DB[injuredPlayer.teamId] || { name: 'Rivals' };
    const injuries = [
      {
        headline: `ALERT: ${injuredPlayer.name} seeking secondary opinions on calf strain; ${injuryTeam.name} staff hopes to avoid IR.`,
        tag: 'INJURY ALERT',
        time: '15m ago',
        color: 'border-l-orange-500'
      },
      {
        headline: `Tactical blow: ${injuredPlayer.name} expected to sit out next cycle following foot injury in active practice drills.`,
        tag: 'INJURY REPORT',
        time: '30m ago',
        color: 'border-l-red-500'
      },
      {
        headline: `Favorable feedback: ${injuredPlayer.name} upgraded to full operational capacity for matchday prep.`,
        tag: 'ROSTER OKAY',
        time: '3h ago',
        color: 'border-l-[#10b981]'
      }
    ];
    headlinesList.push(injuries[(seedHash + 3) % injuries.length]);

    // Headline 3: Coaching/Staff Changes
    const coachTeam = getSubTeam(4);
    const coachingHeadlines = [
      {
        headline: `Locker rumors: Front office of ${coachTeam.city} ${coachTeam.name} expresses frustration with active roster performance.`,
        tag: 'COACH CHAT',
        time: '5h ago',
        color: 'border-l-amber-500'
      },
      {
        headline: `Strategic Shift: ${coachTeam.name} coaching staff tells media: "We are adjusting key formation packages starting immediately."`,
        tag: 'HQ PROTOCOL',
        time: '8h ago',
        color: 'border-l-cyan-500'
      },
      {
        headline: `Contract talks hit block: Multiple offensive assistants in wide demand across collegiate organizations.`,
        tag: 'STAFF RETENTION',
        time: '12h ago',
        color: 'border-l-indigo-500'
      }
    ];
    headlinesList.push(coachingHeadlines[(seedHash + 7) % coachingHeadlines.length]);

    return headlinesList;
  };

  const headlines = getLeagueNews();

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-10 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 header-font tracking-tighter uppercase italic">HQ_DASHBOARD</h2>
          <p className="text-cyan-500 flex items-center gap-2 text-[10px] mono-font uppercase tracking-[0.3em] font-bold">
            <Calendar size={14} className="text-cyan-500 animate-pulse" /> PHASE::{leaguePhase.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right border-l border-[#1a222e] pl-10">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">REGISTRY_RECORD</div>
            <div className="text-3xl font-bold font-mono text-white tracking-widest">{team.record}</div>
          </div>
        </div>
      </header>

      {/* Row 1: Upcoming Match & Unit Matrix */}
      <div className="grid grid-cols-12 gap-1 mb-6">
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
                <span className="text-[10px] font-bold text-cyan-500 tracking-[0.4em] uppercase mb-2 block font-mono">TERMINAL::UPCOMING_ENGAGEMENT</span>
                <h3 className="text-5xl font-bold text-white header-font mb-2 tracking-tighter">{team.nextOpp.name}</h3>
                <div className="text-slate-500 font-mono text-xs flex items-center gap-3 tracking-widest uppercase font-bold">
                  <MapPin size={14} className="text-cyan-500" /> {team.nextOpp.location} // {team.nextOpp.date}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold text-[#1a222e] header-font tracking-tighter opacity-50 font-mono italic">{team.nextOpp.code}</div>
              <div className="text-[10px] text-cyan-500 font-mono mt-2 tracking-widest font-bold bg-cyan-500/5 px-2 py-0.5 border border-cyan-500/20">{team.nextOpp.record} LOG</div>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-1 relative z-10">
            <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-red-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold font-mono">THREAT_VECTOR</div>
              <div className={`text-xl font-bold font-mono tracking-widest ${team.nextOpp.threat === 'EXTREME' ? 'text-red-500' : team.nextOpp.threat === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {team.nextOpp.threat}
              </div>
            </div>
            <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-cyan-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold font-mono">WIN_PROBABILITY</div>
              <div className="text-xl font-bold text-cyan-400 font-mono tracking-widest">{team.nextOpp.winProb}%</div>
            </div>
            <div className="bg-[#05070a] p-6 border border-[#1a222e] group-hover:border-emerald-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold font-mono">ROSTER_INTEGRITY</div>
              <div className="text-xl font-bold text-emerald-400 font-mono tracking-widest">94%</div>
            </div>
          </div>
        </div>

        {/* Team OVR Chart */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] p-8 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-mono italic">UNIT_MATRIX</h3>
            <TrendingUp size={16} className="text-cyan-500 animate-pulse" />
          </div>
          <div className="flex-1 w-full flex items-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={teamStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#05070a', borderColor: '#1a222e', color: '#fff', borderRadius: '0px', fontFamily: 'JetBrains Mono', fontSize: '10px'}} 
                  cursor={{fill: 'rgba(0,209,255,0.05)'}}
                />
                <Bar dataKey="val" radius={[0, 0, 0, 0]}>
                  {teamStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.80} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Standings, Salary Cap Distribution, and League News (3-Column Bento Map) */}
      <div className="grid grid-cols-12 gap-1 mb-6">
        {/* Division Standings */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-4 border-b border-[#1a222e] bg-[#0d121a]/50 flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-white font-mono uppercase tracking-widest italic">{team.division} :: STANDINGS</h3>
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
                {team.standings.map((row: any) => {
                  const standingTeam = TEAMS_DB[row.team] || { logo: '', id: row.team };
                  return (
                    <tr key={row.team} className={`hover:bg-cyan-500/5 transition-colors ${row.team === team.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : ''}`}>
                      <td className="px-6 py-3 flex items-center gap-3">
                        <div className="w-6 h-6 flex-shrink-0 bg-[#05070a] border border-[#1a222e] p-0.5">
                          <img src={standingTeam.logo} alt={standingTeam.id} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className={`font-bold tracking-tight ${row.team === team.id ? 'text-cyan-400' : 'text-slate-200'}`}>{row.team}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">{row.w}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{row.l}</td>
                      <td className={`px-6 py-3 text-right font-mono text-[10px] ${row.diff.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{row.diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salary Cap Distribution (Recharts) */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-[#1a222e] flex justify-between items-center bg-[#0d121a]/50 -mx-6 -mt-6 p-4">
            <h3 className="text-[10px] font-bold text-white font-mono uppercase tracking-widest italic">SALARY_CAP_BY_GROUP ($M)</h3>
            <TrendingUp size={14} className="text-[#10b981]" />
          </div>
          <div className="flex-1 w-full flex items-center mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={capDistribution} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <XAxis type="number" tick={{fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 9, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} width={45} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#05070a', borderColor: '#1a222e', color: '#fff', borderRadius: '0px', fontFamily: 'JetBrains Mono', fontSize: '9px'}} 
                  cursor={{fill: 'rgba(0,209,255,0.02)'}}
                  formatter={(value: any) => [`$${value}M`, 'Cap Hit']}
                />
                <Bar dataKey="val" radius={[0, 2, 2, 0]}>
                  {capDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* League News & Headlines Widget */}
        <div className="col-span-12 lg:col-span-4 bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-[#1a222e] flex justify-between items-center bg-[#0d121a]/50 -mx-6 -mt-6 p-4">
            <h3 className="text-[10px] font-bold text-white font-mono uppercase tracking-widest italic flex items-center gap-2">
              <Newspaper size={14} className="text-cyan-500 animate-pulse" />
              LEAGUE_BULLETINS
            </h3>
            <span className="text-[8px] font-mono bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 font-bold">LIVE_FEED</span>
          </div>
          <div className="flex-1 space-y-4 py-4 overflow-y-auto">
            {headlines.map((item, idx) => (
              <div key={idx} className={`p-3 border-l-2 ${item.color} bg-[#05070a]/60 hover:bg-[#0d121a]/50 transition-colors`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold font-mono tracking-wider opacity-90">{item.tag}</span>
                  <span className="text-[8px] font-mono text-slate-500">{item.time}</span>
                </div>
                <p className="text-[10.5px] font-mono text-slate-300 leading-relaxed uppercase tracking-tight">{item.headline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Advisor & Priority Protocols */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-1">
          {/* Advisor Widget */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-8">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 font-mono italic">
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

          {/* Priority Protocols Widget */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-8">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 font-mono italic">
              <AlertCircle size={18} className="text-amber-500 animate-pulse" />
              PRIORITY_PROTOCOLS
            </h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between bg-[#05070a] p-4 border border-[#1a222e] hover:border-cyan-500/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-4 bg-amber-500 group-hover:bg-cyan-400 transition-colors"></div>
                  <div>
                    <div className="text-white font-bold text-[10px] font-mono group-hover:text-cyan-400 transition-colors uppercase tracking-widest">CONTRACT::TUNSIL_L</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tighter font-mono">DEADLINE_EXPIRY_THRESHOLD</div>
                  </div>
                </div>
                <button className="text-[9px] bg-[#0d121a] hover:bg-cyan-500 hover:text-black text-slate-400 px-3 py-1 font-bold border border-[#1a222e] transition-all font-mono">RESOLVE</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
