import React, { useState, useEffect, useRef } from 'react';
import { OFFENSIVE_PLAYS, TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { SCHEDULE_2027 } from '../schedule';
import { Play, GameEvent, Player, Position } from '../types';
import { Play as PlayIcon, Clock, ShieldAlert, Wind, ChevronUp, CloudRain, Sun, Zap, Activity } from 'lucide-react';

interface MatchSimProps {
  selectedTeamId: string;
  allPlayers: Player[];
  teams: Record<string, any>;
}

const MatchSim: React.FC<MatchSimProps> = ({ selectedTeamId, allPlayers, teams }) => {
  const [opponentTeamId, setOpponentTeamId] = useState<string>('');

  useEffect(() => {
    // Find next opponent from schedule or default
    const nextMatch = SCHEDULE_2027.find(m => m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId);
    if (nextMatch) {
      setOpponentTeamId(nextMatch.homeTeamId === selectedTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId);
    } else {
      setOpponentTeamId(Object.keys(teams).find(id => id !== selectedTeamId) || 'KC');
    }
  }, [selectedTeamId, teams]);
  
  const [gameState, setGameState] = useState({
    down: 1,
    distance: 10,
    ballOn: 25, // Own 25
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    possession: 'HOME', // User is HOME
    weather: {
      type: 'Clear' as 'Clear' | 'Rain' | 'Windy',
      windSpeed: 8,
      multiplier: 1.0
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [playHistory, setPlayHistory] = useState<GameEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [winProb, setWinProb] = useState(50);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);

  // Initialize random weather
  useEffect(() => {
    const types: ('Clear' | 'Rain' | 'Windy')[] = ['Clear', 'Rain', 'Windy'];
    const type = types[Math.floor(Math.random() * types.length)];
    const wind = type === 'Windy' ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 8);
    const multiplier = type === 'Rain' ? 0.85 : 1.0;
    setGameState(prev => ({ ...prev, weather: { type, windSpeed: wind, multiplier } }));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTeamRoster = (teamId: string) => allPlayers.filter(p => p.teamId === teamId);

  const calculateOutcome = (play: Play): GameEvent => {
    const isUserOffense = gameState.possession === 'HOME';
    const offTeamId = isUserOffense ? selectedTeamId : opponentTeamId;
    const defTeamId = isUserOffense ? opponentTeamId : selectedTeamId;
    
    const roster = getTeamRoster(offTeamId);
    const qb = roster.find(p => p.position === Position.QB) || roster[0];
    const topWr = roster.find(p => p.position === Position.WR) || roster[0];
    
    // Global Multipliers
    const hfaBoost = isUserOffense ? 3 : 0; // Home Field Advantage
    const weatherMult = gameState.weather.multiplier;
    const windPen = gameState.weather.windSpeed > 12 ? (gameState.weather.windSpeed - 12) * 0.01 : 0;

    let yardage = 0;
    let description = '';
    let isScore = false;
    let type: GameEvent['type'] = play.type;

    if (play.type === 'Special') {
      if (play.name === 'Field Goal') {
        const distance = 100 - gameState.ballOn + 17;
        const accuracyMult = (gameState.weather.windSpeed / 30);
        const successProb = (distance < 40 ? 0.95 : distance < 50 ? 0.75 : 0.45) - accuracyMult;
        
        if (Math.random() < successProb) {
          isScore = true;
          description = `FIELD GOAL GOOD! A ${distance}-yard kick splits the uprights.`;
        } else {
          description = `MISSED FIELD GOAL! The ${distance}-yard attempt is wide.`;
          type = 'Turnover';
        }
      } else if (play.name === 'Punt') {
        yardage = Math.floor(Math.random() * 15) + 35 - (gameState.weather.windSpeed / 2);
        description = `PUNT! A high spiraling kick for ${Math.floor(yardage)} yards.`;
        type = 'Turnover';
      }
      return { description, yardage, isScore, type };
    }

    // GDD Refined Simulation Engine Formulas
    if (play.type === 'Pass') {
      // P(Comp) = (Base 45% + (QB_ACC * 0.3) + (WR_CTH * 0.2) - (DB_COV * 0.4) - (Pressure * 0.15)) * Weather_Mult
      const qbAcc = (qb.schemeOvr + hfaBoost) / 100;
      const wrCth = (topWr.overall) / 100;
      const dbCov = 0.82; // Static for now, expand to def systems later
      const pressure = Math.random() * 0.3;
      
      const pComp = (0.45 + (qbAcc * 0.3) + (wrCth * 0.2) - (dbCov * 0.4) - (pressure * 0.15)) * weatherMult - windPen;
      const roll = Math.random();

      if (roll < 0.025) {
        type = 'Turnover';
        description = `INTERCEPTED! The QB misread the coverage.`;
        yardage = 0;
      } else if (roll < pComp) {
        // Success
        const isBigPlay = Math.random() < (qb.overall / 300);
        yardage = isBigPlay ? Math.floor(Math.random() * 25) + 20 : Math.floor(Math.random() * 12) + 4;
        description = `Complete to ${topWr.name} for ${yardage} yards.`;
      } else {
        // Fail
        const isSack = Math.random() < 0.12;
        if (isSack) {
          yardage = -Math.floor(Math.random() * 7) - 3;
          description = `SACK! The pocket collapsed for a ${Math.abs(yardage)} yard loss.`;
        } else {
          description = `Incomplete pass intended for ${topWr.name}.`;
        }
      }
    } else if (play.type === 'Run') {
      const rb = roster.find(p => p.position === Position.RB) || roster[0];
      const rbPower = (rb.overall + hfaBoost) / 100;
      const linePush = 0.75; // Mocked OL push
      
      const successProb = 0.55 + (rbPower * 0.1) + (linePush * 0.1);
      const roll = Math.random();

      if (roll < 0.015) {
        type = 'Turnover';
        description = `FUMBLE! The ball was stripped at the point of attack.`;
        yardage = 2;
      } else if (roll < successProb) {
        const isBigPlay = Math.random() < (rb.overall / 400);
        yardage = isBigPlay ? Math.floor(Math.random() * 30) + 15 : Math.floor(Math.random() * 7) + 2;
        description = `${rb.name} clears a path for ${yardage} yards.`;
      } else {
        yardage = Math.floor(Math.random() * 3) - 2;
        description = yardage < 0 ? `Stuffed behind the line for a loss.` : `Met at the line for no gain.`;
      }
    }

    // TD Check
    if (gameState.ballOn + yardage >= 100 && type !== 'Turnover') {
      isScore = true;
      yardage = 100 - gameState.ballOn;
      description = `TOUCHDOWN! ${play.name} capped by a brilliant effort!`;
    }

    return { description, yardage, isScore, type };
  };

  const handlePlayCall = (play: Play) => {
    if (isSimulating) return;
    setIsSimulating(true);

    // Simulate delay
    setTimeout(() => {
      const outcome = calculateOutcome(play);
      setLastEvent(outcome);
      setPlayHistory(prev => [outcome, ...prev]);
      updateGameState(outcome);
      setIsSimulating(false);
      
      // Time decay
      const playTime = Math.floor(Math.random() * 25) + 15; // 15-40 seconds
      setTimeRemaining(prev => Math.max(0, prev - playTime));

      // Randomly fluctuate win prob for effect
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

  const updateGameState = (event: GameEvent) => {
    setGameState(prev => {
        let nextState = { ...prev };

        if (event.isScore) {
            if (prev.possession === 'HOME') nextState.homeScore += event.description.includes('FIELD GOAL') ? 3 : 7;
            else nextState.awayScore += event.description.includes('FIELD GOAL') ? 3 : 7;
            
            // Switch possession after score
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
            // Goal to go check
            if (newBallOn > 90) newDist = 100 - newBallOn;
        }

        if (newDown > 4) {
            // Turnover on downs
            nextState.possession = prev.possession === 'HOME' ? 'AWAY' : 'HOME';
            nextState.ballOn = 100 - newBallOn;
            nextState.down = 1;
            nextState.distance = 10;
            return nextState;
        }

        return {
            ...prev,
            ballOn: newBallOn,
            down: newDown,
            distance: newDist
        };
    });
  };

  // Auto-simulate opponent turn
  useEffect(() => {
    if (gameState.possession === 'AWAY' && !isSimulating) {
        const timer = setTimeout(() => {
            const randomPlay = OFFENSIVE_PLAYS[Math.floor(Math.random() * (OFFENSIVE_PLAYS.length - 2))]; // No special teams for AI yet
            handlePlayCall(randomPlay);
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [gameState.possession, isSimulating]);

  return (
    <div className="h-full flex flex-col bg-[#05070a] relative overflow-hidden">
        {/* Top Technical Scoreboard */}
        <div className="bg-[#0a0e14] border-b border-[#1a222e] p-6 flex justify-between items-center shadow-2xl z-20 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            
            <div className="flex items-center gap-12">
                <div className="text-center relative">
                    <div className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">{selectedTeamId}</div>
                    <div className="text-cyan-400 font-mono font-bold text-3xl mt-1 tracking-widest">{gameState.homeScore}</div>
                    <div className="absolute -bottom-2 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_8px_rgba(0,209,255,1)]"></div>
                </div>
                <div className="text-[#1a222e] font-bold text-2xl mono-font tracking-widest">VS</div>
                <div className="text-center">
                    <div className="text-4xl font-bold text-slate-600 header-font tracking-tighter uppercase italic opacity-80">{opponentTeamId}</div>
                    <div className="text-red-500 font-mono font-bold text-3xl mt-1 tracking-widest">{gameState.awayScore}</div>
                </div>
            </div>

            <div className="flex flex-col items-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mb-2 font-mono">NODE::TIME_REMAINING</div>
                <div className="bg-[#05070a] border border-[#1a222e] px-8 py-3 rounded-sm mb-1 text-amber-500 font-mono text-3xl font-bold shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] border-amber-500/20">
                    {formatTime(timeRemaining)}
                </div>
                <div className="text-[10px] text-cyan-500/70 font-bold uppercase tracking-[0.2em] font-mono mt-1 italic">PERIOD::{gameState.quarter} // POSSESSION::{gameState.possession === 'HOME' ? 'SYS_OWN' : 'SYM_OPP'}</div>
            </div>

            <div className="flex items-center gap-10 text-right">
                <div className="border-r border-[#1a222e] pr-10">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 mono-font">DN_DIST</div>
                    <div className="text-2xl text-white font-mono font-bold tracking-tighter">
                        {gameState.down === 1 ? '1ST' : gameState.down === 2 ? '2ND' : gameState.down === 3 ? '3RD' : '4TH'} & {gameState.distance <= 0 ? 'GOAL' : gameState.distance}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 mono-font">COORD_VAL</div>
                    <div className="text-2xl text-white font-mono font-bold tracking-tighter">
                        {gameState.ballOn < 50 ? `OWN_${gameState.ballOn}` : gameState.ballOn === 50 ? 'MID_50' : `OPP_${100 - gameState.ballOn}`}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative flex">
            {/* Tactical Field Vis (Left/Center) */}
            <div className="flex-1 bg-[#05070a] relative flex items-center justify-center overflow-hidden">
                {/* Visual Grid Lines */}
                <div className="absolute inset-0 grid-lines opacity-10"></div>

                {/* Central Tactical Display */}
                <div className="relative z-10 w-[700px] h-[350px] border border-[#1a222e] bg-[#0a0e14]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                    
                    {isSimulating ? (
                        <div className="flex flex-col items-center">
                            <div className="text-cyan-400 font-mono text-xs mb-4 tracking-[0.5em] animate-pulse">PROCESSING_TACTICAL_DATA...</div>
                            <div className="w-80 h-[1px] bg-[#1a222e] relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-cyan-500 w-1/3 animate-[shimmer_1.5s_infinite]"></div>
                            </div>
                        </div>
                    ) : lastEvent ? (
                        <div className="text-center p-10 relative">
                             <div className={`text-7xl mb-6 font-bold header-font tracking-tighter italic ${lastEvent.isScore ? 'text-emerald-400' : lastEvent.type === 'Turnover' ? 'text-red-500' : 'text-white'}`}>
                                {lastEvent.isScore ? 'SIGNAL_TOUCHDOWN' : lastEvent.type === 'Turnover' ? 'SYS_CRITICAL_LOST' : `GAIN::${lastEvent.yardage}Y`}
                             </div>
                             <p className="text-slate-500 text-sm font-mono tracking-widest uppercase italic opacity-80">{lastEvent.description}</p>
                             
                             {/* Tactical Overlay */}
                             <div className="absolute -top-4 -left-4 w-8 h-8 border-t border-l border-slate-700"></div>
                             <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b border-r border-slate-700"></div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-700">
                            <Zap size={48} className="mx-auto mb-6 opacity-20 animate-pulse text-cyan-500" />
                            <p className="uppercase tracking-[0.4em] text-[10px] font-mono">READY_FOR_PROTOCOL_INPUT</p>
                        </div>
                    )}
                </div>
                
                {/* Analytics Gauge */}
                <div className="absolute top-10 left-10 bg-[#0a0e14]/90 border border-[#1a222e] p-6 backdrop-blur shadow-2xl">
                    <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-4 mono-font italic font-bold">WIN_PROB_ALGORITHM</div>
                    <div className="flex items-end gap-3 font-mono">
                        <span className="text-4xl font-bold text-white tracking-widest">{winProb.toFixed(1)}%</span>
                        <span className="text-[10px] text-emerald-500 mb-1 flex items-center tracking-tighter font-bold"><ChevronUp size={14} /> +1.2%</span>
                    </div>
                     <div className="w-48 h-[2px] bg-[#1a222e] mt-6 relative overflow-hidden">
                        <div className="bg-cyan-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,209,255,1)]" style={{ width: `${winProb}%` }}></div>
                    </div>
                </div>

                {/* Environmental Readout */}
                <div className="absolute top-10 right-10 flex gap-4">
                     <div className="bg-[#0a0e14]/90 border border-[#1a222e] p-4 backdrop-blur shadow-2xl flex items-center gap-4 text-slate-500 font-mono">
                        <div className="p-2 bg-cyan-500/5 border border-cyan-500/20 text-cyan-500 animate-pulse">
                            {gameState.weather.type === 'Clear' ? <Sun size={20} /> : 
                             gameState.weather.type === 'Rain' ? <CloudRain size={20} /> : 
                             <Wind size={20} />}
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold">ENV_STATUS</div>
                            <div className="text-xs text-white tracking-tighter">
                                {gameState.weather.type} // {gameState.weather.windSpeed} MPH_VECTOR
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Tactical Drive Log Sidebar */}
            <div className="w-96 bg-[#0a0e14] border-l border-[#1a222e] flex flex-col">
                <div className="p-6 border-b border-[#1a222e] font-bold text-slate-500 text-[10px] uppercase tracking-[0.3em] flex justify-between items-center mono-font italic bg-[#0d121a]/50">
                    <span>DRIVE_LOG_BUFFER</span>
                    {isSimulating && gameState.possession === 'AWAY' && (
                        <span className="text-red-500 animate-pulse text-[9px] font-bold">OPP_TURN...</span>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-1" ref={scrollRef}>
                    {playHistory.map((play, idx) => (
                        <div key={idx} className={`p-4 border-l-2 text-[11px] font-mono transition-all duration-300 hover:bg-slate-900/30 ${play.isScore ? 'bg-emerald-900/10 border-emerald-500' : play.type === 'Turnover' ? 'bg-red-900/10 border-red-500' : 'bg-transparent border-[#1a222e] hover:border-cyan-500/50'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold tracking-widest uppercase ${play.yardage > 0 ? 'text-emerald-400' : play.yardage < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                    {play.yardage > 0 ? `+${play.yardage}` : play.yardage} // YDS
                                </span>
                                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">{play.type}</span>
                            </div>
                            <div className="text-slate-400 leading-relaxed uppercase opacity-80">{play.description}</div>
                        </div>
                    ))}
                    {playHistory.length === 0 && <div className="text-slate-700 text-center text-[10px] mono-font tracking-[0.5em] mt-20 opacity-50 italic">INITIALIZING_SESSION...</div>}
                </div>
            </div>
        </div>

        {/* Tactical Playbook Bottom Sheet */}
        <div className="h-72 bg-[#0a0e14] border-t border-[#1a222e] p-8 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold flex items-center gap-4 text-xs tracking-[0.3em] font-mono italic">
                    <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <ShieldAlert size={14} />
                    </div>
                    RECOMMENDED_PROTOCOLS
                </h3>
                <div className="flex gap-4 mono-font">
                     <span className="px-3 py-1 bg-[#05070a] border border-[#1a222e] text-[9px] text-slate-500 tracking-widest"><span className="text-emerald-500">RUN_RATIO:</span> 42%</span>
                     <span className="px-3 py-1 bg-[#05070a] border border-[#1a222e] text-[9px] text-slate-500 tracking-widest"><span className="text-cyan-500">PASS_RATIO:</span> 58%</span>
                </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 h-full pb-10">
                {OFFENSIVE_PLAYS.map((play) => (
                    <button 
                        key={play.id}
                        disabled={isSimulating || gameState.possession === 'AWAY'}
                        onClick={() => handlePlayCall(play)}
                        className="bg-[#05070a] border border-[#1a222e] hover:border-cyan-500/60 hover:bg-cyan-500/5 p-5 text-left transition-all group relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
                    >
                        {/* Interactive Accent */}
                        <div className="absolute top-0 right-0 w-[1px] h-0 bg-cyan-500 group-hover:h-full transition-all duration-300"></div>

                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-400 tracking-tight transition-colors mono-font uppercase">{play.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest ${
                                play.type === 'Pass' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 
                                play.type === 'Run' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' :
                                'bg-purple-900/20 text-purple-400 border border-purple-500/20'
                            }`}>
                                {play.type}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mb-4 tracking-tighter bg-[#0d121a] px-2 py-0.5 border-l border-slate-700 inline-block">{play.formation}</div>
                        
                        <div className="flex gap-4 text-[9px] font-mono text-slate-500 mt-auto uppercase">
                            <div className="flex items-center gap-1 group-hover:text-red-500 transition-colors">
                                <div className="w-1 h-1 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></div> R_L::{play.risk}
                            </div>
                            <div className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                                <div className="w-1 h-1 bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]"></div> W_V::{play.reward}
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