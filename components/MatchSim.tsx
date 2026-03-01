import React, { useState, useRef } from 'react';
import { OFFENSIVE_PLAYS, TEAMS_DB } from '../constants';
import { Play, GameEvent, GamePlanSettings, Player, ScheduleGame } from '../types';
import { Play as PlayIcon, ShieldAlert, Wind, ChevronUp, ChevronDown, Trophy } from 'lucide-react';

interface MatchSimProps {
  players: Player[];
  week: number;
  schedule: ScheduleGame[];
  gamePlan: GamePlanSettings;
  onGameOver: (userScore: number, opponentScore: number) => void;
}

interface GameStateType {
  down: number;
  distance: number;
  ballOn: number; // 0-100 from user's perspective (100 = TD)
  quarter: number;
  timeSeconds: number;
  homeScore: number;
  awayScore: number;
  possession: 'HOME' | 'AWAY';
  isGameOver: boolean;
}

const fmt = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ballDisplay = (ballOn: number, possession: 'HOME' | 'AWAY') => {
  if (possession === 'AWAY') return 'OPP DRIVE';
  return ballOn <= 50 ? `OWN ${ballOn}` : `OPP ${100 - ballOn}`;
};

const MatchSim: React.FC<MatchSimProps> = ({ players, week, schedule, gamePlan, onGameOver }) => {
  const nextGame = schedule.find(g => g.week === week && !g.result);
  const oppId = nextGame?.opponentId ?? 'KC';
  const oppTeam = TEAMS_DB[oppId] as any;

  const [gameState, setGameState] = useState<GameStateType>({
    down: 1,
    distance: 10,
    ballOn: 25,
    quarter: 1,
    timeSeconds: 900,
    homeScore: 0,
    awayScore: 0,
    possession: 'HOME',
    isGameOver: false,
  });

  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isOpponentDriving, setIsOpponentDriving] = useState(false);
  const [winProb, setWinProb] = useState(50);
  const [playHistory, setPlayHistory] = useState<(GameEvent & { quarter: number; time: string })[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gameOverFired = useRef(false);

  // Opponent auto-drive
  const simulateOpponentDrive = (currentState: GameStateType) => {
    setIsOpponentDriving(true);

    setTimeout(() => {
      // Base scoring chance modified by game plan
      const oppScoreChance = gamePlan.focus === 'DEFENSE' ? 0.25 : 0.35;
      const oppTurnoverChance = 0.20;

      const roll = Math.random();
      let event: GameEvent & { quarter: number; time: string };

      if (roll < oppScoreChance) {
        event = {
          description: `${oppTeam.city} SCORES! Drive ends in a touchdown.`,
          yardage: 0, isScore: true, type: 'Pass',
          quarter: currentState.quarter,
          time: fmt(currentState.timeSeconds),
        };
      } else if (roll < oppScoreChance + oppTurnoverChance) {
        event = {
          description: 'TURNOVER! Our defense forces a fumble — we take over!',
          yardage: 0, isScore: false, type: 'Turnover',
          quarter: currentState.quarter,
          time: fmt(currentState.timeSeconds),
        };
      } else {
        event = {
          description: `${oppTeam.city} goes 3-and-out. Punt. Taking over at our 22.`,
          yardage: 0, isScore: false, type: 'Special',
          quarter: currentState.quarter,
          time: fmt(currentState.timeSeconds),
        };
      }

      setPlayHistory(prev => [event, ...prev]);
      setLastEvent(event);

      setGameState(prev => {
        const driveTime = Math.floor(Math.random() * 90) + 45;
        let timeLeft = prev.timeSeconds - driveTime;
        let newQuarter = prev.quarter;

        if (timeLeft <= 0) {
          newQuarter = prev.quarter + 1;
          timeLeft = 900;
        }

        const newState: GameStateType = {
          ...prev,
          awayScore: event.isScore ? prev.awayScore + 7 : prev.awayScore,
          ballOn: 22,
          down: 1,
          distance: 10,
          possession: 'HOME',
          timeSeconds: timeLeft,
          quarter: newQuarter,
          isGameOver: newQuarter > 4,
        };

        if (newState.isGameOver && !gameOverFired.current) {
          gameOverFired.current = true;
          setTimeout(() => onGameOver(newState.homeScore, newState.awayScore), 500);
        }

        return newState;
      });

      setIsOpponentDriving(false);
    }, 2000);
  };

  const calculateOutcome = (play: Play, currentBallOn: number): GameEvent => {
    const focusBonus = gamePlan.focus === 'OFFENSE' ? 0.08 : 0;
    const adjustedSuccessRate = Math.min(0.88, play.successRate + focusBonus);

    const roll = Math.random();
    let yardage = 0;
    let description = '';
    let isScore = false;
    let type: GameEvent['type'] = play.type;

    if (roll < 0.05) {
      type = 'Turnover';
      description = `INTERCEPTED on the ${play.name}! Ball goes to ${oppTeam.city}.`;
      yardage = 0;
    } else if (roll < adjustedSuccessRate) {
      const bigPlay = Math.random() < play.reward / 20;
      const baseGain = Math.floor(Math.random() * 8) + 2;
      yardage = bigPlay ? baseGain + Math.floor(Math.random() * 20) + 10 : baseGain;
      description = `${play.type === 'Pass' ? 'Complete' : 'Gain'} for ${yardage} yards on ${play.name}.`;
    } else {
      const sack = play.type === 'Pass' && Math.random() < 0.2;
      yardage = sack ? -Math.floor(Math.random() * 8) : 0;
      description = sack
        ? `SACKED! Loss of ${Math.abs(yardage)} on ${play.name}.`
        : play.type === 'Run'
        ? 'Stuffed at the line. No gain.'
        : 'Incomplete pass. Clock stops.';
    }

    if (!isScore && type !== 'Turnover' && currentBallOn + yardage >= 100) {
      isScore = true;
      yardage = 100 - currentBallOn;
      description = `TOUCHDOWN! ${play.name} results in 6!`;
    }

    return { description, yardage, isScore, type };
  };

  const handlePlayCall = (play: Play) => {
    if (isSimulating || isOpponentDriving || gameState.possession !== 'HOME' || gameState.isGameOver) return;
    setIsSimulating(true);

    setTimeout(() => {
      const outcome = calculateOutcome(play, gameState.ballOn);

      const playTime = Math.floor(Math.random() * 20) + 25;
      let shouldSwitch = false;
      let nextStateRef: GameStateType = gameState;

      setGameState(prev => {
        let timeLeft = prev.timeSeconds - playTime;
        let newQuarter = prev.quarter;

        if (timeLeft <= 0) {
          newQuarter = prev.quarter + 1;
          timeLeft = 900;
        }

        if (newQuarter > 4) {
          const finalState = { ...prev, isGameOver: true, timeSeconds: 0 };
          nextStateRef = finalState;
          if (!gameOverFired.current) {
            gameOverFired.current = true;
            setTimeout(() => onGameOver(finalState.homeScore, finalState.awayScore), 500);
          }
          return finalState;
        }

        if (outcome.isScore) {
          shouldSwitch = true;
          const s: GameStateType = {
            ...prev,
            homeScore: prev.homeScore + 7,
            ballOn: 25, down: 1, distance: 10,
            timeSeconds: timeLeft, quarter: newQuarter,
            possession: 'AWAY', isGameOver: false,
          };
          nextStateRef = s;
          return s;
        }

        if (outcome.type === 'Turnover') {
          shouldSwitch = true;
          const s: GameStateType = {
            ...prev,
            ballOn: Math.max(10, 80 - prev.ballOn),
            down: 1, distance: 10,
            timeSeconds: timeLeft, quarter: newQuarter,
            possession: 'AWAY', isGameOver: false,
          };
          nextStateRef = s;
          return s;
        }

        let newBallOn = Math.min(99, prev.ballOn + outcome.yardage);
        let newDown = prev.down + 1;
        let newDist = prev.distance - outcome.yardage;

        if (newDist <= 0) { newDown = 1; newDist = 10; }

        if (newDown > 4) {
          shouldSwitch = true;
          const s: GameStateType = {
            ...prev,
            ballOn: Math.max(10, 95 - newBallOn),
            down: 1, distance: 10,
            timeSeconds: timeLeft, quarter: newQuarter,
            possession: 'AWAY', isGameOver: false,
          };
          nextStateRef = s;
          return s;
        }

        const s: GameStateType = {
          ...prev,
          ballOn: newBallOn, down: newDown, distance: newDist,
          timeSeconds: timeLeft, quarter: newQuarter,
          isGameOver: false,
        };
        nextStateRef = s;
        return s;
      });

      const histEntry = {
        ...outcome,
        quarter: gameState.quarter,
        time: fmt(Math.max(0, gameState.timeSeconds - playTime)),
      };
      setPlayHistory(prev => [histEntry, ...prev]);
      setLastEvent(outcome);

      const scoreDiff = nextStateRef.homeScore - nextStateRef.awayScore;
      setWinProb(prev => {
        const base = 50 + scoreDiff * 3;
        const bonus = outcome.isScore ? 6 : outcome.type === 'Turnover' ? -8 : outcome.yardage > 15 ? 3 : outcome.yardage < 0 ? -2 : 0;
        return Math.min(99, Math.max(1, base + bonus));
      });

      setIsSimulating(false);

      if (shouldSwitch && !nextStateRef.isGameOver) {
        setTimeout(() => simulateOpponentDrive(nextStateRef), 800);
      }
    }, 1500);
  };

  const canCallPlay = !isSimulating && !isOpponentDriving && gameState.possession === 'HOME' && !gameState.isGameOver;

  return (
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Scoreboard */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-2xl z-20">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white header-font tracking-wider">HOU</div>
            <div className="text-cyan-400 font-mono font-bold text-2xl">{gameState.homeScore}</div>
          </div>
          <div className="text-slate-600 font-bold text-xl">VS</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-400 header-font tracking-wider">{oppId}</div>
            <div className="text-red-500 font-mono font-bold text-2xl">{gameState.awayScore}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-black border border-slate-700 px-6 py-2 rounded mb-1 text-amber-500 font-mono text-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            {fmt(gameState.timeSeconds)}
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {gameState.isGameOver ? 'FINAL' : `Q${gameState.quarter} • Regular Season`}
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          {gameState.possession === 'HOME' && !gameState.isGameOver ? (
            <>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Down &amp; Dist</div>
                <div className="text-xl text-white font-mono font-bold">{gameState.down} &amp; {gameState.distance}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold">Ball On</div>
                <div className="text-xl text-white font-mono font-bold">{ballDisplay(gameState.ballOn, gameState.possession)}</div>
              </div>
            </>
          ) : (
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold">Status</div>
              <div className={`text-lg font-mono font-bold ${gameState.isGameOver ? 'text-amber-400' : 'text-red-400'}`}>
                {gameState.isGameOver ? 'FINAL' : 'OPP BALL'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex">
        {/* Field */}
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px',
            }}></div>

          {/* Central Focus */}
          <div className="relative z-10 w-[600px] h-[300px] border-2 border-slate-700/50 rounded-lg bg-slate-900/80 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            {gameState.isGameOver ? (
              <div className="text-center p-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Trophy size={48} className="text-amber-400" />
                </div>
                <div className={`text-5xl font-bold header-font mb-2 ${gameState.homeScore > gameState.awayScore ? 'text-emerald-400' : 'text-red-400'}`}>
                  {gameState.homeScore > gameState.awayScore ? 'VICTORY!' : gameState.homeScore === gameState.awayScore ? 'TIE GAME' : 'DEFEAT'}
                </div>
                <div className="text-slate-300 text-2xl font-mono">
                  HOU {gameState.homeScore} – {gameState.awayScore} {oppId}
                </div>
                <div className="text-slate-500 text-sm mt-2">Week advances when you return to the dashboard.</div>
              </div>
            ) : isOpponentDriving ? (
              <div className="flex flex-col items-center">
                <div className="text-red-400 font-mono text-lg mb-3 animate-pulse">OPPONENT POSSESSION</div>
                <div className="text-slate-400 text-sm">{oppTeam.city} is driving...</div>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-red-500 animate-[shimmer_1s_infinite]"></div>
                </div>
              </div>
            ) : isSimulating ? (
              <div className="flex flex-col items-center animate-pulse">
                <div className="text-cyan-400 font-mono text-lg mb-2">EXECUTING PLAY...</div>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-1/2"></div>
                </div>
              </div>
            ) : lastEvent ? (
              <div className="text-center p-8">
                <div className={`text-6xl mb-4 font-bold header-font ${lastEvent.isScore ? 'text-emerald-400' : lastEvent.type === 'Turnover' ? 'text-red-500' : 'text-white'}`}>
                  {lastEvent.isScore ? 'TOUCHDOWN' : lastEvent.type === 'Turnover' ? 'TURNOVER' : `${lastEvent.yardage} YDS`}
                </div>
                <p className="text-slate-300 text-lg font-mono">{lastEvent.description}</p>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <PlayIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p className="uppercase tracking-widest text-sm">Call Your First Play</p>
              </div>
            )}
          </div>

          {/* Win Probability */}
          <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-700 p-4 rounded-lg backdrop-blur">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Win Probability</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white font-mono">{winProb.toFixed(0)}%</span>
              <span className={`text-xs mb-1 flex items-center ${gameState.homeScore >= gameState.awayScore ? 'text-emerald-500' : 'text-red-500'}`}>
                {gameState.homeScore >= gameState.awayScore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            </div>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${winProb}%` }}></div>
            </div>
          </div>

          {/* Weather */}
          <div className="absolute top-6 right-6">
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg backdrop-blur flex items-center gap-3 text-slate-300">
              <Wind size={18} />
              <span className="font-mono text-sm">12 MPH NW</span>
            </div>
          </div>
        </div>

        {/* Drive Log */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-widest">Drive Log</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
            {playHistory.map((play, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <div className={`font-bold ${play.isScore ? 'text-emerald-400' : play.type === 'Turnover' ? 'text-red-400' : play.yardage > 0 ? 'text-slate-300' : 'text-red-400'}`}>
                    {play.isScore ? 'TD +7' : play.type === 'Turnover' ? 'TURNOVER' : `${play.yardage > 0 ? '+' : ''}${play.yardage} Yds`}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">Q{play.quarter} {play.time}</div>
                </div>
                <div className="text-slate-500 text-xs leading-relaxed">{play.description}</div>
              </div>
            ))}
            {playHistory.length === 0 && <div className="text-slate-600 text-center text-sm italic mt-10">Game Starting...</div>}
          </div>
        </div>
      </div>

      {/* Play Call Sheet */}
      <div className="h-64 bg-slate-900 border-t border-slate-800 p-6 z-30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ShieldAlert size={18} className="text-cyan-400" />
            {canCallPlay ? 'CALL A PLAY' : gameState.isGameOver ? 'GAME OVER' : isOpponentDriving ? 'OPPONENT DRIVING...' : 'WAIT...'}
          </h3>
          <div className="flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded text-slate-300 ${gamePlan.focus === 'OFFENSE' ? 'bg-cyan-800 text-cyan-300' : 'bg-slate-800'}`}>
              {gamePlan.focus}
            </span>
            <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">Intensity: {gamePlan.intensity}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 h-full pb-8">
          {OFFENSIVE_PLAYS.map((play) => (
            <button
              key={play.id}
              disabled={!canCallPlay}
              onClick={() => handlePlayCall(play)}
              className="bg-slate-950 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 p-4 rounded-lg text-left transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-white group-hover:text-cyan-400">{play.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${play.type === 'Pass' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                  {play.type}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mb-2">{play.formation}</div>
              <div className="flex gap-4 text-[10px] text-slate-400 mt-2">
                <div className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span> Risk: {play.risk}</div>
                <div className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500"></span> Reward: {play.reward}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchSim;
