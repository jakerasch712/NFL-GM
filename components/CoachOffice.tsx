import React, { useState } from 'react';
import { HeadCoachProfile, CoachSkill, CoachSkillBranch, WeeklyAgendaActivity, Player, LastGameResult } from '../types';
import { HC09_COACH_SKILLS, DEFAULT_COACH_PHILOSOPHY } from '../data/hc09Data';
import { TEAMS_DB } from '../constants';
import { PressConferenceView } from './PressConferenceView';
import { 
  Users, Zap, Target, TrendingUp, Clock, Flame, Award, Shield, Sparkles, 
  Eye, Radio, Activity, HeartHandshake, CheckCircle2, ShieldAlert, Crown, 
  Brain, Film, Sliders, Cpu, Play, Calendar, Check, AlertCircle, ArrowRight,
  TrendingDown, ThumbsUp, RefreshCw, ChevronRight, Lock, Mic, MessageSquare
} from 'lucide-react';

interface CoachOfficeProps {
  selectedTeamId: string;
  teams: Record<string, any>;
  coachProfile: HeadCoachProfile;
  setCoachProfile: React.Dispatch<React.SetStateAction<HeadCoachProfile>>;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentWeek: number;
  lastGameResult?: LastGameResult | null;
  initialTab?: 'agenda' | 'skills' | 'press' | 'philosophy' | 'security';
  onLaunchGame: () => void;
}

const CoachOffice: React.FC<CoachOfficeProps> = ({
  selectedTeamId,
  teams,
  coachProfile,
  setCoachProfile,
  allPlayers,
  setAllPlayers,
  currentWeek,
  lastGameResult = null,
  initialTab = 'agenda',
  onLaunchGame
}) => {
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];
  const [activeTab, setActiveTab] = useState<'agenda' | 'skills' | 'press' | 'philosophy' | 'security'>(initialTab);
  const [selectedBranch, setSelectedBranch] = useState<CoachSkillBranch>('Tactician');
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const getBranchIcon = (branch: CoachSkillBranch) => {
    switch (branch) {
      case 'Tactician': return <Zap size={15} />;
      case 'Motivator': return <Flame size={15} />;
      case 'Scout': return <Eye size={15} />;
      case 'Disciplinarian': return <CheckCircle2 size={15} />;
      case 'Strategist': return <Brain size={15} />;
    }
  };

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap size={18} />;
      case 'Target': return <Target size={18} />;
      case 'TrendingUp': return <TrendingUp size={18} />;
      case 'Clock': return <Clock size={18} />;
      case 'Flame': return <Flame size={18} />;
      case 'Award': return <Award size={18} />;
      case 'Shield': return <Shield size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      case 'Eye': return <Eye size={18} />;
      case 'Radio': return <Radio size={18} />;
      case 'Activity': return <Activity size={18} />;
      case 'HeartHandshake': return <HeartHandshake size={18} />;
      case 'CheckCircle2': return <CheckCircle2 size={18} />;
      case 'ShieldAlert': return <ShieldAlert size={18} />;
      case 'Crown': return <Crown size={18} />;
      case 'Brain': return <Brain size={18} />;
      case 'Film': return <Film size={18} />;
      case 'Sliders': return <Sliders size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      default: return <Zap size={18} />;
    }
  };

  // Handle skill purchase
  const handleUnlockSkill = (skill: CoachSkill) => {
    if (coachProfile.coachPoints < skill.cost) {
      setFeedbackNotice(`INSUFFICIENT CP :: Need ${skill.cost - coachProfile.coachPoints} more Coach Points.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    if (coachProfile.unlockedSkillIds.includes(skill.id)) return;

    setCoachProfile(prev => ({
      ...prev,
      coachPoints: prev.coachPoints - skill.cost,
      unlockedSkillIds: [...prev.unlockedSkillIds, skill.id]
    }));

    setFeedbackNotice(`SKILL ACQUIRED :: "${skill.name}" unlocked! Active in all game simulations.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Handle agenda day execution
  const handleExecuteAgendaDay = (dayIdx: number, optionId: string) => {
    const activity = coachProfile.weeklyAgenda[dayIdx];
    if (!activity || activity.isCompleted) return;

    const chosenOption = activity.options.find(o => o.id === optionId) || activity.options[0];

    const newAgenda = coachProfile.weeklyAgenda.map((act, i) => {
      if (i === dayIdx) {
        return {
          ...act,
          isCompleted: true,
          selectedOptionId: chosenOption.id
        };
      }
      return act;
    });

    const newPrep = Math.min(100, coachProfile.opponentPrepScore + chosenOption.prepBonus);
    const newKnowledge = Math.min(100, coachProfile.gameplanKnowledge + 5);
    const earnedCp = 50;

    setCoachProfile(prev => ({
      ...prev,
      weeklyAgenda: newAgenda,
      opponentPrepScore: newPrep,
      gameplanKnowledge: newKnowledge,
      coachPoints: prev.coachPoints + earnedCp,
      totalCpEarned: prev.totalCpEarned + earnedCp,
      completedAgendaDays: prev.completedAgendaDays + 1
    }));

    setFeedbackNotice(`WEEKLY PREP EXECUTED :: ${activity.day} completed (+${chosenOption.prepBonus}% Prep, +${earnedCp} CP)`);
    setTimeout(() => setFeedbackNotice(null), 3500);

    // Auto advance to next pending day if available
    if (dayIdx + 1 < coachProfile.weeklyAgenda.length) {
      setActiveDayIdx(dayIdx + 1);
    }
  };

  // Handle reset weekly agenda for current week
  const handleSimulateAllAgenda = () => {
    const newAgenda = coachProfile.weeklyAgenda.map(act => ({
      ...act,
      isCompleted: true,
      selectedOptionId: act.options[0].id
    }));

    setCoachProfile(prev => ({
      ...prev,
      weeklyAgenda: newAgenda,
      opponentPrepScore: 92,
      gameplanKnowledge: 95,
      coachPoints: prev.coachPoints + 250,
      totalCpEarned: prev.totalCpEarned + 250,
      completedAgendaDays: newAgenda.length
    }));

    setFeedbackNotice(`FULL WEEKLY INSTALL COMPLETE :: Team reached 92% Opponent Preparedness (+250 CP)`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const currentDayActivity = coachProfile.weeklyAgenda[activeDayIdx] || coachProfile.weeklyAgenda[0];
  const allDaysCompleted = coachProfile.weeklyAgenda.every(a => a.isCompleted);

  return (
    <div className="p-8 h-full overflow-y-auto space-y-8 bg-[#05070a] text-slate-100 font-mono">
      {/* Top Banner Notice */}
      {feedbackNotice && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(0,209,255,0.2)] animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* HC09 Head Coach Header */}
      <header className="border-b border-[#1a222e] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#0a0e14] border-2 border-cyan-500/40 p-2 relative flex items-center justify-center shadow-[0_0_25px_rgba(0,209,255,0.2)]">
            <img src={team.logo} alt={team.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 shadow-[0_0_8px_rgba(0,209,255,1)]"></div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white header-font tracking-tighter uppercase italic">
                HEAD COACH OFFICE // HC09
              </h2>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-widest">
                LVL {coachProfile.level} • {coachProfile.jobSecurity}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mono-font mt-1 flex items-center gap-4">
              <span>{team.city} {team.name} ({team.record})</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-bold">WEEK {currentWeek} PREPARATION AGENDA</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{coachProfile.coachPoints} COACH POINTS (CP)</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#0a0e14] border border-[#1a222e] p-1 gap-1">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                activeTab === 'agenda'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={13} />
              WEEKLY AGENDA
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                activeTab === 'skills'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award size={13} />
              SKILL TREE ({coachProfile.unlockedSkillIds.length})
            </button>
            <button
              onClick={() => setActiveTab('press')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 relative ${
                activeTab === 'press'
                  ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic size={13} />
              PRESS CONFERENCE
              {lastGameResult && !lastGameResult.pressConferenceCompleted && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('philosophy')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                activeTab === 'philosophy'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={13} />
              PHILOSOPHY SLIDERS
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield size={13} />
              JOB SECURITY & OWNER
            </button>
          </div>

          <button
            onClick={onLaunchGame}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all"
          >
            <Play size={14} className="fill-current" />
            ENTER GAME DAY
          </button>
        </div>
      </header>

      {/* TAB 1: WEEKLY AGENDA (NFL Head Coach 2009 Signature Gameplay Loop) */}
      {activeTab === 'agenda' && (
        <div className="space-y-8">
          {/* Top Preparedness Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Opponent Preparedness % */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 relative overflow-hidden group">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">OPPONENT PREPAREDNESS</span>
              <div className="text-3xl font-bold text-white header-font italic mt-1 flex items-baseline gap-2">
                <span className={coachProfile.opponentPrepScore >= 80 ? 'text-emerald-400' : coachProfile.opponentPrepScore >= 50 ? 'text-cyan-400' : 'text-amber-400'}>
                  {coachProfile.opponentPrepScore}%
                </span>
                <span className="text-[10px] font-normal text-slate-500 font-mono">
                  {coachProfile.opponentPrepScore >= 80 ? '/// TACTICAL DOMINANCE' : coachProfile.opponentPrepScore >= 50 ? '/// STANDARD READINESS' : '/// UNPREPARED'}
                </span>
              </div>
              <div className="w-full bg-[#05070a] h-1.5 mt-3 border border-[#1a222e] overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${coachProfile.opponentPrepScore >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-cyan-500'}`}
                  style={{ width: `${coachProfile.opponentPrepScore}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Gameplan Knowledge % */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">GAMEPLAN FAMILIARITY</span>
              <div className="text-3xl font-bold text-cyan-400 header-font italic mt-1">
                {coachProfile.gameplanKnowledge}%
              </div>
              <div className="text-[10px] text-slate-500 mt-2">
                Roster scheme alignment & playbook install depth
              </div>
            </div>

            {/* Metric 3: Agenda Progress */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">WEEKLY INSTALL DAYS</span>
              <div className="text-3xl font-bold text-white header-font italic mt-1">
                {coachProfile.weeklyAgenda.filter(a => a.isCompleted).length} / {coachProfile.weeklyAgenda.length}
              </div>
              <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>{allDaysCompleted ? 'READY FOR SUNDAY KICKOFF' : 'PRACTICES REMAINING'}</span>
              </div>
            </div>

            {/* Metric 4: Coach Points Balance */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 relative overflow-hidden">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">COACH POINTS (CP)</span>
              <div className="text-3xl font-bold text-amber-400 header-font italic mt-1">
                {coachProfile.coachPoints}
              </div>
              <div className="text-[10px] text-slate-500 mt-2">
                Earned via practice installs and game execution
              </div>
            </div>
          </div>

          {/* Monday - Saturday Weekly Schedule Calendar Strip */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-[#1a222e] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar size={16} className="text-cyan-400" />
                  THE HEAD COACH WEEKLY WORKFLOW // CALENDAR AGENDA
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Execute daily film study, install meetings, and practices to build opponent preparedness before Sunday kickoff.
                </p>
              </div>

              {!allDaysCompleted && (
                <button
                  onClick={handleSimulateAllAgenda}
                  className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  SIMULATE FULL WEEK'S PRACTICE (+250 CP)
                </button>
              )}
            </div>

            {/* Days Horizontal Timeline */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {coachProfile.weeklyAgenda.map((activity, idx) => {
                const isSelected = activeDayIdx === idx;
                const isDone = activity.isCompleted;

                return (
                  <button
                    key={activity.day}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`p-4 border text-left transition-all relative overflow-hidden flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                        : isDone
                        ? 'bg-[#0d121a] border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-[#05070a] border-[#1a222e] hover:border-slate-700'
                    }`}
                  >
                    {isDone && (
                      <div className="absolute top-2 right-2 text-emerald-400">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-bold tracking-widest uppercase block text-slate-400">
                        {activity.day}
                      </span>
                      <div className="text-xs font-bold text-white mt-1 line-clamp-2">
                        {activity.title}
                      </div>
                    </div>

                    <div className="mt-auto pt-2 border-t border-[#1a222e]/60 flex justify-between items-center text-[9px]">
                      <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {isDone ? 'COMPLETED' : `+${activity.prepPoints}% PREP`}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected Day Workstation */}
            <div className="mt-8 bg-[#05070a] border border-[#1a222e] p-6 relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1a222e] pb-4">
                <div>
                  <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase font-bold">
                    {currentDayActivity.dayLabel}
                  </span>
                  <h4 className="text-xl font-bold text-white header-font italic mt-1">
                    {currentDayActivity.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentDayActivity.subtitle}
                  </p>
                </div>

                {currentDayActivity.isCompleted ? (
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span>SESSION INSTALLED & LOCKED</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={14} />
                    SELECT TACTICAL EMPHASIS
                  </span>
                )}
              </div>

              {/* 3 Tactical Choice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {currentDayActivity.options.map((option) => {
                  const isOptionSelected = currentDayActivity.selectedOptionId === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`p-5 border flex flex-col justify-between transition-all ${
                        isOptionSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : currentDayActivity.isCompleted
                          ? 'bg-[#0a0e14] border-[#1a222e] opacity-50'
                          : 'bg-[#0a0e14] border-[#1a222e] hover:border-cyan-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-sm font-bold text-white tracking-tight">
                            {option.label}
                          </h5>
                          {isOptionSelected && (
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-500 text-black font-bold uppercase">
                              INSTALLED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                          {option.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#1a222e] space-y-3">
                        <div className="bg-[#05070a] p-2.5 border border-cyan-500/20 text-[10px]">
                          <span className="text-slate-500 uppercase tracking-widest block font-bold mb-1">
                            GAMEDAY TACTICAL PERK:
                          </span>
                          <span className="text-cyan-400 font-bold">
                            {option.tacticalPerk}
                          </span>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>PREP BONUS: <strong className="text-emerald-400">+{option.prepBonus}%</strong></span>
                          <span>MORALE: <strong className="text-cyan-400">+{option.moraleBonus}</strong></span>
                        </div>

                        {!currentDayActivity.isCompleted && (
                          <button
                            onClick={() => handleExecuteAgendaDay(activeDayIdx, option.id)}
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(8,145,178,0.3)]"
                          >
                            <Check size={13} />
                            INSTALL DIRECTIVE
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COACH SKILL TREE (5 Branches, Coach Points) */}
      {activeTab === 'skills' && (
        <div className="space-y-8">
          {/* Skill Tree Header Banner */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-white header-font italic uppercase tracking-wider flex items-center gap-2">
                <Award size={20} className="text-amber-400" />
                HEAD COACH TALENT TREE // SKILL POINTS SPECIALIZATION
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlock specialized head coaching perks using Coach Points (CP) earned from wins, rivalry upsets, and weekly agenda installs.
              </p>
            </div>

            <div className="bg-[#05070a] border border-amber-500/30 px-5 py-3 flex items-center gap-4">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">AVAILABLE CP</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">{coachProfile.coachPoints}</span>
            </div>
          </div>

          {/* Branch Switcher Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#1a222e] pb-3">
            {(['Tactician', 'Motivator', 'Scout', 'Disciplinarian', 'Strategist'] as CoachSkillBranch[]).map((branch) => {
              const isSelected = selectedBranch === branch;
              const branchSkills = HC09_COACH_SKILLS.filter(s => s.branch === branch);
              const unlockedInBranch = branchSkills.filter(s => coachProfile.unlockedSkillIds.includes(s.id)).length;

              return (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className={`px-5 py-3 border font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                      : 'bg-[#0a0e14] text-slate-400 border-[#1a222e] hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {getBranchIcon(branch)}
                  <span>{branch}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {unlockedInBranch}/{branchSkills.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skills Grid for Selected Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HC09_COACH_SKILLS.filter(s => s.branch === selectedBranch).map((skill) => {
              const isUnlocked = coachProfile.unlockedSkillIds.includes(skill.id);
              const canAfford = coachProfile.coachPoints >= skill.cost;

              return (
                <div
                  key={skill.id}
                  className={`p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-[#0a0e14] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'bg-[#0a0e14] border-[#1a222e] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 border ${isUnlocked ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                          {getSkillIcon(skill.iconName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white header-font tracking-wide">
                              {skill.name}
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 font-bold uppercase">
                              TIER {skill.tier}
                            </span>
                          </div>
                          <span className="text-[10px] text-cyan-500 font-bold tracking-wider">
                            {skill.branch.toUpperCase()} // SPECIALTY
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          {skill.cost} CP
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {skill.description}
                    </p>

                    <div className="mt-4 p-3 bg-[#05070a] border border-[#1a222e]">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold mb-1">
                        PERK SPECIFICATION:
                      </span>
                      <p className="text-xs text-emerald-400 font-bold leading-snug">
                        {skill.perkDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#1a222e]">
                    {!isUnlocked ? (
                      <button
                        onClick={() => handleUnlockSkill(skill)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]'
                            : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Lock size={13} />
                        UNLOCK WITH {skill.cost} CP
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center py-1">
                        <Check size={12} className="text-emerald-400" />
                        ACTIVE ACROSS ALL SIMULATION PROTOCOLS
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PHILOSOPHY & SLIDERS (Iconic HC09 Strategy Sliders) */}
      {activeTab === 'philosophy' && (
        <div className="space-y-8">
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6">
            <h3 className="text-lg font-bold text-white header-font uppercase tracking-wider italic flex items-center gap-2">
              <Sliders size={18} className="text-cyan-400" />
              OFFENSIVE & DEFENSIVE PHILOSOPHY SLIDERS
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust your team's fundamental tactical identity. These tendencies directly influence in-game play selection and simulated outcome distributions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Offensive Philosophy */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-6">
              <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-[#1a222e] pb-3 flex items-center gap-2">
                <Zap size={14} />
                OFFENSIVE IDENTITY // PLAYBOOK SCHEME
              </h4>

              {/* Slider 1: Run/Pass Ratio */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 uppercase font-bold">RUN / PASS RATIO</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {100 - coachProfile.philosophy.runPassRatio}% RUN / {coachProfile.philosophy.runPassRatio}% PASS
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={coachProfile.philosophy.runPassRatio}
                  onChange={(e) => setCoachProfile(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, runPassRatio: parseInt(e.target.value) }
                  }))}
                  className="w-full h-1.5 bg-slate-800 rounded-none appearance-none accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase">
                  <span>Power Ground & Pound</span>
                  <span>Balanced Pro Style</span>
                  <span>Air Coryell / Spread</span>
                </div>
              </div>

              {/* Slider 2: 4th Down Aggressiveness */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 uppercase font-bold">4TH DOWN AGGRESSIVENESS</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {coachProfile.philosophy.fourthDownAggressiveness}% (ANALYTICS INDEX)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={coachProfile.philosophy.fourthDownAggressiveness}
                  onChange={(e) => setCoachProfile(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, fourthDownAggressiveness: parseInt(e.target.value) }
                  }))}
                  className="w-full h-1.5 bg-slate-800 rounded-none appearance-none accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase">
                  <span>Conservative Field Position</span>
                  <span>Balanced Decision-Making</span>
                  <span>Relentless Go-For-It</span>
                </div>
              </div>

              {/* Scheme Dropdowns */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-2">
                    OFFENSIVE SCHEME
                  </label>
                  <select
                    value={coachProfile.philosophy.offensiveScheme}
                    onChange={(e) => setCoachProfile(prev => ({
                      ...prev,
                      philosophy: { ...prev.philosophy, offensiveScheme: e.target.value as any }
                    }))}
                    className="w-full bg-[#05070a] border border-[#1a222e] text-xs text-white p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="West Coast">West Coast (Quick Short Rhythm)</option>
                    <option value="Air Coryell">Air Coryell (Vertical Deep Shots)</option>
                    <option value="Smashmouth Power">Smashmouth Power (Inside Zone)</option>
                    <option value="Spread Option">Spread Option (Read Option RPO)</option>
                    <option value="Pistol">Pistol (Downhill Play-Action)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-2">
                    PASS DEPTH PREFERENCE
                  </label>
                  <select
                    value={coachProfile.philosophy.passDepth}
                    onChange={(e) => setCoachProfile(prev => ({
                      ...prev,
                      philosophy: { ...prev.philosophy, passDepth: e.target.value as any }
                    }))}
                    className="w-full bg-[#05070a] border border-[#1a222e] text-xs text-white p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Short">Short & Slants (High Completion %)</option>
                    <option value="Medium">Intermediate Crossers (Chains Mover)</option>
                    <option value="Deep">Deep Posts & Go-Routes (Explosive)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Defensive Philosophy */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-6">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest border-b border-[#1a222e] pb-3 flex items-center gap-2">
                <Shield size={14} />
                DEFENSIVE IDENTITY // PRESSURE PACKAGES
              </h4>

              {/* Slider 3: Blitz Frequency */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 uppercase font-bold">BLITZ FREQUENCY</span>
                  <span className="font-bold text-red-400 font-mono">
                    {coachProfile.philosophy.blitzFrequency}% OF ALL DOWNS
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="75"
                  value={coachProfile.philosophy.blitzFrequency}
                  onChange={(e) => setCoachProfile(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, blitzFrequency: parseInt(e.target.value) }
                  }))}
                  className="w-full h-1.5 bg-slate-800 rounded-none appearance-none accent-red-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase">
                  <span>Rush 4 Drop 7 (Tampa 2)</span>
                  <span>Zone Blitz (35%)</span>
                  <span>All-Out Cover 0 Blitz</span>
                </div>
              </div>

              {/* Slider 4: Fatigue Sub Threshold */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 uppercase font-bold">ROTATION FATIGUE THRESHOLD</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    SUB AT {coachProfile.philosophy.playerRotationFatigueThreshold}% STAMINA
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="90"
                  value={coachProfile.philosophy.playerRotationFatigueThreshold}
                  onChange={(e) => setCoachProfile(prev => ({
                    ...prev,
                    philosophy: { ...prev.philosophy, playerRotationFatigueThreshold: parseInt(e.target.value) }
                  }))}
                  className="w-full h-1.5 bg-slate-800 rounded-none appearance-none accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase">
                  <span>Workhorse (Ride Starters)</span>
                  <span>Standard NFL Rotation</span>
                  <span>Fresh Legs Committee</span>
                </div>
              </div>

              {/* Defensive Scheme Dropdowns */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-2">
                    DEFENSIVE SCHEME
                  </label>
                  <select
                    value={coachProfile.philosophy.defensiveScheme}
                    onChange={(e) => setCoachProfile(prev => ({
                      ...prev,
                      philosophy: { ...prev.philosophy, defensiveScheme: e.target.value as any }
                    }))}
                    className="w-full bg-[#05070a] border border-[#1a222e] text-xs text-white p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Cover 3 Press">Cover 3 Press (Seattle Legion)</option>
                    <option value="Base 4-3">Base 4-3 (Balanced Gap Control)</option>
                    <option value="3-4 Under">3-4 Under (Two-Gap Standup Rushers)</option>
                    <option value="Cover 2 Tampa">Cover 2 Tampa (Deep Middle LB Drop)</option>
                    <option value="Aggressive 46">Aggressive 46 (8-in-the-Box)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold mb-2">
                    OPERATIONAL TEMPO
                  </label>
                  <select
                    value={coachProfile.philosophy.offensiveTempo}
                    onChange={(e) => setCoachProfile(prev => ({
                      ...prev,
                      philosophy: { ...prev.philosophy, offensiveTempo: e.target.value as any }
                    }))}
                    className="w-full bg-[#05070a] border border-[#1a222e] text-xs text-white p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Normal">Normal Tempo (25s snap cadence)</option>
                    <option value="Chew Clock">Chew Clock (Bleed play clock to 0:02)</option>
                    <option value="No Huddle">No Huddle (Rapid gas-pedal attack)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRESS CONFERENCE (Post-Game & Weekly Media Room) */}
      {activeTab === 'press' && (
        <div className="space-y-6">
          <PressConferenceView
            selectedTeamId={selectedTeamId}
            teams={teams}
            coachProfile={coachProfile}
            setCoachProfile={setCoachProfile}
            allPlayers={allPlayers}
            setAllPlayers={setAllPlayers}
            currentWeek={currentWeek}
            lastGameResult={lastGameResult}
            onFinished={() => setActiveTab('agenda')}
          />
        </div>
      )}

      {/* TAB 4: JOB SECURITY & FRONT OFFICE PRESSURE */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Owner Trust Card */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">FRANCHISE OWNER TRUST</span>
              <div className="text-4xl font-bold text-white header-font italic">
                {coachProfile.ownerApproval}%
              </div>
              <div className="w-full bg-[#05070a] h-2 border border-[#1a222e]">
                <div 
                  className={`h-full ${coachProfile.ownerApproval >= 75 ? 'bg-emerald-500' : coachProfile.ownerApproval >= 50 ? 'bg-cyan-500' : 'bg-red-500'}`}
                  style={{ width: `${coachProfile.ownerApproval}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Chairman mandate: Deliver a playoff berth and manage salary cap discipline.
              </p>
            </div>

            {/* Fan Approval Card */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">FAN & MEDIA APPROVAL</span>
              <div className="text-4xl font-bold text-cyan-400 header-font italic">
                {coachProfile.fanApproval}%
              </div>
              <div className="w-full bg-[#05070a] h-2 border border-[#1a222e]">
                <div 
                  className={`h-full ${coachProfile.fanApproval >= 75 ? 'bg-cyan-400' : 'bg-amber-500'}`}
                  style={{ width: `${coachProfile.fanApproval}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Home crowd enthusiasm is electric; fan base trusts aggressive play-calling.
              </p>
            </div>

            {/* Seat Temperature Status */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">HOT SEAT STATUS</span>
              <div className="text-2xl font-bold text-emerald-400 header-font uppercase italic tracking-wide">
                {coachProfile.jobSecurity}
              </div>
              <div className="p-3 bg-[#05070a] border border-emerald-500/20 text-xs text-slate-300 leading-snug">
                Contract status safe through multi-season cycle. Front office fully endorses your long-term scheme blueprint.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachOffice;
