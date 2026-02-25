import React, { useState, useEffect, useRef } from 'react';
import { OFFENSIVE_PLAYS } from '../constants';
import { Play, GameEvent } from '../types';
import { Play as PlayIcon, Clock, ShieldAlert, Wind, ChevronUp } from 'lucide-react';

const MatchSim: React.FC = () => {
  const [gameState, setGameState] = useState({
    down: 1,
    distance: 10,
    ballOn: 25, // Own 25
    quarter: 1,
    time: '12:45',
    homeScore: 0,
    awayScore: 0,
    possession: 'HOME' // User is HOME
  });

  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [winProb, setWinProb] = useState(50);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [playHistory, setPlayHistory] = useState<GameEvent[]>([]);

  const handlePlayCall = (play: Play) => {
    setIsSimulating(true);

    // Simulate delay
    setTimeout(() => {
      const outcome = calculateOutcome(play);
      setLastEvent(outcome);
      setPlayHistory(prev => [outcome, ...prev]);
      updateGameState(outcome);
      setIsSimulating(false);
      
      // Randomly fluctuate win prob for effect
      setWinProb(prev => Math.min(99, Math.max(1, prev + (outcome.isScore ? 5 : outcome.yardage > 10 ? 2 : outcome.yardage < 0 ? -2 : 0))));

    }, 1500);
  };

  const calculateOutcome = (play: Play): GameEvent => {
    const roll = Math.random();
    let yardage = 0;
    let description = '';
    let isScore = false;
    let type: GameEvent['type'] = play.type;

    // Simplified logic
    if (roll < 0.05) {
       // Turnover
       type = 'Turnover';
       description = `INTERCEPTED! The defender jumps the route on the ${play.name}.`;
       yardage = 0;
    } else if (roll < play.successRate) {
        // Success
        const bigPlay = Math.random() < (play.reward / 20); // 10 reward = 50% chance of big play? No, /20 = 50% max. Let's say reward 10 = 0.5. Too high. reward/20 -> 10/20 = 0.5.
        const baseGain = Math.floor(Math.random() * 8) + 2; // 2-10 yards
        yardage = bigPlay ? baseGain + Math.floor(Math.random() * 20) + 10 : baseGain;
        description = `${play.type === 'Pass' ? 'Complete' : 'Run'} for ${yardage} yards using ${play.name}.`;
    } else {
        // Fail
        const sack = play.type === 'Pass' && Math.random() < 0.2;
        yardage = sack ? -Math.floor(Math.random() * 8) : 0;
        description = sack ? `SACKED! Loss of ${Math.abs(yardage)} on the play.` : `Incomplete pass intended for Collins.`;
        if (play.type === 'Run') description = `Stuffed at the line of scrimmage. No gain.`;
    }

    // TD Check
    if (gameState.ballOn + yardage >= 100) {
        isScore = true;
        yardage = 100 - gameState.ballOn;
        description = `TOUCHDOWN! Explosive play on the ${play.name}!`;
    }

    return { description, yardage, isScore, type };
  };

  const updateGameState = (event: GameEvent) => {
    setGameState(prev => {
        if (event.isScore) {
            return {
                ...prev,
                homeScore: prev.homeScore + 7, // Auto PAT for demo
                ballOn: 25,
                down: 1,
                distance: 10
            };
        }

        let newBallOn = prev.ballOn + event.yardage;
        let newDown = prev.down + 1;
        let newDist = prev.distance - event.yardage;

        if (newDist <= 0) {
            newDown = 1;
            newDist = 10;
        }

        if (newDown > 4) {
            // Turnover on downs logic omitted for brevity, just reset
            newDown = 1;
            newDist = 10; 
            // In real app, switch possession
        }

        return {
            ...prev,
            ballOn: newBallOn,
            down: newDown,
            distance: newDist
        };
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 relative overflow-hidden">
        {/* Top Scoreboard */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-2xl z-20">
            <div className="flex items-center gap-8">
                <div className="text-center">
                    <div className="text-3xl font-bold text-white header-font tracking-wider">HOU</div>
                    <div className="text-cyan-400 font-mono font-bold text-2xl">{gameState.homeScore}</div>
                </div>
                <div className="text-slate-600 font-bold text-xl">VS</div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-slate-400 header-font tracking-wider">KC</div>
                    <div className="text-red-500 font-mono font-bold text-2xl">{gameState.awayScore}</div>
                </div>
            </div>

            <div className="flex flex-col items-center">
                <div className="bg-black border border-slate-700 px-6 py-2 rounded mb-1 text-amber-500 font-mono text-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {gameState.time}
                </div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Q{gameState.quarter} • Regular Season</div>
            </div>

            <div className="flex items-center gap-6 text-right">
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Down & Dist</div>
                    <div className="text-xl text-white font-mono font-bold">{gameState.down} & {gameState.distance}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Ball On</div>
                    <div className="text-xl text-white font-mono font-bold">OWN {gameState.ballOn}</div>
                </div>
            </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative flex">
            {/* Field Vis (Left/Center) */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {/* Abstract Field Grid */}
                <div className="absolute inset-0 opacity-10" 
                     style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #334155 25%, #334155 26%, transparent 27%, transparent 74%, #334155 75%, #334155 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                }}></div>

                {/* Central Focus */}
                <div className="relative z-10 w-[600px] h-[300px] border-2 border-slate-700/50 rounded-lg bg-slate-900/80 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                    {isSimulating ? (
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

                {/* Environment */}
                <div className="absolute top-6 right-6 flex gap-4">
                     <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg backdrop-blur flex items-center gap-3 text-slate-300">
                        <Wind size={18} />
                        <span className="font-mono text-sm">12 MPH NW</span>
                     </div>
                </div>
            </div>

            {/* Play History Sidebar */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-widest">Drive Log</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                    {playHistory.map((play, idx) => (
                        <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm">
                            <div className={`font-bold mb-1 ${play.yardage > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {play.yardage > 0 ? `+${play.yardage}` : play.yardage} Yards
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
            
            <div className="grid grid-cols-3 gap-4 h-full pb-8">
                {OFFENSIVE_PLAYS.map((play) => (
                    <button 
                        key={play.id}
                        disabled={isSimulating}
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