import React, { useState, useEffect } from 'react';
import { 
  HeadCoachProfile, Player, LastGameResult, PressConferenceQuestion, 
  PressConferenceAnswer, PressConferenceRecord, Position 
} from '../types';
import { generatePressConferenceQuestions, POST_GAME_PRESS_QUESTIONS } from '../data/hc09Data';
import { TEAMS_DB } from '../constants';
import { 
  MessageSquare, Radio, Sparkles, TrendingUp, TrendingDown, Users, 
  Award, HeartHandshake, Shield, CheckCircle2, AlertCircle, Newspaper, 
  Camera, Mic, Volume2, RotateCcw, ChevronRight, Check, Flame, Trophy,
  ThumbsUp, ThumbsDown, UserCheck
} from 'lucide-react';

interface PressConferenceViewProps {
  selectedTeamId: string;
  teams: Record<string, any>;
  coachProfile: HeadCoachProfile;
  setCoachProfile: React.Dispatch<React.SetStateAction<HeadCoachProfile>>;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentWeek: number;
  lastGameResult: LastGameResult | null;
  onFinished?: () => void;
}

export const PressConferenceView: React.FC<PressConferenceViewProps> = ({
  selectedTeamId,
  teams,
  coachProfile,
  setCoachProfile,
  allPlayers,
  setAllPlayers,
  currentWeek,
  lastGameResult,
  onFinished
}) => {
  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId] || { name: 'Jets', city: 'NY', primaryColor: '#125740' };
  const teamName = `${team.city} ${team.name}`;

  // Fallback game context if no game played yet
  const activeGame: LastGameResult = lastGameResult || {
    week: currentWeek,
    opponentId: selectedTeamId === 'NYJ' ? 'NE' : 'KC',
    opponentName: selectedTeamId === 'NYJ' ? 'New England Patriots' : 'Kansas City Chiefs',
    userScore: 27,
    opponentScore: 24,
    userWon: true,
    isHome: true,
    gameNarrative: 'Thrilling fourth-quarter comeback victory sealed by a clutch goal-line defensive stop.'
  };

  const [questions, setQuestions] = useState<PressConferenceQuestion[]>(() => 
    generatePressConferenceQuestions(activeGame, teamName, activeGame.opponentName)
  );
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<{
    question: string;
    reporter: string;
    outlet: string;
    answerText: string;
    sentiment?: string;
    headline: string;
    fanDelta: number;
    moraleDelta: number;
    ownerDelta: number;
  }[]>([]);

  // Flash effect state
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [latestHeadline, setLatestHeadline] = useState<string | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<{
    fanDelta: number;
    moraleDelta: number;
    ownerDelta: number;
    journalistReaction?: string;
  } | null>(null);

  // Re-generate questions if game changes
  useEffect(() => {
    setQuestions(generatePressConferenceQuestions(activeGame, teamName, activeGame.opponentName));
    setCurrentQIdx(0);
    setSessionCompleted(false);
    setTranscript([]);
    setLatestHeadline(null);
    setLatestFeedback(null);
  }, [lastGameResult?.week, selectedTeamId]);

  const currentQuestion = questions[currentQIdx] || questions[0];

  const triggerCameraFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
  };

  const handleSelectAnswer = (answer: PressConferenceAnswer) => {
    triggerCameraFlash();
    setLatestHeadline(answer.headline);
    setLatestFeedback({
      fanDelta: answer.fanDelta,
      moraleDelta: answer.lockerRoomDelta,
      ownerDelta: answer.ownerDelta,
      journalistReaction: answer.journalistReaction
    });

    // 1. Update Head Coach Profile (Fan Support Rating, Owner Approval, Coach Points)
    setCoachProfile(prev => {
      const newFanApproval = Math.min(100, Math.max(0, prev.fanApproval + answer.fanDelta));
      const newOwnerApproval = Math.min(100, Math.max(0, prev.ownerApproval + answer.ownerDelta));
      return {
        ...prev,
        fanApproval: newFanApproval,
        ownerApproval: newOwnerApproval,
        coachPoints: prev.coachPoints + 25,
        totalCpEarned: prev.totalCpEarned + 25
      };
    });

    // 2. Update Roster Morale (Team-wide or targeted unit)
    setAllPlayers(prevPlayers => {
      return prevPlayers.map(p => {
        if (p.teamId !== selectedTeamId) return p;

        let applies = false;
        if (!answer.targetUnit || answer.targetUnit === 'ALL') {
          applies = true;
        } else if (answer.targetUnit === 'QB' && p.position === Position.QB) {
          applies = true;
        } else if (answer.targetUnit === 'OFFENSE' && [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL].includes(p.position)) {
          applies = true;
        } else if (answer.targetUnit === 'DEFENSE' && [Position.DL, Position.LB, Position.CB, Position.S].includes(p.position)) {
          applies = true;
        } else if (answer.targetUnit === 'LINE' && [Position.OL, Position.DL].includes(p.position)) {
          applies = true;
        }

        if (applies) {
          const delta = answer.lockerRoomDelta;
          const updatedMorale = Math.min(100, Math.max(20, p.morale + delta));
          const newFactor = {
            id: `press_${Date.now()}_${p.id}`,
            label: delta >= 0 ? 'Coach praise in press conference' : 'Media pressure / Coach critique',
            impact: delta,
            type: delta >= 0 ? 'positive' as const : 'negative' as const,
            description: `Coach statement: "${answer.headline}"`
          };
          return {
            ...p,
            morale: updatedMorale,
            moraleFactors: [newFactor, ...(p.moraleFactors || []).slice(0, 4)]
          };
        }
        return p;
      });
    });

    // Record transcript entry
    const entry = {
      question: currentQuestion.question,
      reporter: currentQuestion.reporter,
      outlet: currentQuestion.outlet,
      answerText: answer.text,
      sentiment: answer.sentiment,
      headline: answer.headline,
      fanDelta: answer.fanDelta,
      moraleDelta: answer.lockerRoomDelta,
      ownerDelta: answer.ownerDelta
    };
    const newTranscript = [...transcript, entry];
    setTranscript(newTranscript);

    // Advance or finish
    if (currentQIdx + 1 < questions.length) {
      setTimeout(() => {
        setCurrentQIdx(prev => prev + 1);
        setLatestHeadline(null);
        setLatestFeedback(null);
      }, 1800);
    } else {
      setTimeout(() => {
        setSessionCompleted(true);
        // Bonus CP for finishing complete press conference
        setCoachProfile(prev => {
          const totalFan = newTranscript.reduce((acc, t) => acc + t.fanDelta, 0);
          const totalMorale = newTranscript.reduce((acc, t) => acc + t.moraleDelta, 0);
          const totalOwner = newTranscript.reduce((acc, t) => acc + t.ownerDelta, 0);
          const grade = totalFan + totalMorale >= 15 ? 'A+' : totalFan + totalMorale >= 8 ? 'A' : totalFan + totalMorale >= 0 ? 'B' : 'C';

          const record: PressConferenceRecord = {
            id: `pc_${Date.now()}`,
            week: activeGame.week,
            date: new Date().toLocaleDateString(),
            opponent: activeGame.opponentName,
            resultTitle: `${activeGame.userWon ? 'VICTORY' : 'DEFEAT'} vs ${activeGame.opponentName}`,
            score: `${teamName} ${activeGame.userScore} - ${activeGame.opponentScore} ${activeGame.opponentName}`,
            headline: answer.headline,
            overallGrade: grade as any,
            totalFanDelta: totalFan,
            totalMoraleDelta: totalMorale,
            totalOwnerDelta: totalOwner,
            transcript: newTranscript
          };

          return {
            ...prev,
            coachPoints: prev.coachPoints + 75,
            totalCpEarned: prev.totalCpEarned + 75,
            lastPressConferenceWeek: activeGame.week,
            pressHistory: [record, ...(prev.pressHistory || []).slice(0, 9)]
          };
        });
      }, 1600);
    }
  };

  const handleRestart = () => {
    setQuestions(generatePressConferenceQuestions(activeGame, teamName, activeGame.opponentName));
    setCurrentQIdx(0);
    setSessionCompleted(false);
    setTranscript([]);
    setLatestHeadline(null);
    setLatestFeedback(null);
  };

  return (
    <div className="space-y-6 font-mono text-slate-200 relative">
      {/* Camera Flash Screen Overlay */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white/70 pointer-events-none transition-opacity duration-200" />
      )}

      {/* TOP PODIUM HEADER & BANNER */}
      <div className="bg-[#0a0e14] border-2 border-purple-500/40 p-6 relative overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        {/* Neon Purple/Cyan Accent Strip */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-cyan-400 to-amber-400" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-sm">
              <Mic size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white font-bold tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  LIVE ON AIR // MEDIA ROOM
                </span>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                  NFL HEAD COACH 2009 PRESS DESK
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white header-font uppercase italic tracking-tight">
                {teamName} // POST-GAME PRESS CONFERENCE
              </h2>
            </div>
          </div>

          {/* Rating Gauges: Fan Support & Morale */}
          <div className="flex items-center gap-4 bg-[#05070a] border border-[#1a222e] px-4 py-2.5">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                FAN SUPPORT RATING
              </span>
              <div className="text-xl font-bold text-cyan-400 header-font flex items-center gap-1.5">
                <span>{coachProfile.fanApproval}%</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {coachProfile.fanApproval >= 80 ? '/// FANATICAL' : coachProfile.fanApproval >= 50 ? '/// SUPPORTIVE' : '/// RESTLESS'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-[#1a222e]" />

            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                OWNER TRUST
              </span>
              <div className="text-xl font-bold text-emerald-400 header-font flex items-center gap-1.5">
                <span>{coachProfile.ownerApproval}%</span>
              </div>
            </div>

            <div className="h-8 w-px bg-[#1a222e]" />

            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                COACH POINTS
              </span>
              <div className="text-xl font-bold text-amber-400 header-font">
                {coachProfile.coachPoints} CP
              </div>
            </div>
          </div>
        </div>

        {/* Game Context Strip */}
        <div className="mt-5 pt-4 border-t border-[#1a222e] flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 bg-[#05070a] border border-cyan-500/40 text-cyan-400 font-bold uppercase">
              WEEK {activeGame.week} {activeGame.isHome ? 'HOME' : 'AWAY'}
            </span>
            <span className="text-white font-bold flex items-center gap-2">
              <span className={activeGame.userWon ? 'text-emerald-400' : 'text-red-400'}>
                {activeGame.userWon ? 'FINAL [VICTORY]' : 'FINAL [DEFEAT]'}
              </span>
              <span>{teamName} {activeGame.userScore} - {activeGame.opponentScore} {activeGame.opponentName}</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            "{activeGame.gameNarrative}"
          </div>
        </div>
      </div>

      {/* MAIN PODIUM INTERACTIVE STAGE */}
      {!sessionCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: PODIUM & QUESTION/ANSWER INTERACTION */}
          <div className="lg:col-span-2 space-y-4">
            {/* Press Room Microphone Banner */}
            <div className="bg-[#05070a] border border-[#1a222e] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">QUESTION:</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold text-xs">
                  {currentQIdx + 1} OF {questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  FLASHBULBS READY:
                </span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
              </div>
            </div>

            {/* Reporter Card & Direct Question */}
            <div className="bg-[#0a0e14] border-2 border-purple-500/30 p-6 relative shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1a222e] pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#05070a] border border-purple-500/50 flex items-center justify-center font-bold text-white text-sm">
                    {currentQuestion.reporter.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">
                      {currentQuestion.reporter}
                    </div>
                    <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                      {currentQuestion.outlet} // ACCREDITED MEDIA
                    </div>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold uppercase">
                  {currentQuestion.category || 'MEDIA QUESTION'}
                </span>
              </div>

              {/* Spoken Question */}
              <div className="p-4 bg-[#05070a] border-l-4 border-purple-500 text-sm md:text-base text-slate-100 font-medium italic leading-relaxed">
                "{currentQuestion.question}"
              </div>
            </div>

            {/* Instant Impact Feedback Banner */}
            {latestHeadline && latestFeedback && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/60 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[10px] text-purple-300 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  STATEMENT DELIVERED TO PRESS // IMMEDIATE REACTION:
                </div>
                <div className="text-sm font-bold text-white header-font italic">
                  "{latestHeadline}"
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    FAN SUPPORT: <strong className={latestFeedback.fanDelta >= 0 ? 'text-cyan-400' : 'text-red-400'}>
                      {latestFeedback.fanDelta >= 0 ? `+${latestFeedback.fanDelta}%` : `${latestFeedback.fanDelta}%`}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1">
                    LOCKER ROOM: <strong className={latestFeedback.moraleDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {latestFeedback.moraleDelta >= 0 ? `+${latestFeedback.moraleDelta} Morale` : `${latestFeedback.moraleDelta} Morale`}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1">
                    OWNER TRUST: <strong className={latestFeedback.ownerDelta >= 0 ? 'text-amber-400' : 'text-red-400'}>
                      {latestFeedback.ownerDelta >= 0 ? `+${latestFeedback.ownerDelta}%` : `${latestFeedback.ownerDelta}%`}
                    </strong>
                  </span>
                </div>
                {latestFeedback.journalistReaction && (
                  <p className="text-[11px] text-slate-300 mt-2 italic border-t border-purple-500/30 pt-1.5">
                    "{latestFeedback.journalistReaction}"
                  </p>
                )}
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                DELIVER COACH STATEMENT (AFFECTS FAN SUPPORT & PLAYER MORALE):
              </span>

              {currentQuestion.answers.map((ans, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(ans)}
                  className="w-full p-4 bg-[#0a0e14] border border-[#1a222e] hover:border-purple-400 hover:bg-purple-500/5 text-left transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs md:text-sm text-slate-200 group-hover:text-white leading-relaxed font-mono">
                      "{ans.text}"
                    </p>
                    <span className="text-[9px] px-2 py-0.5 bg-[#05070a] border border-[#1a222e] group-hover:border-purple-500/40 text-purple-400 font-bold uppercase tracking-wider shrink-0">
                      {ans.sentiment || 'STATEMENT'}
                    </span>
                  </div>

                  {/* Projected Metric Deltas */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-[#1a222e] text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>FANS:</span>
                      <strong className={ans.fanDelta >= 0 ? 'text-cyan-400 font-bold' : 'text-red-400 font-bold'}>
                        {ans.fanDelta >= 0 ? `+${ans.fanDelta}%` : `${ans.fanDelta}%`}
                      </strong>
                    </span>

                    <span className="flex items-center gap-1">
                      <span>MORALE:</span>
                      <strong className={ans.lockerRoomDelta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {ans.lockerRoomDelta >= 0 ? `+${ans.lockerRoomDelta}` : ans.lockerRoomDelta}
                      </strong>
                      <span className="text-[9px] text-slate-500">({ans.targetUnit || 'ALL'})</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <span>OWNER:</span>
                      <strong className={ans.ownerDelta >= 0 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                        {ans.ownerDelta >= 0 ? `+${ans.ownerDelta}%` : `${ans.ownerDelta}%`}
                      </strong>
                    </span>

                    <span className="ml-auto text-[9px] text-slate-500 group-hover:text-purple-300 font-bold">
                      HEADLINE: "{ans.headline.slice(0, 32)}..."
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT COL: MEDIA PODIUM VISUALIZER & ROSTER MORALE PULSE */}
          <div className="space-y-4">
            {/* The Podium Mic Station */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] text-slate-600 uppercase font-bold tracking-widest">
                PRESS DESK
              </div>

              {/* Team Mic Flag Logos */}
              <div className="flex justify-center items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-red-600 text-white font-bold text-[9px] tracking-widest uppercase">
                  ESPN
                </span>
                <span className="px-2 py-1 bg-blue-600 text-white font-bold text-[9px] tracking-widest uppercase">
                  NFL NET
                </span>
                <span className="px-2 py-1 bg-slate-800 text-white font-bold text-[9px] tracking-widest uppercase">
                  THE ATHLETIC
                </span>
                <span className="px-2 py-1 bg-amber-600 text-white font-bold text-[9px] tracking-widest uppercase">
                  LOCAL BEAT
                </span>
              </div>

              <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 border-2 border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-3">
                <Mic size={30} />
              </div>

              <div className="text-sm font-bold text-white header-font uppercase">
                HEAD COACH PODIUM
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Answering inquiries from beat reporters & national analysts.
              </div>

              <div className="mt-4 pt-3 border-t border-[#1a222e] text-[10px] text-slate-500">
                Statements immediately alter public sentiment and player locker room composure.
              </div>
            </div>

            {/* Team Roster Morale Tracker */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-[#1a222e] pb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-400" />
                  TEAM MORALE WATCHLIST
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  AVG MORALE: {Math.round(allPlayers.filter(p => p.teamId === selectedTeamId).reduce((a, b) => a + b.morale, 0) / Math.max(1, allPlayers.filter(p => p.teamId === selectedTeamId).length))}%
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {allPlayers
                  .filter(p => p.teamId === selectedTeamId)
                  .sort((a, b) => b.overall - a.overall)
                  .slice(0, 6)
                  .map(player => (
                    <div 
                      key={player.id}
                      className="p-2 bg-[#05070a] border border-[#1a222e] flex justify-between items-center"
                    >
                      <div>
                        <div className="text-white font-bold">{player.name}</div>
                        <div className="text-[10px] text-slate-500">{player.position} // OVR {player.overall}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold font-mono ${player.morale >= 85 ? 'text-emerald-400' : player.morale >= 70 ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {player.morale}%
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {player.morale >= 85 ? 'PUMPED' : player.morale >= 70 ? 'COMPOSED' : 'DISCONTENT'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MORNING NEWSPAPER / FRONT PAGE POST-GAME WRAPUP */
        <div className="bg-[#0a0e14] border-2 border-cyan-500/40 p-8 shadow-[0_0_50px_rgba(0,209,255,0.2)] space-y-6">
          {/* Newspaper Masthead */}
          <div className="text-center border-b-2 border-slate-700 pb-5">
            <div className="text-[11px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-1">
              THE DAILY GRIDIRON CHRONICLE // METRO SPORTS FINAL
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white header-font tracking-tighter uppercase italic">
              {teamName.toUpperCase()} POST-GAME EXTRA
            </h1>
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-b border-slate-800 py-1 mt-2 uppercase font-mono">
              <span>VOL. 52 NO. 18</span>
              <span>SPECIAL POST-GAME MEDIA EDITION</span>
              <span>PRICE $1.50</span>
            </div>
          </div>

          {/* Big Banner Headline */}
          <div className="p-6 bg-[#05070a] border border-cyan-500/40 text-center space-y-2">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
              HEAD COACH POST-GAME PODIUM STATEMENT:
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-white header-font uppercase italic tracking-tight text-cyan-300">
              "{transcript[transcript.length - 1]?.headline || 'COACH SPEAKS ON RECORD'}"
            </div>
          </div>

          {/* Press Conference Ratings Grade */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#05070a] border border-[#1a222e]">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                MEDIA GRADE
              </span>
              <div className="text-3xl font-bold text-emerald-400 header-font mt-1">
                A-
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Poised and commanding podium presence
              </div>
            </div>

            <div className="p-4 bg-[#05070a] border border-[#1a222e]">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                FAN SUPPORT SHIFT
              </span>
              <div className="text-3xl font-bold text-cyan-400 header-font mt-1">
                +{transcript.reduce((a, b) => a + b.fanDelta, 0)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Current Fan Loyalty: {coachProfile.fanApproval}%
              </div>
            </div>

            <div className="p-4 bg-[#05070a] border border-[#1a222e]">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                ROSTER MORALE SHIFT
              </span>
              <div className="text-3xl font-bold text-emerald-400 header-font mt-1">
                +{transcript.reduce((a, b) => a + b.moraleDelta, 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Locker room rallied behind coach
              </div>
            </div>

            <div className="p-4 bg-[#05070a] border border-[#1a222e]">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                COACH POINTS EARNED
              </span>
              <div className="text-3xl font-bold text-amber-400 header-font mt-1">
                +100 CP
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Ready to spend on skill tree
              </div>
            </div>
          </div>

          {/* Transcript Log */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Newspaper size={14} className="text-cyan-400" />
              OFFICIAL PRESS CONFERENCE TRANSCRIPT
            </h4>

            <div className="space-y-3">
              {transcript.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#05070a] border border-[#1a222e] text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-400 font-bold">
                    <span className="text-purple-400">{item.reporter} ({item.outlet}):</span>
                    <span className="text-slate-300 italic">"{item.question}"</span>
                  </div>
                  <div className="text-white font-mono pl-3 border-l-2 border-purple-500">
                    "{item.answerText}"
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500 pl-3">
                    <span>FAN IMPACT: <strong className="text-cyan-400">+{item.fanDelta}%</strong></span>
                    <span>MORALE IMPACT: <strong className="text-emerald-400">+{item.moraleDelta}</strong></span>
                    <span>OWNER IMPACT: <strong className="text-amber-400">+{item.ownerDelta}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-[#1a222e]">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-[#0d121a] border border-[#1a222e] hover:border-slate-500 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <RotateCcw size={14} />
              HOLD ANOTHER PRESS BRIEFING
            </button>

            {onFinished && (
              <button
                onClick={onFinished}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all ml-auto"
              >
                <Check size={14} />
                PROCEED TO COACHING OFFICE
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAST PRESS CONFERENCES ACCORDION / ARCHIVE */}
      {coachProfile.pressHistory && coachProfile.pressHistory.length > 0 && (
        <div className="bg-[#0a0e14] border border-[#1a222e] p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-[#1a222e] pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award size={14} className="text-amber-400" />
              SEASON PRESS CONFERENCE ARCHIVES ({coachProfile.pressHistory.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {coachProfile.pressHistory.map((rec) => (
              <div key={rec.id} className="p-3 bg-[#05070a] border border-[#1a222e] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span>WEEK {rec.week} // {rec.date}</span>
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 font-bold">
                      GRADE: {rec.overallGrade}
                    </span>
                  </div>
                  <div className="text-white font-bold">{rec.resultTitle}</div>
                  <div className="text-cyan-400 font-mono text-[11px] mt-1 italic">
                    "{rec.headline}"
                  </div>
                </div>

                <div className="flex gap-3 text-[10px] text-slate-500 mt-3 pt-2 border-t border-[#1a222e]">
                  <span>FANS: <strong className="text-cyan-400">+{rec.totalFanDelta}%</strong></span>
                  <span>MORALE: <strong className="text-emerald-400">+{rec.totalMoraleDelta}</strong></span>
                  <span>OWNER: <strong className="text-amber-400">+{rec.totalOwnerDelta}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PressConferenceView;
