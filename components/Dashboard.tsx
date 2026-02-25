import React, { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Activity, Trophy, ChevronDown, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS_DB } from '../constants';

// Helper to get next opponent and standings (mocked for brevity in this step)
const getTeamData = (teamId: string) => {
  const team = TEAMS_DB[teamId];
  const divisionTeams = Object.values(TEAMS_DB).filter((t: any) => t.division === team.division);
  
  return {
    ...team,
    nextOpp: { name: 'OPPONENT', code: 'OPP', record: '0-0', threat: 'MEDIUM', winProb: 50.0, location: 'Stadium', date: 'Sunday' },
    standings: divisionTeams.map((t: any) => ({
      team: t.id,
      w: parseInt(t.record.split('-')[0]),
      l: parseInt(t.record.split('-')[1]),
      diff: '+0'
    })).sort((a, b) => b.w - a.w)
  };
};

const Dashboard: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState('HOU');
  const team = getTeamData(selectedTeamId);

  const teamStats = [
    { name: 'OFF', val: team.stats.off, color: '#22d3ee' },
    { name: 'DEF', val: team.stats.def, color: '#34d399' },
    { name: 'ST', val: team.stats.st, color: '#a78bfa' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font">WAR ROOM DASHBOARD</h2>
          <p className="text-slate-400 flex items-center gap-2 text-sm">
            <Calendar size={14} /> Week 7 - Regular Season
          </p>
        </div>
        <div className="flex items-center gap-6">
            <div className="relative group">
                <select 
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="appearance-none bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white pl-4 pr-10 py-2 rounded-lg font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all shadow-lg"
                >
                    {Object.values(TEAMS_DB).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.city} {t.name}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-cyan-500 transition-colors" />
            </div>

            <div className="text-right border-l border-slate-700 pl-6">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Record</div>
                <div className="text-2xl font-bold font-mono text-white">{team.record}</div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Next Opponent Card */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={120} />
            </div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <span className="text-xs font-bold text-cyan-500 tracking-wider uppercase mb-2 block">Next Matchup</span>
                    <h3 className="text-4xl font-bold text-white header-font mb-1">{team.nextOpp.name}</h3>
                    <div className="text-slate-400 font-mono text-sm flex items-center gap-2">
                        <MapPin size={14} /> {team.nextOpp.location} • {team.nextOpp.date}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-bold text-slate-700 header-font">{team.nextOpp.code}</div>
                    <div className="text-sm text-slate-500 font-mono mt-1">{team.nextOpp.record} Record</div>
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
                <div className="bg-slate-950/50 p-4 rounded border-l-2 border-red-500">
                    <div className="text-xs text-slate-500 uppercase mb-1">Threat Level</div>
                    <div className={`text-lg font-bold ${team.nextOpp.threat === 'EXTREME' ? 'text-red-500' : team.nextOpp.threat === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {team.nextOpp.threat}
                    </div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded border-l-2 border-cyan-500">
                    <div className="text-xs text-slate-500 uppercase mb-1">Win Prob</div>
                    <div className="text-lg font-bold text-cyan-400">{team.nextOpp.winProb}%</div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded border-l-2 border-emerald-500">
                    <div className="text-xs text-slate-500 uppercase mb-1">Health</div>
                    <div className="text-lg font-bold text-emerald-400">94%</div>
                </div>
            </div>
        </div>

        {/* Team OVR Chart */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white header-font">UNIT GRADES</h3>
                <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamStats}>
                        <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                            {teamStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Standings */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white header-font uppercase">{team.division}</h3>
                <Trophy size={14} className="text-yellow-500" />
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800/50">
                        <th className="px-4 py-2 font-normal">Team</th>
                        <th className="px-4 py-2 font-normal text-center">W</th>
                        <th className="px-4 py-2 font-normal text-center">L</th>
                        <th className="px-4 py-2 font-normal text-right">Diff</th>
                    </tr>
                </thead>
                <tbody>
                    {team.standings.map((row: any, i: number) => (
                        <tr key={row.team} className={`border-b border-slate-800/50 ${row.team === team.id ? 'bg-cyan-900/10 border-l-2 border-l-cyan-500' : ''}`}>
                            <td className={`px-4 py-3 font-bold ${row.team === team.id ? 'text-cyan-400' : 'text-white'}`}>{row.team}</td>
                            <td className="px-4 py-3 text-center text-slate-300">{row.w}</td>
                            <td className="px-4 py-3 text-center text-slate-300">{row.l}</td>
                            <td className={`px-4 py-3 text-right font-mono ${row.diff.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{row.diff}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Action Items */}
        <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white header-font mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                CRITICAL ACTIONS
            </h3>
            <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div>
                            <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">Contract Negotiation: L. Tunsil</div>
                            <div className="text-xs text-slate-500">Agent is requesting a final offer before testing Free Agency.</div>
                        </div>
                    </div>
                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors">Manage</button>
                </div>
                
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                        <div>
                            <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">Scouting Update: SEC West</div>
                            <div className="text-xs text-slate-500">Scout J. Doe has completed deep dive on 3 prospects.</div>
                        </div>
                    </div>
                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors">View</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;