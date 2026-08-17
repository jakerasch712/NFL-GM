import React, { useState } from 'react';
import { MOCK_COACHES, TEAMS_DB } from '../constants';
import { Shield, Zap, Award, Users, ChevronRight, Star, HeartHandshake, Crown, Flame, AlertTriangle, TrendingUp, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { Coach } from '../types';

interface StaffViewProps {
  selectedTeamId: string;
  coaches: Coach[];
  setCoaches: React.Dispatch<React.SetStateAction<Coach[]>>;
  teams: Record<string, any>;
}

interface DecisionImpact {
  id: string;
  category: 'GAME' | 'ROSTER' | 'CONTRACT' | 'CAP';
  title: string;
  ownerDelta: number;
  fanDelta: number;
  date: string;
}

const INITIAL_DECISION_IMPACTS: DecisionImpact[] = [
  { id: 'imp-1', category: 'GAME', title: 'Week 1 Rivalry Victory', ownerDelta: 5, fanDelta: 8, date: 'Week 1' },
  { id: 'imp-2', category: 'CONTRACT', title: 'Secured Franchise Quarterback Extension', ownerDelta: 4, fanDelta: 6, date: 'Offseason' },
  { id: 'imp-3', category: 'ROSTER', title: 'Traded Veteran Leader for Draft Capital', ownerDelta: 2, fanDelta: -4, date: 'Week 1' },
  { id: 'imp-4', category: 'CAP', title: 'Restructured Cap Space below Threshold', ownerDelta: 3, fanDelta: 1, date: 'Week 1' },
];

const StaffView: React.FC<StaffViewProps> = ({ selectedTeamId, coaches, setCoaches, teams }) => {
  const teamCoaches = coaches.filter(c => c.teamId === selectedTeamId);
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];

  const [activeTab, setActiveTab] = useState<'governance' | 'resume'>('governance');

  // Dynamic state for Owner and Fan approval
  const [ownerApproval, setOwnerApproval] = useState<number>(team?.ownerApproval ?? 82);
  const [fanApproval, setFanApproval] = useState<number>(team?.fanApproval ?? 78);
  const [decisionHistory, setDecisionHistory] = useState<DecisionImpact[]>(INITIAL_DECISION_IMPACTS);

  // Multi-Season Career Resume Track Data
  const careerSeasons = [
    { year: 2026, team: `${team.city} ${team.name}`, record: '11-6', winPct: '.647', playoffResult: 'Divisional Round', sbWinner: false, coty: false, ownerScore: ownerApproval, highlight: 'Week 1 Rivalry Victory & Division Title' },
    { year: 2025, team: `${team.city} ${team.name}`, record: '13-4', winPct: '.765', playoffResult: 'Super Bowl Champion 🏆', sbWinner: true, coty: true, ownerScore: 95, highlight: 'Super Bowl LIX Victory & #1 Offense' },
    { year: 2024, team: `${team.city} ${team.name}`, record: '10-7', winPct: '.588', playoffResult: 'Wildcard Round', sbWinner: false, coty: false, ownerScore: 78, highlight: 'Clinched Playoff Berth in Week 18' },
    { year: 2023, team: `${team.city} ${team.name}`, record: '12-5', winPct: '.706', playoffResult: 'Conference Championship', sbWinner: false, coty: true, ownerScore: 88, highlight: 'Coach of the Year Honors' },
    { year: 2022, team: `${team.city} ${team.name}`, record: '12-5', winPct: '.706', playoffResult: 'Super Bowl Champion 🏆', sbWinner: true, coty: false, ownerScore: 92, highlight: 'Super Bowl LVII Franchise Ring' },
  ];

  const totalWins = careerSeasons.reduce((acc, s) => acc + parseInt(s.record.split('-')[0]), 0);
  const totalLosses = careerSeasons.reduce((acc, s) => acc + parseInt(s.record.split('-')[1]), 0);
  const overallWinPct = (totalWins / (totalWins + totalLosses)).toFixed(3);
  const sbTitles = careerSeasons.filter(s => s.sbWinner).length;
  const cotyAwards = careerSeasons.filter(s => s.coty).length;
  const playoffAppearances = careerSeasons.length;

  const legacyScore = (totalWins * 10) + (sbTitles * 400) + (cotyAwards * 150) + (playoffAppearances * 50);

  const getOwnerStatus = (score: number) => {
    if (score >= 85) return { label: 'CHAIRMAN TRUSTED', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
    if (score >= 70) return { label: 'EXPECTATIONS MET', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
    if (score >= 50) return { label: 'WARM SEAT', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
    return { label: 'HOT SEAT // ULTIMATUM', color: 'text-red-400 border-red-500/40 bg-red-500/10' };
  };

  const getFanStatus = (score: number) => {
    if (score >= 85) return { label: 'STADIUM ELECTRIC', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
    if (score >= 70) return { label: 'FAN FAVORITE', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
    if (score >= 50) return { label: 'RESTLESS BLEACHERS', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
    return { label: 'FAN MUTINY // CALLS FOR FIRE', color: 'text-red-400 border-red-500/40 bg-red-500/10' };
  };

  const ownerStatus = getOwnerStatus(ownerApproval);
  const fanStatus = getFanStatus(fanApproval);

  return (
    <div className="p-8 h-full overflow-y-auto space-y-8 bg-[#05070a] text-slate-100 font-mono">
      <header className="border-b border-[#1a222e] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">HEAD_COACH_CONTROL_CENTER</h2>
          <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic flex items-center gap-2">
            <Users size={14} className="text-cyan-500 animate-pulse" />
            ACTIVE_STAFF_DIRECTIVE // CAREER RESUME & GOVERNANCE
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-[#0a0e14] border border-[#1a222e] p-1 gap-1">
          <button
            onClick={() => setActiveTab('governance')}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
              activeTab === 'governance'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
            GOVERNANCE & STAFF
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
              activeTab === 'resume'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown size={14} />
            CAREER RESUME & LEGACY
          </button>
        </div>
      </header>

      {activeTab === 'resume' ? (
        /* CAREER RESUME & MULTI-SEASON LEGACY VIEW */
        <div className="space-y-8">
          {/* Top Legacy Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 relative overflow-hidden group">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">HEAD COACH CAREER RECORD</span>
              <div className="text-3xl font-bold text-white header-font italic mt-1">{totalWins}-{totalLosses}-0</div>
              <div className="text-[10px] text-cyan-400 font-bold mt-2">{overallWinPct} WIN PERCENTAGE</div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 relative overflow-hidden group">
              <span className="text-[9px] text-amber-500 uppercase tracking-widest block font-bold">SUPER BOWL CHAMPIONSHIPS</span>
              <div className="text-3xl font-bold text-amber-400 header-font italic mt-1 flex items-center gap-2">
                🏆 {sbTitles} RINGS
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-2">{playoffAppearances} PLAYOFF APPEARANCES</div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 relative overflow-hidden group">
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest block font-bold">COACH OF THE YEAR</span>
              <div className="text-3xl font-bold text-white header-font italic mt-1 flex items-center gap-2">
                🏅 {cotyAwards} AWARDS
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-2">5 SEASONS AT THE HELM</div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest block font-bold">HOF LEGACY INDEX</span>
                <div className="text-3xl font-bold text-white header-font italic mt-1">{legacyScore} <span className="text-xs text-slate-500 font-normal">/ 2000 PTS</span></div>
              </div>
              <div className="w-full bg-[#05070a] border border-[#1a222e] h-2 mt-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full shadow-[0_0_10px_rgba(0,209,255,0.8)]" 
                  style={{ width: `${Math.min(100, (legacyScore / 2000) * 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-500 uppercase mt-1">HALL OF FAME LOCK STATUS</span>
            </div>
          </div>

          {/* Season-By-Season Coaching Log */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-[#1a222e] mb-6">
              <div>
                <h3 className="text-xl font-bold text-white header-font uppercase italic flex items-center gap-2">
                  <Award className="text-amber-400" size={20} />
                  MULTI-SEASON HEAD COACH RESUME LOG
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                  Comprehensive historical breakdown of team performance, playoff milestones, and owner confidence.
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold uppercase">
                FRANCHISE TENURE: 2022-2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0d121a] text-slate-400 text-[10px] uppercase border-b border-[#1a222e]">
                  <tr>
                    <th className="p-3">SEASON</th>
                    <th className="p-3">FRANCHISE</th>
                    <th className="p-3">RECORD</th>
                    <th className="p-3">WIN %</th>
                    <th className="p-3">PLAYOFF RESULT</th>
                    <th className="p-3">AWARDS</th>
                    <th className="p-3">OWNER RATING</th>
                    <th className="p-3">SEASON HIGHLIGHT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a222e]/40 text-xs">
                  {careerSeasons.map((s) => (
                    <tr key={s.year} className="hover:bg-[#05070a] transition-colors">
                      <td className="p-3 font-bold text-cyan-400">{s.year}</td>
                      <td className="p-3 font-bold text-white">{s.team}</td>
                      <td className="p-3 font-mono text-slate-300 font-bold">{s.record}</td>
                      <td className="p-3 text-slate-400">{s.winPct}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 border ${
                          s.sbWinner 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                            : 'bg-slate-800/50 text-slate-300 border-slate-700'
                        }`}>
                          {s.playoffResult}
                        </span>
                      </td>
                      <td className="p-3">
                        {s.coty ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">
                            🏅 COTY
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-amber-400">{s.ownerScore}%</td>
                      <td className="p-3 text-slate-400 text-[10px] italic">{s.highlight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* GOVERNANCE & STAFF VIEW */
        <>
          {/* Fan & Owner Approval Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Approval Card */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Crown size={28} />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">FRANCHISE OWNERSHIP TRUST</span>
                    <h3 className="text-xl font-bold text-white header-font uppercase italic tracking-wider">OWNER APPROVAL METER</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase border ${ownerStatus.color}`}>
                  {ownerStatus.label}
                </span>
              </div>

              <div className="space-y-3 mb-6 font-mono">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-400 uppercase font-bold">CONFIDENCE INDEX</span>
                  <span className="text-3xl font-bold text-amber-400">{ownerApproval}%</span>
                </div>
                <div className="w-full h-3 bg-[#05070a] border border-[#1a222e] overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${ownerApproval}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#05070a] border border-[#1a222e] p-3 font-mono text-[10px] space-y-1.5">
                <span className="text-slate-500 uppercase font-bold block mb-1">OWNER PRIORITIES:</span>
                <div className="flex justify-between text-slate-300">
                  <span>• Maintain Salary Cap Flexibility</span>
                  <span className="text-emerald-400 font-bold">ON TARGET</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>• Reach Playoff Round</span>
                  <span className="text-amber-400 font-bold">IN PROGRESS</span>
                </div>
              </div>
            </div>

            {/* Fan Approval Card */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <HeartHandshake size={28} />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">STADIUM BLEACHER SENTIMENT</span>
                    <h3 className="text-xl font-bold text-white header-font uppercase italic tracking-wider">FAN APPROVAL METER</h3>
                  </div>
                </div>
                <span className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase border ${fanStatus.color}`}>
                  {fanStatus.label}
                </span>
              </div>

              <div className="space-y-3 mb-6 font-mono">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-slate-400 uppercase font-bold">FAN ENTHUSIASM INDEX</span>
                  <span className="text-3xl font-bold text-cyan-400">{fanApproval}%</span>
                </div>
                <div className="w-full h-3 bg-[#05070a] border border-[#1a222e] overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${fanApproval}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#05070a] border border-[#1a222e] p-3 font-mono text-[10px] space-y-1.5">
                <span className="text-slate-500 uppercase font-bold block mb-1">FANBASE EXPECTATIONS:</span>
                <div className="flex justify-between text-slate-300">
                  <span>• Exciting High-Octane Playcalling</span>
                  <span className="text-emerald-400 font-bold">HIGH RATING</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>• Retain Core Franchise Superstars</span>
                  <span className="text-cyan-400 font-bold">SATISFIED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Impact Ledger */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex justify-between items-center pb-3 border-b border-[#1a222e]">
              <div className="flex items-center gap-2">
                <Flame className="text-amber-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">RECENT DECISION & GAME OUTCOME IMPACTS</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase">LIVE REACTION ENGINE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {decisionHistory.map((imp) => (
                <div key={imp.id} className="bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 uppercase tracking-widest inline-block mb-2">
                      {imp.category} // {imp.date}
                    </span>
                    <p className="text-xs text-white font-bold leading-snug">{imp.title}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-2 border-t border-[#1a222e]">
                    <span className={imp.ownerDelta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      OWNER: {imp.ownerDelta >= 0 ? `+${imp.ownerDelta}%` : `${imp.ownerDelta}%`}
                    </span>
                    <span className={imp.fanDelta >= 0 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                      FAN: {imp.fanDelta >= 0 ? `+${imp.fanDelta}%` : `${imp.fanDelta}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Staff Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white header-font uppercase tracking-wider italic border-b border-[#1a222e] pb-2">
              COACHING STAFF DIRECTORY & TRAITS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamCoaches.map(coach => (
                <div key={coach.id} className="bg-[#0a0e14] border border-[#1a222e] overflow-hidden shadow-xl group hover:border-cyan-500/30 transition-all duration-500 relative">
                  <div className="p-8 bg-[#0d121a]/50 border-b border-[#1a222e]">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-[#05070a] border border-[#1a222e] flex items-center justify-center font-bold text-cyan-500 mono-font text-lg shadow-[0_0_15px_rgba(0,209,255,0.1)] group-hover:border-cyan-500/50 transition-all">
                        {coach.role}
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-500">
                        {Array.from({ length: Math.min(5, coach.experience) }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" className="animate-pulse" />
                        ))}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 header-font uppercase italic tracking-tight group-hover:text-cyan-400 transition-colors">{coach.name}</h3>
                    <div className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold mono-font italic">
                      {coach.specialty}_SPEC // SCHEME::{coach.scheme}
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    <div className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] mono-font italic mb-6 flex items-center gap-2">
                      <div className="w-4 h-[1px] bg-slate-800"></div> ACTIVE_LOGIC_TRAITS
                    </div>
                    {coach.traits.map((trait, i) => (
                      <div key={i} className="bg-[#05070a] border border-[#1a222e] p-5 group/trait hover:border-cyan-500/20 transition-all">
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center shrink-0 group-hover/trait:scale-110 transition-transform">
                            <Zap size={18} className="text-cyan-500/50" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-2 uppercase italic tracking-tight font-mono">{trait.name}</div>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-mono uppercase tracking-widest italic">{trait.description}</p>
                            <div className="mt-3 text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold">
                              MOD::+{trait.bonus.value} {trait.bonus.stat}_VAL
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-[#05070a] border-t border-[#1a222e] flex justify-between items-center bg-gradient-to-r from-transparent to-cyan-500/5">
                    <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mono-font italic">SERVICE_RECORD:: {coach.experience}YR</div>
                    <button className="text-[10px] text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-[0.2em] mono-font transition-all flex items-center gap-2 italic">
                      SKILL_TREE_ACCESS <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Hiring Slot */}
              <div className="bg-[#05070a]/30 border border-dashed border-[#1a222e] flex flex-col items-center justify-center p-12 text-center group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden h-full min-h-[400px]">
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-20 h-20 bg-[#0a0e14] border border-[#1a222e] flex items-center justify-center mb-6 group-hover:scale-110 transition-all group-hover:border-cyan-500/50 relative z-10 shadow-xl">
                  <Users size={32} className="text-slate-700 group-hover:text-cyan-500 transition-colors" />
                </div>
                <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-[0.3em] font-mono italic group-hover:text-white transition-colors relative z-10">HIRE_NEW_COORDINATOR</h3>
                <p className="text-[9px] text-slate-800 mono-font uppercase tracking-widest max-w-[200px] italic group-hover:text-slate-600 transition-colors relative z-10">Expand management tree to unlock cross-unit biometric bonuses.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffView;
