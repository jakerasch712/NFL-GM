import React, { useState } from 'react';
import { Calendar, TrendingUp, AlertCircle, Activity, Trophy, ChevronDown, MapPin, UserCheck, HelpCircle, Newspaper, Award, Flame, DollarSign, X, ShieldAlert, Info, ExternalLink, ChevronRight, HeartPulse, Mic, MessageSquare, CheckCircle2, Zap, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { LeaguePhase, Player, Position, ScheduleMatch } from '../types';
import { getTeamCapSpace } from '../services/financeService';
import { leagueInjuryReport } from '../services/injuryService';

interface DashboardProps {
  selectedTeamId: string;
  leaguePhase: LeaguePhase;
  currentWeek: number;
  teams: Record<string, any>;
  allPlayers: Player[];
  schedule: ScheduleMatch[];
  salaryCap: number;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedTeamId, leaguePhase, currentWeek, teams, allPlayers, schedule, salaryCap }) => {
  const [leaderboardCategory, setLeaderboardCategory] = useState<'passing' | 'rushing' | 'sacks'>('passing');
  const [showCapToast, setShowCapToast] = useState(true);
  const [showCapModal, setShowCapModal] = useState(false);

  // Media Presser State
  const [selectedPressAnswer, setSelectedPressAnswer] = useState<number | null>(null);
  const [presserFeedback, setPresserFeedback] = useState<string | null>(null);

  // Standings Tab View State
  const [standingsTab, setStandingsTab] = useState<'division' | 'league' | 'afc' | 'nfc'>('league');

  const getTeamData = (teamId: string, currentWeek: number) => {
    const team = teams[teamId] || TEAMS_DB[teamId];
    const divisionTeams = Object.values(teams).filter((t: any) => t.division === team.division);
    
    // Find next match
    const nextMatch = schedule.find(m => 
      m.week >= currentWeek && !m.isCompleted && (m.homeTeamId === teamId || m.awayTeamId === teamId)
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

  // Press Conference Questions Engine
  const presserQuestion = {
    reporter: 'Adam Schefter // ESPN Senior NFL Insider',
    question: `Coach, heading into Week ${currentWeek} against ${team.nextOpp.name}, national media is debating your team's locker room chemistry and tactical focus. How are you addressing player development and team expectations?`,
    options: [
      {
        id: 1,
        text: `"We have complete trust in our players. We're empowering our offense to play aggressively and unleash our young talent."`,
        moraleDelta: '+4 Morale',
        devDelta: '+2 QB/WR Dev',
        ownerDelta: '+2% Owner Trust',
        summary: 'Player-First Trust: Locker room morale surges +4, Offensive player development accelerated!'
      },
      {
        id: 2,
        text: `"Uncompromising discipline. If players don't execute their assignments in practice, they won't see the field on Sunday."`,
        moraleDelta: '-2 Morale',
        devDelta: '+3 Defensive Intensity',
        ownerDelta: '+5% Owner Trust',
        summary: 'Hardline Discipline: Defensive execution boosted +3, Owner trust reaches high rating!'
      },
      {
        id: 3,
        text: `"We ignore outside noise, lock into film study, and execute our scheme one play at a time."`,
        moraleDelta: '+1 Morale',
        devDelta: '+2 Tactical Focus',
        ownerDelta: '+1% Owner Trust',
        summary: 'Methodical Focus: Balanced team preparation with zero distraction penalties.'
      }
    ]
  };

  const handlePresserAnswer = (option: any) => {
    setSelectedPressAnswer(option.id);
    setPresserFeedback(option.summary);
  };

  // Full 32-Team League Standings Processor
  const getAllLeagueStandings = () => {
    const allTeamsList = Object.values(teams).map((t: any) => {
      const parts = t.record ? t.record.split('-') : ['0', '0'];
      const wins = parseInt(parts[0]) || 0;
      const losses = parseInt(parts[1]) || 0;
      const totalGames = wins + losses || 1;
      const winPct = (wins / totalGames).toFixed(3);
      const conf = t.division ? t.division.split(' ')[0] : 'AFC';
      return {
        id: t.id,
        city: t.city,
        name: t.name,
        division: t.division,
        conference: conf,
        wins,
        losses,
        winPct,
        record: t.record || '0-0',
        logo: t.logo,
        diff: wins >= losses ? `+${(wins - losses) * 7}` : `-${(losses - wins) * 7}`
      };
    });

    allTeamsList.sort((a, b) => b.wins - a.wins || parseFloat(b.winPct) - parseFloat(a.winPct));

    if (standingsTab === 'afc') {
      return allTeamsList.filter(t => t.conference === 'AFC');
    }
    if (standingsTab === 'nfc') {
      return allTeamsList.filter(t => t.conference === 'NFC');
    }
    return allTeamsList;
  };

  const allStandingsList = getAllLeagueStandings();
  
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

  // League Health Ticker, built from the actual injury report
  const leagueInjuries = leagueInjuryReport(allPlayers, 10).map(p => ({
    name: p.name,
    team: p.teamId,
    pos: p.position,
    ovr: p.overall,
    injury: p.injury!.type,
    duration: p.injury!.weeksOut === 1 ? 'Out 1 Week' : `Out ${p.injury!.weeksOut} Weeks`,
    impact: p.teamId === selectedTeamId
      ? 'YOUR ROSTER — next man up'
      : `${p.teamId} down a ${p.injury!.severity.toLowerCase()} contributor`,
  }));

  // Helper for Weekly Preview Opponent Stars
  const getOpponentStars = () => {
    const oppCode = team.nextOpp.code;
    const oppPool = allPlayers.filter(p => p.teamId === oppCode);
    
    let topOffense = oppPool
      .filter(p => ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position))
      .sort((a, b) => b.overall - a.overall)[0];
    let topDefense = oppPool
      .filter(p => ['DL', 'LB', 'CB', 'S', 'EDGE'].includes(p.position))
      .sort((a, b) => b.overall - a.overall)[0];

    if (!topOffense && oppPool.length > 0) {
      topOffense = [...oppPool].sort((a, b) => b.overall - a.overall)[0];
    }
    if (!topDefense && oppPool.length > 0) {
      topDefense = [...oppPool].filter(p => p.id !== topOffense?.id).sort((a, b) => b.overall - a.overall)[0] || topOffense;
    }

    if (!topOffense) {
      const oppName = team.nextOpp.name || 'Opponent';
      topOffense = { name: `${oppName} Franchise QB`, position: 'QB' as any, overall: 85, teamId: oppCode, stats: { yards: 2200 } } as any;
    }
    if (!topDefense) {
      const oppName = team.nextOpp.name || 'Opponent';
      topDefense = { name: `${oppName} Defensive Anchor`, position: 'DL' as any, overall: 86, teamId: oppCode, stats: { sacks: 7.0 } } as any;
    }

    return { topOffense, topDefense };
  };

  const { topOffense, topDefense } = getOpponentStars();
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

  // Calculate Salary Cap Health Metrics
  // Top-51 rule against the league cap, so this agrees with Navigation,
  // RosterView and FreeAgency instead of counting the whole 90-man roster.
  const MAX_CAP_LIMIT = salaryCap;
  const remainingCapSpace = parseFloat(getTeamCapSpace(roster, salaryCap).toFixed(1));
  const totalPayroll = parseFloat((MAX_CAP_LIMIT - remainingCapSpace).toFixed(1));
  const capUsagePct = Math.min(100, Math.max(0, Math.round((totalPayroll / MAX_CAP_LIMIT) * 100)));
  // Judged on remaining space: real teams routinely carry 95% of the cap, so a
  // percentage threshold would flag all 32 teams permanently.
  const capHealthStatus = remainingCapSpace < 0 ? 'CRITICAL' : remainingCapSpace < 5 ? 'WARNING' : 'HEALTHY';
  const isCapApproachingLimit = capHealthStatus !== 'HEALTHY';
  
  // Sorted Top Contracts
  const sortedTopContracts = [...roster].sort((a, b) => (b.contract?.capHit || b.contract?.salary || 0) - (a.contract?.capHit || a.contract?.salary || 0)).slice(0, 5);

  // Statistical leaderboards. These report ACTUAL accumulated stats only —
  // never values synthesised from `overall`, which would rank players who have
  // not taken a snap above players with real production.
  interface LeaderRow { id: string; name: string; team: string; val: number; secondary: string; ovr: number }

  const topFive = (rows: LeaderRow[]) =>
    rows.filter(r => r.val > 0).sort((a, b) => b.val - a.val).slice(0, 5);

  const getPassingLeaders = (): LeaderRow[] => topFive(
    allPlayers
      .filter(p => p.position === Position.QB)
      .map(p => ({
        id: p.id, name: p.name, team: p.teamId,
        val: p.stats.yards || 0,
        secondary: `${p.stats.touchdowns || 0} TD`,
        ovr: p.overall
      }))
  );

  const getRushingLeaders = (): LeaderRow[] => topFive(
    allPlayers
      .filter(p => p.position === Position.RB)
      .map(p => ({
        id: p.id, name: p.name, team: p.teamId,
        val: p.stats.yards || 0,
        secondary: `${p.stats.touchdowns || 0} TD`,
        ovr: p.overall
      }))
  );

  const getSackLeaders = (): LeaderRow[] => topFive(
    allPlayers
      .filter(p => p.position === Position.DL || p.position === Position.LB)
      .map(p => ({
        id: p.id, name: p.name, team: p.teamId,
        val: p.stats.sacks || 0,
        secondary: `${p.stats.tackles || 0} TKL`,
        ovr: p.overall
      }))
  );

  const leaderData = 
    leaderboardCategory === 'passing' ? getPassingLeaders() :
    leaderboardCategory === 'rushing' ? getRushingLeaders() :
    getSackLeaders();

  const primaryLeaderColor = 
    leaderboardCategory === 'passing' ? '#00d1ff' :
    leaderboardCategory === 'rushing' ? '#10b981' : '#f43f5e';

  // Pseudo-random headlines generator
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
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowCapModal(true)}
            className={`flex items-center gap-3 px-4 py-2 border transition-all font-mono font-bold text-[10px] uppercase tracking-wider ${
              capHealthStatus === 'CRITICAL'
                ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20'
                : capHealthStatus === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <DollarSign size={15} />
            <span>CAP HEALTH :: {capUsagePct}% USED</span>
            <ChevronRight size={14} />
          </button>

          <div className="text-right border-l border-[#1a222e] pl-6">
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1 font-bold">REGISTRY_RECORD</div>
            <div className="text-3xl font-bold font-mono text-white tracking-widest">{team.record}</div>
          </div>
        </div>
      </header>

      {/* Salary Cap Health Toast Notification Banner */}
      {showCapToast && isCapApproachingLimit && (
        <div className={`mb-6 p-5 border shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all animate-pulse-subtle ${
          capHealthStatus === 'CRITICAL'
            ? 'bg-red-500/10 border-red-500/60 text-red-200'
            : 'bg-amber-500/10 border-amber-500/60 text-amber-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-none border ${
              capHealthStatus === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-amber-500/20 border-amber-500 text-amber-400'
            }`}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                  SALARY CAP HEALTH WARNING :: PAYROLL APPROACHING MAXIMUM LIMIT
                </h4>
                <span className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest border ${
                  capHealthStatus === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-amber-500/20 border-amber-500 text-amber-400'
                }`}>
                  {capHealthStatus} PROTOCOL ({capUsagePct}%)
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 mt-1">
                Total team payroll is <span className="font-bold text-white">${totalPayroll}M</span> out of <span className="font-bold text-white">${MAX_CAP_LIMIT}M</span> limit. Only <span className="font-bold text-emerald-400">${remainingCapSpace}M</span> remaining in cap space.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowCapModal(true)}
              className="px-4 py-2 bg-[#0a0e14] border border-[#1a222e] hover:border-cyan-500 hover:text-cyan-400 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              ANALYZE CAP HEALTH <ExternalLink size={12} />
            </button>
            <button
              onClick={() => setShowCapToast(false)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
              title="Dismiss Notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Salary Cap Health Overlay Modal */}
      {showCapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0e14] border border-[#1a222e] w-full max-w-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCapModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a222e]">
              <DollarSign className="text-cyan-400" size={28} />
              <div>
                <h3 className="text-2xl font-bold text-white header-font tracking-tight uppercase italic">
                  SALARY_CAP_HEALTH_DIAGNOSTICS
                </h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                  League Maximum Cap Limit: <span className="text-white font-bold">${MAX_CAP_LIMIT}M</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#05070a] border border-[#1a222e] p-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">TOTAL_PAYROLL</div>
                <div className="text-2xl font-mono font-bold text-white">${totalPayroll}M</div>
                <div className="text-[9px] font-mono text-cyan-500 mt-1">{capUsagePct}% Of Limit</div>
              </div>

              <div className="bg-[#05070a] border border-[#1a222e] p-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">REMAINING_ROOM</div>
                <div className={`text-2xl font-mono font-bold ${remainingCapSpace < 20 ? 'text-red-500' : remainingCapSpace < 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ${remainingCapSpace}M
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">Available Top 51</div>
              </div>

              <div className="bg-[#05070a] border border-[#1a222e] p-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">CAP_HEALTH_STATUS</div>
                <div className={`text-2xl font-mono font-bold ${
                  capHealthStatus === 'CRITICAL' ? 'text-red-500' : capHealthStatus === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {capHealthStatus}
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">League Benchmark</div>
              </div>
            </div>

            {/* Cap Usage Meter */}
            <div className="mb-6 bg-[#05070a] border border-[#1a222e] p-4">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 mb-2">
                <span>CAP LIMIT UTILIZATION</span>
                <span>${totalPayroll}M / ${MAX_CAP_LIMIT}M ({capUsagePct}%)</span>
              </div>
              <div className="w-full bg-[#0d121a] h-3 border border-[#1a222e] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    capUsagePct >= 93 ? 'bg-red-500' : capUsagePct >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${capUsagePct}%` }}
                ></div>
              </div>
            </div>

            {/* Top Cap Hit Contracts */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">TOP CAP HIT CONTRACTS</h4>
              <div className="space-y-1.5">
                {sortedTopContracts.map(player => (
                  <div key={player.id} className="bg-[#05070a] border border-[#1a222e] p-3 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-bold w-8">{player.position}</span>
                      <span className="text-white font-bold">{player.name}</span>
                      <span className="text-slate-500 text-[10px]">({player.overall} OVR)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-[10px]">{player.contract?.yearsLeft || 1} YRS LEFT</span>
                      <span className="text-amber-400 font-bold">${player.contract?.capHit || player.contract?.salary || 0}M / YR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Recommendations */}
            <div className="bg-[#05070a] border border-[#1a222e] p-4 flex items-start gap-3 text-xs font-mono">
              <Info className="text-cyan-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-slate-300 leading-relaxed">
                {capHealthStatus === 'CRITICAL'
                  ? 'CRITICAL ADVISORY: Your team is within 7% of the hard cap. Consider converting base salary to signing bonus for top veterans in Roster View, or releasing high dead-cap contracts before signing Free Agents.'
                  : capHealthStatus === 'WARNING'
                  ? 'CAP WARNING: Cap space is tightening. Monitor upcoming extension demands and structure multi-year contracts with back-loaded base salaries.'
                  : 'HEALTHY STATUS: Roster payroll is well structured. You have full operational flexibility to target star Free Agents or absorb contract trades.'}
              </p>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowCapModal(false)}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all"
              >
                CLOSE DIAGNOSTICS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* League Health Ticker: Major League-Wide Star Injuries for Trade / FA Context */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-3 mb-6 font-mono flex items-center gap-4 overflow-hidden relative group">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase tracking-wider flex-shrink-0">
          <HeartPulse size={14} className="animate-pulse text-red-500" />
          LEAGUE_HEALTH_TICKER
        </div>

        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 text-xs">
          {leagueInjuries.map((inj, idx) => (
            <div key={idx} className="flex items-center gap-2.5 bg-[#05070a] border border-[#1a222e] px-3 py-1.5 hover:border-red-500/40 transition-colors flex-shrink-0">
              <span className="text-cyan-400 font-bold text-[10px]">{inj.team}</span>
              <span className="text-white font-bold">{inj.name} ({inj.pos})</span>
              <span className="text-red-400 font-mono text-[10px] bg-red-500/10 px-1.5 py-0.5 border border-red-500/20">{inj.injury} • {inj.duration}</span>
              <span className="text-slate-400 text-[10px] italic">[{inj.impact}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Media Presser / Press Conference Module */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-6 mb-6 font-mono shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center pb-4 border-b border-[#1a222e] mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(0,209,255,0.2)]">
              <Mic size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white header-font uppercase tracking-wider italic flex items-center gap-2">
                MEDIA_PRESSER // WEEK {currentWeek} INTERVIEW
              </h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                DYNAMIC INTERVIEW RESPONSE ENGINE • DIRECTLY IMPACTS TEAM MORALE & PLAYER DEVELOPMENT
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase">
            REPORTER: {presserQuestion.reporter}
          </span>
        </div>

        {/* Interview Query Box */}
        <div className="bg-[#05070a] border border-[#1a222e] p-5 mb-5 relative">
          <div className="flex items-start gap-4">
            <MessageSquare className="text-cyan-400 shrink-0 mt-1" size={20} />
            <div>
              <p className="text-xs text-slate-200 leading-relaxed font-bold italic">
                "{presserQuestion.question}"
              </p>
            </div>
          </div>
        </div>

        {/* Answer Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presserQuestion.options.map((opt) => {
            const isSelected = selectedPressAnswer === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handlePresserAnswer(opt)}
                className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                    : 'bg-[#05070a] border-[#1a222e] hover:border-cyan-500/40 hover:bg-[#0d121a]/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                      OPTION 0{opt.id}
                    </span>
                    {isSelected && (
                      <span className="text-cyan-400 flex items-center gap-1 text-[9px] font-bold uppercase">
                        <CheckCircle2 size={12} /> SELECTED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white leading-snug font-medium italic mb-4">
                    {opt.text}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1a222e]/60 flex flex-wrap gap-1.5 text-[8.5px] font-bold">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                    {opt.moraleDelta}
                  </span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase">
                    {opt.devDelta}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase">
                    {opt.ownerDelta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Feedback Notification Banner */}
        {presserFeedback && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-pulse-subtle">
            <Zap size={16} className="text-emerald-400 shrink-0" />
            <span className="font-bold uppercase tracking-wide">{presserFeedback}</span>
          </div>
        )}
      </div>

      {/* Row 1: Upcoming Match & Weekly Preview Card + Unit Matrix */}
      <div className="grid grid-cols-12 gap-1 mb-6">
        {/* Next Opponent & Weekly Preview Card */}
        <div className="col-span-12 lg:col-span-8 bg-[#0a0e14] border border-[#1a222e] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={180} />
          </div>
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
                <span className="text-[10px] font-bold text-cyan-500 tracking-[0.4em] uppercase mb-2 block font-mono">WEEKLY_PREVIEW :: UPCOMING_ENGAGEMENT</span>
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
          
          {/* Key Players To Watch (Weekly Preview Analysis) */}
          <div className="mt-8 pt-6 border-t border-[#1a222e] relative z-10 font-mono">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Flame size={14} />
              WEEKLY_OPPONENT_PREVIEW :: TOP-RANKED PLAYERS TO WATCH
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Top Offensive Threat */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 group-hover:border-amber-500/40 transition-colors">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">TOP OFFENSIVE THREAT</span>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white block">{topOffense.name}</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{topOffense.position} // {topOffense.overall} OVR</span>
                  </div>
                  <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold">
                    PRIMARY TARGET
                  </div>
                </div>
              </div>

              {/* Top Defensive Anchor */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 group-hover:border-cyan-500/40 transition-colors">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">TOP DEFENSIVE ANCHOR</span>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white block">{topDefense.name}</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{topDefense.position} // {topDefense.overall} OVR</span>
                  </div>
                  <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold">
                    PASS RUSH THREAT
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1 relative z-10">
            <div className="bg-[#05070a] p-4 border border-[#1a222e] group-hover:border-red-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold font-mono">THREAT_VECTOR</div>
              <div className={`text-lg font-bold font-mono tracking-widest ${team.nextOpp.threat === 'EXTREME' ? 'text-red-500' : team.nextOpp.threat === 'HIGH' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {team.nextOpp.threat}
              </div>
            </div>
            <div className="bg-[#05070a] p-4 border border-[#1a222e] group-hover:border-cyan-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold font-mono">WIN_PROBABILITY</div>
              <div className="text-lg font-bold text-cyan-400 font-mono tracking-widest">{team.nextOpp.winProb}%</div>
            </div>
            <div className="bg-[#05070a] p-4 border border-[#1a222e] group-hover:border-emerald-500/30 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold font-mono">ROSTER_INTEGRITY</div>
              <div className="text-lg font-bold text-emerald-400 font-mono tracking-widest">94%</div>
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
                <Bar dataKey="val" radius={[0, 2, 2, 0]} isAnimationActive={true} animationDuration={1000}>
                  {teamStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.80} className="transition-all duration-300 hover:opacity-100 cursor-pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Seasonal Statistical Leaderboard (Recharts Visualization) */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-6 mb-6 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 border-b border-[#1a222e] gap-4">
          <div>
            <h3 className="text-lg font-bold text-white header-font tracking-tight uppercase italic flex items-center gap-2">
              <Award className="text-cyan-400" size={20} />
              SEASONAL_STATISTICAL_LEADERBOARD
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
              League-wide statistical leaders visualizer powered by Recharts engine.
            </p>
          </div>

          <div className="flex bg-[#05070a] border border-[#1a222e] p-1">
            <button
              onClick={() => setLeaderboardCategory('passing')}
              className={`px-4 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider transition-all ${
                leaderboardCategory === 'passing' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-white'
              }`}
            >
              PASSING YARDS
            </button>
            <button
              onClick={() => setLeaderboardCategory('rushing')}
              className={`px-4 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider transition-all ${
                leaderboardCategory === 'rushing' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-white'
              }`}
            >
              RUSHING YARDS
            </button>
            <button
              onClick={() => setLeaderboardCategory('sacks')}
              className={`px-4 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider transition-all ${
                leaderboardCategory === 'sacks' ? 'bg-fuchsia-500 text-black' : 'text-slate-500 hover:text-white'
              }`}
            >
              SACKS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Recharts Visualizer */}
          <div className="col-span-12 lg:col-span-7 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#ffffff', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#05070a', borderColor: '#1a222e', color: '#fff', borderRadius: '0px', fontFamily: 'JetBrains Mono', fontSize: '10px' }} 
                  cursor={{ fill: 'rgba(0,209,255,0.03)' }}
                  formatter={(val: any) => [
                    `${val} ${leaderboardCategory === 'sacks' ? 'Sacks' : 'Yards'}`,
                    leaderboardCategory.toUpperCase()
                  ]}
                />
                <Bar 
                  dataKey="val" 
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {leaderData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={primaryLeaderColor} 
                      fillOpacity={index === 0 ? 1 : 0.8 - index * 0.12}
                      className="transition-all duration-300 hover:opacity-100 hover:brightness-125 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Leaderboard Details */}
          <div className="col-span-12 lg:col-span-5 bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between">
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-[#1a222e] pb-2 flex justify-between">
              <span>RANK // PLAYER</span>
              <span>TOTAL // SEC</span>
            </div>

            <div className="space-y-2">
              {leaderData.map((player, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={idx} className={`flex justify-between items-center p-2 border transition-all ${
                    isFirst ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-[#0a0e14] border-[#1a222e] text-slate-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-bold text-xs ${isFirst ? 'text-amber-400' : 'text-slate-600'}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold font-mono uppercase tracking-wider">{player.name}</div>
                        <div className="text-[8px] font-mono text-slate-500">{player.team} // {player.ovr} OVR</div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold tracking-tight">
                        {player.val} <span className="text-[9px] text-slate-500 font-normal">{leaderboardCategory === 'sacks' ? 'SK' : 'YDS'}</span>
                      </div>
                      <div className="text-[8px] text-slate-500">{player.secondary}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Standings, Salary Cap Distribution, and League News (3-Column Bento Map) */}
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
                <Bar dataKey="val" radius={[0, 2, 2, 0]} isAnimationActive={true} animationDuration={1000}>
                  {capDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} className="transition-all duration-300 hover:opacity-100 cursor-pointer" />
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

      {/* Row 3.5: Comprehensive 32-Team League Standings Matrix */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-6 mb-6 font-mono shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-[#1a222e] mb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white header-font uppercase tracking-wider italic flex items-center gap-2">
              <BarChart3 className="text-cyan-400" size={20} />
              LEAGUE_STANDINGS_MATRIX // 32-FRANCHISE RANKINGS
            </h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
              REAL-TIME WIN-LOSS PERCENTAGES, POINT DIFFERENTIALS, AND DIVISION SEEDINGS
            </p>
          </div>

          <div className="flex bg-[#05070a] border border-[#1a222e] p-1 gap-1">
            <button
              onClick={() => setStandingsTab('league')}
              className={`px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                standingsTab === 'league' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              LEAGUE (1-32)
            </button>
            <button
              onClick={() => setStandingsTab('afc')}
              className={`px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                standingsTab === 'afc' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              AFC CONF
            </button>
            <button
              onClick={() => setStandingsTab('nfc')}
              className={`px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                standingsTab === 'nfc' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              NFC CONF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d121a] text-slate-400 text-[9px] uppercase border-b border-[#1a222e] sticky top-0 z-10">
              <tr>
                <th className="p-2.5">RANK</th>
                <th className="p-2.5">FRANCHISE</th>
                <th className="p-2.5">DIVISION</th>
                <th className="p-2.5 text-center">RECORD</th>
                <th className="p-2.5 text-center">WIN %</th>
                <th className="p-2.5 text-right">POINT DIFF</th>
                <th className="p-2.5 text-right">PLAYOFF SEED STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a222e]/40">
              {allStandingsList.map((teamRow, idx) => {
                const isUserTeam = teamRow.id === selectedTeamId;
                const seedStatus = idx < 7 ? `SEED #${idx + 1} [CLINCHED]` : idx < 12 ? `IN HUNT` : `ELIMINATED`;
                const seedBadgeColor = idx < 7 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/50 text-slate-500 border-slate-700';

                return (
                  <tr 
                    key={teamRow.id} 
                    className={`transition-colors ${
                      isUserTeam ? 'bg-cyan-500/15 border-l-2 border-l-cyan-400 font-bold' : 'hover:bg-[#05070a]'
                    }`}
                  >
                    <td className="p-2.5 font-bold text-slate-500">#{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-[#05070a] border border-[#1a222e] p-0.5 flex-shrink-0">
                          <img src={teamRow.logo} alt={teamRow.id} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className={`font-bold ${isUserTeam ? 'text-cyan-400' : 'text-white'}`}>
                          {teamRow.city} {teamRow.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-[10px] text-slate-400 uppercase">{teamRow.division}</td>
                    <td className="p-2.5 text-center font-bold text-white">{teamRow.record}</td>
                    <td className="p-2.5 text-center text-cyan-400 font-bold">{teamRow.winPct}</td>
                    <td className={`p-2.5 text-right font-bold ${teamRow.diff.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {teamRow.diff}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className={`px-2 py-0.5 border text-[8.5px] uppercase font-bold ${seedBadgeColor}`}>
                        {seedStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Advisor & Priority Protocols */}
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
