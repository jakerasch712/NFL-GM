import React, { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Activity, Trophy, ChevronDown, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS_DB } from '../constants';
import { Player, ScheduleGame, AppView } from '../types';

interface DashboardProps {
  players: Player[];
  week: number;
  capSpace: number;
  schedule: ScheduleGame[];
  onNavigate: (view: AppView) => void;
}

const calcWinProb = (myTeam: any, oppTeam: any): number => {
  const myRating = (myTeam.stats.off + myTeam.stats.def + myTeam.stats.st) / 3;
  const oppRating = (oppTeam.stats.off + oppTeam.stats.def + oppTeam.stats.st) / 3;
  return Math.min(99, Math.max(1, Math.round(50 + (myRating - oppRating) * 1.8)));
};

const getThreatLevel = (oppTeam: any): string => {
  const oppRating = (oppTeam.stats.off + oppTeam.stats.def) / 2;
  if (oppRating >= 90) return 'EXTREME';
  if (oppRating >= 84) return 'HIGH';
  if (oppRating >= 78) return 'MEDIUM';
  return 'LOW';
};

const getTeamData = (teamId: string, week: number, schedule: ScheduleGame[]) => {
  const team = TEAMS_DB[teamId];
  const divisionTeams = Object.values(TEAMS_DB).filter((t: any) => t.division === team.division);

  const nextGame = schedule.find(g => g.week === week && !g.result);
  const nextOpp = nextGame ? TEAMS_DB[nextGame.opponentId] : null;

  return {
    ...team,
    nextOpp: nextOpp
      ? {
          name: `${nextOpp.city} ${nextOpp.name}`,
          code: nextOpp.id,
          record: nextOpp.record,
          threat: getThreatLevel(nextOpp),
          winProb: calcWinProb(team, nextOpp),
          location: nextGame?.location === 'HOME' ? 'NRG Stadium, Houston' : nextOpp.city,
          date: 'Sunday',
        }
      : { name: 'SEASON COMPLETE', code: '---', record: '---', threat: 'LOW', winProb: 50, location: 'TBD', date: 'TBD' },
    standings: divisionTeams
      .map((t: any) => ({
        team: t.id,
        w: parseInt(t.record.split('-')[0]),
        l: parseInt(t.record.split('-')[1]),
      }))
      .sort((a, b) => b.w - a.w),
  };
};

const Dashboard: React.FC<DashboardProps> = ({ players, week, capSpace, schedule, onNavigate }) => {
  const [selectedTeamId, setSelectedTeamId] = useState('HOU');
  const team = getTeamData(selectedTeamId, week, schedule);

  const teamStats = [
    { name: 'OFF', val: team.stats.off, color: '#22d3ee' },
    { name: 'DEF', val: team.stats.def, color: '#34d399' },
    { name: 'ST', val: team.stats.st, color: '#a78bfa' },
  ];

  const expiringPlayers = players.filter(p => p.contract.yearsLeft === 0);
  const threatColor =
    team.nextOpp.threat === 'EXTREME' ? 'text-red-500' :
    team.nextOpp.threat === 'HIGH' ? 'text-amber-500' :
    'text-emerald-500';

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font">WAR ROOM DASHBOARD</h2>
          <p className="text-slate-400 flex items-center gap-2 text-sm">
            <Calendar size={14} /> Week {week} — Regular Season
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
              <span className="text-xs font-bold text-cyan-500 tracking-wider uppercase mb-2 block">
                Week {week} Matchup
              </span>
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
              <div className={`text-lg font-bold ${threatColor}`}>{team.nextOpp.threat}</div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded border-l-2 border-cyan-500">
              <div className="text-xs text-slate-500 uppercase mb-1">Win Prob</div>
              <div className="text-lg font-bold text-cyan-400">{team.nextOpp.winProb}%</div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded border-l-2 border-emerald-500">
              <div className="text-xs text-slate-500 uppercase mb-1">Cap Space</div>
              <div className={`text-lg font-bold ${capSpace < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                ${capSpace.toFixed(1)}M
              </div>
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
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
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
              </tr>
            </thead>
            <tbody>
              {team.standings.map((row: any) => (
                <tr key={row.team} className={`border-b border-slate-800/50 ${row.team === team.id ? 'bg-cyan-900/10 border-l-2 border-l-cyan-500' : ''}`}>
                  <td className={`px-4 py-3 font-bold ${row.team === team.id ? 'text-cyan-400' : 'text-white'}`}>{row.team}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{row.w}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{row.l}</td>
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
            {expiringPlayers.length > 0 ? (
              expiringPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div>
                      <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                        Contract Expiring: {p.name}
                      </div>
                      <div className="text-xs text-slate-500">{p.position} • OVR {p.overall} • Agent awaiting your offer.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(AppView.ROSTER)}
                    className="text-xs bg-slate-800 hover:bg-cyan-600 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    Manage
                  </button>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <div>
                      <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">Game Plan Ready</div>
                      <div className="text-xs text-slate-500">Finalize your week {week} game plan before kickoff.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(AppView.GAMEPLAN)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    Set Plan
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">Free Agent Market Open</div>
                      <div className="text-xs text-slate-500">Several impact players available. Check the market.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(AppView.FREE_AGENCY)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    View
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
