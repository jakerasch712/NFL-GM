import React, { useState, useEffect, useRef } from 'react';
import { OFFENSIVE_PLAYS } from '../constants';
import { Play, GameEvent } from '../types';
import { Play as PlayIcon, Clock, ShieldAlert, Wind, ChevronUp, Trophy, RefreshCw } from 'lucide-react';

interface MatchSimProps {
  selectedTeamId: string;
}

const QUARTER_SECONDS = 15 * 60; // 15-minute quarters

const MatchSim: React.FC<MatchSimProps> = ({ selectedTeamId }) => {
  const [gameState, setGameState] = useState({
    down: 1,
    distance: 10,
    ballOn: 25,
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    possession: 'HOME' as 'HOME' | 'AWAY'
  });

  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winProb, setWinProb] = useState(50);
  const [timeRemaining, setTimeRemaining] = useState(QUARTER_SECONDS);
  const [playHistory, setPlayHistory] = useState<GameEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quarter advancement: fires when timeRemaining hits 0
  useEffect(() => {
    if (timeRemaining <= 0 && !isSimulating) {
      if (gameState.quarter >= 4) {
        setIsGameOver(true);
      } else {
        setGameState(prev => ({ ...prev, quarter: prev.quarter + 1 }));
        setTimeRemaining(QUARTER_SECONDS);
      }
    }
  }, [timeRemaining, isSimulating]);

  const handlePlayCall = (play: Play) => {
    if (isSimulating || isGameOver) return;
    setIsSimulating(true);

    setTimeout(() => {
      const outcome = calculateOutcome(play);
      setLastEvent(outcome);
      setPlayHistory(prev => [outcome, ...prev]);
      updateGameState(outcome);
      setIsSimulating(false);

      const playTime = Math.floor(Math.random() * 25) + 15;
      setTimeRemaining(prev => Math.max(0, prev - playTime));

      setWinProb(prev => {
        let change = 0;
        if (outcome.isScore) change = 5;
        else if (outcome.yardage > 15) change = 3;
        else if (outcome.yardage < 0) change = -2;
        else if (outcome.type === 'Turnover') change = -10;
        return Math.min(99, Math.max(1, prev + (gameState.possession === 'HOME' ? change : -change)));
      });
    }, 1500);
  };

  const calculateOutcome = (play: Play): GameEvent => {
    const roll = Math.random();
    let yardage = 0;
    let description = '';
    let isScore = false;
    let type: GameEvent['type'] = play.type;

    if (play.type === 'Special') {
      if (play.name === 'Field Goal') {
        const distance = 100 - gameState.ballOn + 17;
        const successProb = distance < 40 ? 0.95 : distance < 50 ? 0.75 : 0.45;
        if (Math.random() < successProb) {
          isScore = true;
          description = `FIELD GOAL GOOD! A ${distance}-yard kick splits the uprights.`;
        } else {
          description = `MISSED FIELD GOAL! The ${distance}-yard attempt is wide.`;
          type = 'Turnover';
        }
      } else if (play.name === 'Punt') {
        yardage = Math.floor(Math.random() * 15) + 35;
        description = `PUNT! A high spiraling kick for ${yardage} yards.`;
        type = 'Turnover';
      }
      return { description, yardage, isScore, type };
    }

    if (roll < 0.03) {
      type = 'Turnover';
      description = `TURNOVER! Fumble on the play, recovered by the defense.`;
      yardage = Math.floor(Math.random() * 5);
    } else if (roll < 0.06 && play.type === 'Pass') {
      type = 'Turnover';
      description = `INTERCEPTED! The QB misread the coverage.`;
      yardage = 0;
    } else if (roll < play.successRate) {
      const isBigPlay = Math.random() < (play.reward / 25);
      const baseGain = Math.floor(Math.random() * play.reward) + 1;
      yardage = isBigPlay ? baseGain + Math.floor(Math.random() * 20) + 10 : baseGain;
      description = `${play.type === 'Pass' ? 'Complete' : 'Run'} for ${yardage} yards.`;
    } else {
      const sack = play.type === 'Pass' && Math.random() < 0.15;
      yardage = sack ? -Math.floor(Math.random() * 7) - 2 : 0;
      description = sack ? `SACK! The pocket collapsed quickly.` : `Incomplete pass.`;
      if (play.type === 'Run') {
        yardage = -Math.floor(Math.random() * 3);
        description = yardage < 0 ? `Tackled for a loss of ${Math.abs(yardage)}.` : `No gain on the run.`;
      }
    }

    if (gameState.ballOn + yardage >= 100 && type !== 'Turnover') {
      isScore = true;
      yardage = 100 - gameState.ballOn;
      description = `TOUCHDOWN! ${play.name} goes all the way!`;
    }

    return { description, yardage, isScore, type };
  };

  const updateGameState = (event: GameEvent) => {
    setGameState(prev => {
      let nextState = { ...prev };

      if (event.isScore) {
        if (prev.possession === 'HOME') nextState.homeScore += event.description.includes('FIELD GOAL') ? 3 : 7;
        else nextState.awayScore += event.description.includes('FIELD GOAL') ? 3 : 7;
        nextState.possession = prev.possession === 'HOME' ? 'AWAY' : 'HOME';
        nextState.ballOn = 25;
        nextState.down = 1;
        nextState.distance = 10;
        return nextState;
      }

      if (event.type === 'Turnover') {
        nextState.possession = prev.possession === 'HOME' ? 'AWAY' : 'HOME';
        nextState.ballOn = 100 - (prev.ballOn + event.yardage);
        nextState.down = 1;
        nextState.distance = 10;
        return nextState;
      }

      let newBallOn = prev.ballOn + event.yardage;
      let newDown = prev.down + 1;
      let newDist = prev.distance - event.yardage;

      if (newDist <= 0) {
        newDown = 1;
        newDist = 10;
        if (newBallOn > 90) newDist = 100 - newBallOn;
      }

      if (newDown > 4) {
        nextState.possession = prev.possession === 'HOME' ? 'AWAY' : 'HOME';
        nextState.ballOn = 100 - newBallOn;
        nextState.down = 1;
        nextState.distance = 10;
        return nextState;
      }

      return { ...prev, ballOn: newBallOn, down: newDown, distance: newDist };
    });
  };

  // Auto-simulate opponent turn
  useEffect(() => {
    if (gameState.possession === 'AWAY' && !isSimulating && !isGameOver) {
      const timer = setTimeout(() => {
        const randomPlay = OFFENSIVE_PLAYS[Math.floor(Math.random() * (OFFENSIVE_PLAYS.length - 2))];
        handlePlayCall(randomPlay);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.possession, isSimulating, isGameOver]);

  const handleNewGame = () => {
    setGameState({ down: 1, distance: 10, ballOn: 25, quarter: 1, homeScore: 0, awayScore: 0, possession: 'HOME' });
    setLastEvent(null);
    setIsSimulating(false);
    setIsGameOver(false);
    setWinProb(50);
    setTimeRemaining(QUARTER_SECONDS);
    setPlayHistory([]);
  };

  const opponentId = selectedTeamId === 'KC' ? 'BAL' : 'KC';
  const quarterLabel = isGameOver ? 'FINAL' : `Q${gameState.quarter}`;

  return (
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Top Scoreboard */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-2xl z-20">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white header-font tracking-wider">{selectedTeamId}</div>
            <div className="text-cyan-400 font-mono font-bold text-2xl">{gameState.homeScore}</div>
          </div>
          <div className="text-slate-600 font-bold text-xl">VS</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-400 header-font tracking-wider">{opponentId}</div>
            <div className="text-red-500 font-mono font-bold text-2xl">{gameState.awayScore}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-black border border-slate-700 px-6 py-2 rounded mb-1 text-amber-500 font-mono text-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            {isGameOver ? 'FINAL' : formatTime(timeRemaining)}
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {quarterLabel} • {isGameOver ? 'GAME OVER' : gameState.possession === 'HOME' ? 'OFFENSE' : 'DEFENSE'}
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold">Down & Dist</div>
            <div className="text-xl text-white font-mono font-bold">
              {isGameOver ? '—' : `${gameState.down === 1 ? '1st' : gameState.down === 2 ? '2nd' : gameState.down === 3 ? '3rd' : '4th'} & ${gameState.distance <= 0 ? 'Goal' : gameState.distance}`}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold">Ball On</div>
            <div className="text-xl text-white font-mono font-bold">
              {isGameOver ? '—' : gameState.ballOn < 50 ? `Own ${gameState.ballOn}` : gameState.ballOn === 50 ? '50' : `Opp ${100 - gameState.ballOn}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex">
        {/* Field */}
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }}
          ></div>

          <div className="relative z-10 w-[600px] h-[300px] border-2 border-slate-700/50 rounded-lg bg-slate-900/80 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            {isGameOver ? (
              <div className="text-center p-8">
                <Trophy size={48} className="mx-auto mb-4 text-yellow-400" />
                <div className="text-4xl font-bold text-white header-font mb-2">
                  {gameState.homeScore > gameState.awayScore ? 'WIN' : gameState.homeScore === gameState.awayScore ? 'TIE' : 'LOSS'}
                </div>
                <div className="text-2xl font-mono text-slate-300 mb-6">
                  {selectedTeamId} {gameState.homeScore} – {gameState.awayScore} {opponentId}
                </div>
                <button
                  onClick={handleNewGame}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all mx-auto"
                >
                  <RefreshCw size={16} /> New Game
                </button>
              </div>
            ) : isSimulating ? (
              <div className="flex flex-col items-center animate-pulse">
                <div className="text-cyan-400 font-mono text-lg mb-2">EXECUTING PLAY...</div>
                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-1/2 animate-[shimmer_1s_infinite]"></div>
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
                <p className="uppercase tracking-widest text-sm">Waiting for Call</p>
              </div>
            )}
          </div>

          {/* Win Prob Gauge */}
          <div className="absolute top-6 left-6 bg-slate-900/90 border border-slate-700 p-4 rounded-lg backdrop-blur">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Win Probability</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white font-mono">{winProb.toFixed(1)}%</span>
              <span className="text-xs text-emerald-500 mb-1 flex items-center"><ChevronUp size={12} /> 1.2%</span>
            </div>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${winProb}%` }}></div>
            </div>
          </div>

          {/* Quarter indicator */}
          {!isGameOver && (
            <div className="absolute top-6 right-6 flex gap-3">
              {[1, 2, 3, 4].map(q => (
                <div
                  key={q}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                    q < gameState.quarter
                      ? 'border-slate-600 bg-slate-800 text-slate-500'
                      : q === gameState.quarter
                      ? 'border-amber-400 bg-amber-400/20 text-amber-400'
                      : 'border-slate-700 text-slate-600'
                  }`}
                >
                  Q{q}
                </div>
              ))}
            </div>
          )}

          <div className="absolute bottom-6 right-6">
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg backdrop-blur flex items-center gap-3 text-slate-300">
              <Wind size={18} />
              <span className="font-mono text-sm">12 MPH NW</span>
            </div>
          </div>
        </div>

        {/* Play History Sidebar */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-widest flex justify-between items-center">
            <span>Drive Log</span>
            {isSimulating && gameState.possession === 'AWAY' && (
              <span className="text-red-400 animate-pulse text-[10px]">Opponent Turn...</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
            {playHistory.map((play, idx) => (
              <div key={idx} className={`p-3 rounded border text-sm ${play.isScore ? 'bg-emerald-900/20 border-emerald-500/30' : play.type === 'Turnover' ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${play.yardage > 0 ? 'text-emerald-400' : play.yardage < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {play.yardage > 0 ? `+${play.yardage}` : play.yardage} Yards
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{play.type}</span>
                </div>
                <div className="text-slate-400 text-xs leading-relaxed">{play.description}</div>
              </div>
            ))}
            {playHistory.length === 0 && <div className="text-slate-600 text-center text-sm italic mt-10">Game Starting...</div>}
          </div>
        </div>
      </div>

      {/* Play Call Sheet (Bottom) */}
      <div className="h-64 bg-slate-900 border-t border-slate-800 p-6 z-30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <ShieldAlert size={18} className="text-cyan-400" />
            SUGGESTED PLAYS
          </h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">Run: 42%</span>
            <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">Pass: 58%</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 h-full pb-8">
          {OFFENSIVE_PLAYS.map((play) => (
            <button
              key={play.id}
              disabled={isSimulating || gameState.possession === 'AWAY' || isGameOver}
              onClick={() => handlePlayCall(play)}
              className="bg-slate-950 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 p-4 rounded-lg text-left transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-white group-hover:text-cyan-400">{play.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  play.type === 'Pass' ? 'bg-cyan-900/30 text-cyan-400' :
                  play.type === 'Run' ? 'bg-emerald-900/30 text-emerald-400' :
                  'bg-purple-900/30 text-purple-400'
                }`}>
                  {play.type}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mb-2">{play.formation}</div>
              <div className="flex gap-4 text-[10px] text-slate-400 mt-2">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span> Risk: {play.risk}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Reward: {play.reward}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchSim;
