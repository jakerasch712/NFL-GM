import React, { useState, useEffect, useRef } from 'react';
import { OFFENSIVE_PLAYS, TEAMS_DB, MOCK_PLAYERS } from '../constants';
import { Play, GameEvent, Player, Position, AppView, HighlightPackage, ScheduleMatch } from '../types';
import { GameResult } from '../services/leagueSimService';
import { Play as PlayIcon, Clock, ShieldAlert, Wind, ChevronUp, CloudRain, Sun, Zap, Activity, Trophy, BarChart2, Award, ListFilter, RotateCcw, Video, Film, Sparkles, Radio, Tv, Maximize2, RefreshCw, Thermometer, CloudSnow, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface WeatherConfig {
  type: 'Clear' | 'Snow' | 'Windy' | 'Rain' | 'Dome';
  label: string;
  temp: number;
  windSpeed: number;
  passModifier: number;
  rushModifier: number;
  fumbleRisk: number;
  kickingModifier: number;
  description: string;
}

const WEATHER_PRESETS: Record<string, WeatherConfig> = {
  Clear: {
    type: 'Clear',
    label: 'CLEAR & MILD',
    temp: 72,
    windSpeed: 6,
    passModifier: 1.0,
    rushModifier: 1.0,
    fumbleRisk: 0.015,
    kickingModifier: 1.0,
    description: 'Optimal playing conditions. Standard playbook efficiency.'
  },
  Snow: {
    type: 'Snow',
    label: 'FREEZING SNOWSTORM',
    temp: 22,
    windSpeed: 18,
    passModifier: 0.82,
    rushModifier: 1.15,
    fumbleRisk: 0.03,
    kickingModifier: 0.8,
    description: 'Freezing pitch. Passing accuracy -18%; power run attack favored.'
  },
  Windy: {
    type: 'Windy',
    label: 'HIGH WIND GUSTS',
    temp: 54,
    windSpeed: 30,
    passModifier: 0.72,
    rushModifier: 1.05,
    fumbleRisk: 0.02,
    kickingModifier: 0.65,
    description: '30+ MPH gusts. Deep passing & field goal accuracy severely penalized.'
  },
  Rain: {
    type: 'Rain',
    label: 'HEAVY DOWNPOUR',
    temp: 46,
    windSpeed: 16,
    passModifier: 0.88,
    rushModifier: 1.02,
    fumbleRisk: 0.035,
    kickingModifier: 0.85,
    description: 'Slippery turf. Higher fumble risk & dropped receptions.'
  },
  Dome: {
    type: 'Dome',
    label: 'INDOOR DOME',
    temp: 70,
    windSpeed: 0,
    passModifier: 1.08,
    rushModifier: 1.0,
    fumbleRisk: 0.01,
    kickingModifier: 1.1,
    description: 'Climate controlled. Enhanced passing precision & kicking range.'
  }
};

interface MatchSimProps {
  selectedTeamId: string;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teams: Record<string, any>;
  currentWeek: number;
  schedule: ScheduleMatch[];
  onGameComplete: (result: GameResult) => void;
  setView: (view: AppView) => void;
}

interface ScoringEvent {
  quarter: number;
  timeLeft: string;
  teamId: string;
  type: 'TD' | 'FG';
  description: string;
  score: {
    home: number;
    away: number;
  };
}

const MatchSim: React.FC<MatchSimProps> = ({ selectedTeamId, allPlayers, setAllPlayers, teams, currentWeek, schedule, onGameComplete, setView }) => {
  const [opponentTeamId, setOpponentTeamId] = useState<string>('');
  const [isUserHome, setIsUserHome] = useState(true);
  const [hasScheduledGame, setHasScheduledGame] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoringSummary, setScoringSummary] = useState<ScoringEvent[]>([]);

  // Highlight Video Package State
  const [highlightPackage, setHighlightPackage] = useState<HighlightPackage | null>(null);
  const [isGeneratingHighlight, setIsGeneratingHighlight] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];
  const opponentTeam = teams[opponentTeamId] || TEAMS_DB[opponentTeamId] || { name: 'Opponent', city: 'NFL' };

  const fetchHighlightVideoPackage = async () => {
    setIsGeneratingHighlight(true);
    setShowHighlightModal(true);
    try {
      const response = await fetch('/api/highlights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamName: team ? `${team.city} ${team.name}` : 'Home Team',
          awayTeamName: opponentTeam ? `${opponentTeam.city} ${opponentTeam.name}` : 'Away Team',
          homeScore: gameState.homeScore,
          awayScore: gameState.awayScore,
          week: currentWeek,
          scoringSummary,
          keyPlays: playHistory.slice(0, 8)
        })
      });
      const data = await response.json();
      if (data.success && data.script) {
        setHighlightPackage({
          headline: data.script.headline,
          commentary: data.script.commentary,
          videoPrompt: data.script.videoPrompt,
          topPlay: data.script.topPlay,
          videoUrl: data.videoUrl,
          videoStatus: data.videoStatus
        });
      }
    } catch (err) {
      console.error('Failed to generate highlight video package:', err);
    } finally {
      setIsGeneratingHighlight(false);
    }
  };

  // Detailed Match Statistics State
  const [matchStats, setMatchStats] = useState({
    home: {
      passYds: 0,
      rushYds: 0,
      passTds: 0,
      rushTds: 0,
      passAtt: 0,
      passComp: 0,
      rushAtt: 0,
      intsThrown: 0,
      fumblesLost: 0,
      sacksAllowed: 0,
      fgMade: 0,
      fgAtt: 0,
    },
    away: {
      passYds: 0,
      rushYds: 0,
      passTds: 0,
      rushTds: 0,
      passAtt: 0,
      passComp: 0,
      rushAtt: 0,
      intsThrown: 0,
      fumblesLost: 0,
      sacksAllowed: 0,
      fgMade: 0,
      fgAtt: 0,
    }
  });

  useEffect(() => {
    // This week's game for the user's team, if it hasn't been played yet
    const nextMatch = schedule.find(m =>
      m.week === currentWeek && !m.isCompleted &&
      (m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId)
    );
    if (nextMatch) {
      setOpponentTeamId(nextMatch.homeTeamId === selectedTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId);
      setIsUserHome(nextMatch.homeTeamId === selectedTeamId);
      setHasScheduledGame(true);
    } else {
      setHasScheduledGame(false);
    }
  }, [selectedTeamId, schedule, currentWeek]);
  
  const [activeWeatherPreset, setActiveWeatherPreset] = useState<WeatherConfig>(WEATHER_PRESETS['Clear']);
  const [gameState, setGameState] = useState({
    down: 1,
    distance: 10,
    ballOn: 25, // Own 25
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    possession: 'HOME', // User is HOME
    weather: WEATHER_PRESETS['Clear']
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [playHistory, setPlayHistory] = useState<GameEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [winProb, setWinProb] = useState(50);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);

  // Function to change weather condition preset
  const handleWeatherToggle = (key: string) => {
    const preset = WEATHER_PRESETS[key] || WEATHER_PRESETS['Clear'];
    setActiveWeatherPreset(preset);
    setGameState(prev => ({ ...prev, weather: preset }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTeamRoster = (teamId: string) => allPlayers.filter(p => p.teamId === teamId);

  // Depth-chart starter at a position (depth 1 first, then best overall)
  const starterAt = (roster: Player[], position: Position): Player | undefined =>
    roster
      .filter(p => p.position === position)
      .sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || b.overall - a.overall)[0];

  const calculateOutcome = (play: Play): GameEvent => {
    const isUserOffense = gameState.possession === 'HOME';
    const offTeamId = isUserOffense ? selectedTeamId : opponentTeamId;
    
    const roster = getTeamRoster(offTeamId);
    const qb = roster.find(p => p.position === Position.QB) || roster[0] || { name: 'Quarterback', overall: 80, schemeOvr: 80 };
    const topWr = roster.find(p => p.position === Position.WR) || roster[0] || { name: 'Wide Receiver', overall: 80 };
    
    // Global Multipliers based on Climate Weather Preset
    const hfaBoost = isUserOffense ? 3 : 0; // Home Field Advantage
    const weather = gameState.weather || activeWeatherPreset;
    const passAccMod = weather.passModifier ?? 1.0;
    const rushEffMod = weather.rushModifier ?? 1.0;
    const fumbleRiskMod = weather.fumbleRisk ?? 0.015;
    const kickingMod = weather.kickingModifier ?? 1.0;
    const windPen = weather.windSpeed > 12 ? (weather.windSpeed - 12) * 0.008 : 0;

    let yardage = 0;
    let description = '';
    let isScore = false;
    let type: GameEvent['type'] = play.type;

    if (play.type === 'Special') {
      if (play.name === 'Field Goal') {
        const distance = 100 - gameState.ballOn + 17;
        const successProb = ((distance < 40 ? 0.95 : distance < 50 ? 0.75 : 0.45) - windPen) * kickingMod;
        
        if (Math.random() < Math.max(0.05, successProb)) {
          isScore = true;
          description = `FIELD GOAL GOOD! A ${distance}-yard kick splits the uprights despite ${weather.type.toLowerCase()} weather.`;
        } else {
          description = `MISSED FIELD GOAL! The ${distance}-yard attempt is blown off course by ${weather.windSpeed} MPH winds.`;
          type = 'Turnover';
        }
      } else if (play.name === 'Punt') {
        yardage = Math.floor((Math.random() * 15 + 35 - (weather.windSpeed / 3)) * kickingMod);
        description = `PUNT! A high spiraling kick for ${Math.floor(yardage)} yards.`;
        type = 'Turnover';
      }
      return { description, yardage, isScore, type };
    }

    // GDD Refined Simulation Engine Formulas with Weather Climate Modifiers
    if (play.type === 'Pass') {
      const qbAcc = (((qb.schemeOvr || qb.overall) + hfaBoost) / 100) * passAccMod;
      const wrCth = ((topWr.overall) / 100) * passAccMod;
      const dbCov = 0.82;
      const pressure = Math.random() * 0.3;
      
      const pComp = (0.45 + (qbAcc * 0.3) + (wrCth * 0.2) - (dbCov * 0.4) - (pressure * 0.15)) - windPen;
      const roll = Math.random();

      if (roll < (0.025 + (1 - passAccMod) * 0.05)) {
        type = 'Turnover';
        description = `INTERCEPTED! The QB misread coverage in adverse ${weather.type} climate.`;
        yardage = 0;
      } else if (roll < pComp) {
        const isBigPlay = Math.random() < ((qb.overall / 300) * passAccMod);
        yardage = isBigPlay ? Math.floor(Math.random() * 25) + 20 : Math.floor(Math.random() * 12) + 4;
        description = `Complete to ${topWr.name} for ${yardage} yards.`;
      } else {
        const isSack = Math.random() < 0.12;
        if (isSack) {
          yardage = -Math.floor(Math.random() * 7) - 3;
          description = `SACK! The pocket collapsed for a ${Math.abs(yardage)} yard loss.`;
        } else {
          description = `Incomplete pass intended for ${topWr.name}.`;
        }
      }
    } else if (play.type === 'Run') {
      const rb = roster.find(p => p.position === Position.RB) || roster[0] || { name: 'Running Back', overall: 80 };
      const rbPower = ((rb.overall + hfaBoost) / 100) * rushEffMod;
      const linePush = 0.75 * rushEffMod;
      
      const successProb = 0.55 + (rbPower * 0.1) + (linePush * 0.1);
      const roll = Math.random();

      if (roll < fumbleRiskMod) {
        type = 'Turnover';
        description = `FUMBLE! Loose ball stripped on slippery field conditions during ${weather.label}.`;
        yardage = 1;
      } else if (roll < successProb) {
        const isBigPlay = Math.random() < ((rb.overall / 400) * rushEffMod);
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
    if (isSimulating || isGameOver) return;
    setIsSimulating(true);

    const playTime = Math.floor(Math.random() * 25) + 15; // 15-40 seconds
    const nextTime = Math.max(0, timeRemaining - playTime);

    setTimeout(() => {
      const outcome = calculateOutcome(play);
      setLastEvent(outcome);
      setPlayHistory(prev => [outcome, ...prev]);

      const possessionKey = gameState.possession === 'HOME' ? 'home' : 'away';

      // Capture Match stats details
      setMatchStats(prev => {
        const nextStats = JSON.parse(JSON.stringify(prev));
        const active = nextStats[possessionKey];

        if (play.type === 'Pass') {
          active.passAtt += 1;
          if (outcome.description.includes('Complete')) {
            active.passComp += 1;
            active.passYds += outcome.yardage;
          } else if (outcome.description.includes('SACK')) {
            active.sacksAllowed += 1;
            active.passYds += outcome.yardage; // Negative yardage
          } else if (outcome.description.includes('INTERCEPTED')) {
            active.intsThrown += 1;
          }
        } else if (play.type === 'Run') {
          active.rushAtt += 1;
          if (outcome.description.includes('FUMBLE')) {
            active.fumblesLost += 1;
          } else {
            active.rushYds += outcome.yardage;
          }
        } else if (play.type === 'Special') {
          if (play.name === 'Field Goal') {
            active.fgAtt += 1;
            if (outcome.isScore) {
              active.fgMade += 1;
            }
          }
        }

        if (outcome.isScore && !outcome.description.includes('FIELD GOAL')) {
          if (play.type === 'Pass') active.passTds += 1;
          if (play.type === 'Run') active.rushTds += 1;
        }

        return nextStats;
      });

      // Capture scoring timeline
      if (outcome.isScore) {
        const addedHomePoints = outcome.description.includes('FIELD GOAL') ? 3 : 7;
        const currentHomeScore = gameState.possession === 'HOME' ? gameState.homeScore + addedHomePoints : gameState.homeScore;
        const currentAwayScore = gameState.possession === 'AWAY' ? gameState.awayScore + addedHomePoints : gameState.awayScore;

        setScoringSummary(prev => [
          ...prev,
          {
            quarter: gameState.quarter,
            timeLeft: formatTime(nextTime),
            teamId: gameState.possession === 'HOME' ? selectedTeamId : opponentTeamId,
            type: outcome.description.includes('FIELD GOAL') ? 'FG' : 'TD',
            description: outcome.description,
            score: {
              home: currentHomeScore,
              away: currentAwayScore
            }
          }
        ]);
      }

      updateGameState(outcome);
      setTimeRemaining(nextTime);
      setIsSimulating(false);

      // Fluctuating Win Probability calculations
      setWinProb(prev => {
          let change = 0;
          if (outcome.isScore) change = 6;
          else if (outcome.yardage > 15) change = 3;
          else if (outcome.yardage < 0) change = -2;
          else if (outcome.type === 'Turnover') change = -12;
          
          return Math.min(99, Math.max(1, prev + (gameState.possession === 'HOME' ? change : -change)));
      });

      if (nextTime <= 0) {
        setIsGameOver(true);
      }

    }, 1500);
  };

  const updateGameState = (event: GameEvent) => {
    setGameState(prev => {
        let nextState = { ...prev };

        // Handle Quarters transition dynamically
        if (timeRemaining <= 7.5 * 60 && prev.quarter === 1) {
          nextState.quarter = 2;
        }

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

        return {
            ...prev,
            quarter: nextState.quarter,
            ballOn: newBallOn,
            down: newDown,
            distance: newDist
        };
    });
  };

  // Auto-simulate opponent turn
  useEffect(() => {
    if (gameState.possession === 'AWAY' && !isSimulating && !isGameOver) {
        const timer = setTimeout(() => {
            const randomPlay = OFFENSIVE_PLAYS[Math.floor(Math.random() * (OFFENSIVE_PLAYS.length - 2))]; 
            handlePlayCall(randomPlay);
        }, 1800);
        return () => clearTimeout(timer);
    }
  }, [gameState.possession, isSimulating, isGameOver]);

  // Credits starter stats, reports the result to App, and finishes the session
  const saveAndExitGame = () => {
    // 1. Accumulate simulated stats onto the depth-chart starters only
    const roster = getTeamRoster(selectedTeamId);
    const qb1 = starterAt(roster, Position.QB) as Player | undefined;
    const rb1 = starterAt(roster, Position.RB) as Player | undefined;
    const wr1 = starterAt(roster, Position.WR) as Player | undefined;
    setAllPlayers(prev => prev.map(player => {
      if (player.id === qb1?.id) {
        return {
          ...player,
          stats: {
            ...player.stats,
            gamesPlayed: (player.stats.gamesPlayed || 0) + 1,
            completions: (player.stats.completions || 0) + matchStats.home.passComp,
            attempts: (player.stats.attempts || 0) + matchStats.home.passAtt,
            yards: (player.stats.yards || 0) + matchStats.home.passYds,
            touchdowns: (player.stats.touchdowns || 0) + matchStats.home.passTds,
            interceptions: (player.stats.interceptions || 0) + matchStats.home.intsThrown,
            rating: parseFloat((((player.stats.rating || 100) * (player.stats.gamesPlayed || 1) + 106) / ((player.stats.gamesPlayed || 1) + 1)).toFixed(1))
          }
        };
      }
      if (player.id === rb1?.id) {
        return {
          ...player,
          stats: {
            ...player.stats,
            gamesPlayed: (player.stats.gamesPlayed || 0) + 1,
            yards: (player.stats.yards || 0) + matchStats.home.rushYds,
            touchdowns: (player.stats.touchdowns || 0) + matchStats.home.rushTds,
          }
        };
      }
      if (player.id === wr1?.id) {
        return {
          ...player,
          stats: {
            ...player.stats,
            gamesPlayed: (player.stats.gamesPlayed || 0) + 1,
            yards: (player.stats.yards || 0) + Math.floor(matchStats.home.passYds * 0.7),
            touchdowns: (player.stats.touchdowns || 0) + Math.floor(matchStats.home.passTds * 0.7),
          }
        };
      }
      return player;
    }));

    // 2. Report the result to App in real schedule orientation. The sim always
    // renders the user as HOME internally, so remap through isUserHome.
    onGameComplete({
      week: currentWeek,
      homeTeamId: isUserHome ? selectedTeamId : opponentTeamId,
      awayTeamId: isUserHome ? opponentTeamId : selectedTeamId,
      homeScore: isUserHome ? gameState.homeScore : gameState.awayScore,
      awayScore: isUserHome ? gameState.awayScore : gameState.homeScore,
    });

    // 3. Relocate to HQ Dashboard
    setView(AppView.DASHBOARD);
  };

  const userRoster = getTeamRoster(selectedTeamId);
  const homeQb = starterAt(userRoster, Position.QB) || { name: 'C. Stroud', overall: 91 };
  const homeRb = starterAt(userRoster, Position.RB) || { name: 'J. Mixon', overall: 84 };
  const homeWr = starterAt(userRoster, Position.WR) || { name: 'N. Collins', overall: 89 };

  const oppRoster = getTeamRoster(opponentTeamId);
  const awayQb = starterAt(oppRoster, Position.QB) || { name: 'Opp QB', overall: 85 };
  const awayRb = starterAt(oppRoster, Position.RB) || { name: 'Opp RB', overall: 80 };
  const awayWr = starterAt(oppRoster, Position.WR) || { name: 'Opp WR', overall: 82 };

  if (!hasScheduledGame) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#05070a] gap-6">
        <Shield size={48} className="text-slate-700" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white header-font uppercase italic tracking-widest">No Game Scheduled</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mono-font mt-3">
            WEEK {currentWeek.toString().padStart(2, '0')} // BYE_WEEK_OR_GAME_ALREADY_RESOLVED
          </div>
        </div>
        <button
          onClick={() => setView(AppView.DASHBOARD)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
        >
          Return to HQ
        </button>
      </div>
    );
  }

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
                             <p className="text-slate-500 text-sm font-mono tracking-widest uppercase italic opacity-85">{lastEvent.description}</p>
                             
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

                {/* Environmental Readout & Climate Selector Toggle */}
                <div className="absolute top-10 right-10 flex flex-col items-end gap-2 z-20">
                     <div className="bg-[#0a0e14]/95 border border-[#1a222e] p-4 backdrop-blur shadow-2xl flex flex-col gap-3 font-mono max-w-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-[#1a222e] pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                    {gameState.weather.type === 'Clear' ? <Sun size={16} /> : 
                                     gameState.weather.type === 'Rain' ? <CloudRain size={16} /> : 
                                     gameState.weather.type === 'Snow' ? <CloudSnow size={16} /> : 
                                     gameState.weather.type === 'Dome' ? <Shield size={16} /> :
                                     <Wind size={16} />}
                                </div>
                                <div>
                                    <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">CLIMATE_SIMULATOR</div>
                                    <div className="text-xs text-white font-bold tracking-tight">
                                        {gameState.weather.label} ({gameState.weather.temp}°F)
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-cyan-400 font-bold block">{gameState.weather.windSpeed} MPH</span>
                                <span className="text-[9px] text-slate-500 block">WIND VECTOR</span>
                            </div>
                        </div>

                        {/* Climate Selector Toggles */}
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                            {Object.keys(WEATHER_PRESETS).map((key) => {
                                const preset = WEATHER_PRESETS[key];
                                const isActive = gameState.weather.type === preset.type;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleWeatherToggle(key)}
                                        className={`px-2 py-1 text-[9px] font-bold uppercase transition-all whitespace-nowrap border ${
                                            isActive 
                                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,209,255,0.4)]' 
                                                : 'bg-[#05070a] text-slate-400 border-[#1a222e] hover:border-slate-700 hover:text-white'
                                        }`}
                                    >
                                        {preset.type}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tactical Climate Impact Chips */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#1a222e]">
                            <div className="bg-[#05070a] px-2 py-1 border border-[#1a222e] flex justify-between items-center text-[9px]">
                                <span className="text-slate-500">PASS ACC</span>
                                <span className={`font-bold ${gameState.weather.passModifier >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {gameState.weather.passModifier >= 1 ? `+${Math.round((gameState.weather.passModifier - 1) * 100)}%` : `${Math.round((gameState.weather.passModifier - 1) * 100)}%`}
                                </span>
                            </div>
                            <div className="bg-[#05070a] px-2 py-1 border border-[#1a222e] flex justify-between items-center text-[9px]">
                                <span className="text-slate-500">RUSH EFF</span>
                                <span className={`font-bold ${gameState.weather.rushModifier >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {gameState.weather.rushModifier >= 1 ? `+${Math.round((gameState.weather.rushModifier - 1) * 100)}%` : `${Math.round((gameState.weather.rushModifier - 1) * 100)}%`}
                                </span>
                            </div>
                            <div className="bg-[#05070a] px-2 py-1 border border-[#1a222e] flex justify-between items-center text-[9px]">
                                <span className="text-slate-500">KICK RANGE</span>
                                <span className={`font-bold ${gameState.weather.kickingModifier >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {gameState.weather.kickingModifier >= 1 ? `+${Math.round((gameState.weather.kickingModifier - 1) * 100)}%` : `${Math.round((gameState.weather.kickingModifier - 1) * 100)}%`}
                                </span>
                            </div>
                            <div className="bg-[#05070a] px-2 py-1 border border-[#1a222e] flex justify-between items-center text-[9px]">
                                <span className="text-slate-500">FUMBLE RISK</span>
                                <span className={`font-bold ${gameState.weather.fumbleRisk > 0.02 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                                    {gameState.weather.fumbleRisk > 0.02 ? 'HIGH' : 'NORMAL'}
                                </span>
                            </div>
                        </div>

                        <div className="text-[9px] text-slate-400 italic leading-tight pt-1 border-t border-[#1a222e]">
                            💡 {gameState.weather.description}
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
                            <div className="text-slate-400 leading-relaxed uppercase opacity-85">{play.description}</div>
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
                        disabled={isSimulating || gameState.possession === 'AWAY' || isGameOver}
                        onClick={() => handlePlayCall(play)}
                        className="bg-[#05070a] border border-[#1a222e] hover:border-cyan-500/60 hover:bg-cyan-500/5 p-5 text-left transition-all group relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed rounded-none h-24"
                    >
                        <div className="absolute top-0 right-0 w-[1px] h-0 bg-cyan-500 group-hover:h-full transition-all duration-300"></div>

                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-400 tracking-tight transition-colors mono-font uppercase">{play.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-widest ${
                                play.type === 'Pass' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20' : 
                                play.type === 'Run' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' :
                                'bg-purple-900/20 text-purple-400 border border-purple-500/20'
                            }`}>
                                {play.type}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mb-2 tracking-tighter bg-[#0d121a] px-2 py-0.5 border-l border-slate-700 inline-block">{play.formation}</div>
                        
                        <div className="flex gap-4 text-[9px] font-mono text-slate-500 mt-auto uppercase">
                            <div className="flex items-center gap-1 group-hover:text-red-500 transition-colors">
                                <div className="w-1.5 h-1.5 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]"></div> RISK::{play.risk}
                            </div>
                            <div className="flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                                <div className="w-1.5 h-1.5 bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]"></div> REW::{play.reward}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* BREATHTAKING MATCH RECAP OVERLAY MODAL */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="max-w-5xl w-full bg-[#0a0e14] border border-[#1a222e] shadow-[0_0_60px_rgba(0,209,255,0.15)] relative flex flex-col max-h-[92vh] overflow-hidden rounded-none"
              >
                {/* Glowing neon header borders */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-500 shadow-[0_0_15px_rgba(0,209,255,0.5)]"></div>

                {/* Scoreboard and Names */}
                <div className="bg-[#0d121a] border-b border-[#1a222e] p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 grid-lines opacity-10"></div>
                  <div className="text-[10px] text-cyan-400 font-mono tracking-[0.4em] mb-3 uppercase font-bold text-center italic">/// STATS::COMMUNICATION_SESSION_COMPLETE ///</div>
                  
                  <div className="flex justify-center items-center gap-16 relative z-10">
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white header-font tracking-tight uppercase italic">{selectedTeamId}</div>
                      <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">HOME TEAM</div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <span className="text-6xl font-mono font-bold text-cyan-400 tracking-tighter">{gameState.homeScore}</span>
                      <span className="text-[#1a222e] font-bold text-2xl font-mono tracking-widest">FINAL</span>
                      <span className="text-6xl font-mono font-bold text-red-500 tracking-tighter">{gameState.awayScore}</span>
                    </div>

                    <div className="text-left">
                      <div className="text-4xl font-bold text-slate-600 header-font tracking-tight uppercase italic">{opponentTeamId}</div>
                      <div className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">AWAY TEAM</div>
                    </div>
                  </div>
                </div>

                {/* Main 3-Column Splitscreen Board */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#1a222e]">
                  
                  {/* Column 1: Team Stat Comparison */}
                  <div className="p-6 space-y-6">
                    <h4 className="text-[10px] font-bold text-cyan-500 font-mono tracking-[0.3em] uppercase border-b border-[#1a222e] pb-3 flex items-center gap-2">
                      <BarChart2 size={14} />
                      TEAM_COMPARISON_MATRIX
                    </h4>
                    
                    <div className="space-y-4 pt-2 font-mono text-xs">
                      {/* STATS ITEMS */}
                      {[
                        { label: 'TOTAL OFFENSIVE YARDS', valH: matchStats.home.passYds + matchStats.home.rushYds, valA: matchStats.away.passYds + matchStats.away.rushYds },
                        { label: 'PASSING YARDS', valH: matchStats.home.passYds, valA: matchStats.away.passYds },
                        { label: 'RUSHING YARDS', valH: matchStats.home.rushYds, valA: matchStats.away.rushYds },
                        { label: 'COMP / ATT', valH: `${matchStats.home.passComp}/${matchStats.home.passAtt}`, valA: `${matchStats.away.passComp}/${matchStats.away.passAtt}` },
                        { label: 'TOUCHDOWNS', valH: matchStats.home.passTds + matchStats.home.rushTds, valA: matchStats.away.passTds + matchStats.away.rushTds },
                        { label: 'INTERCEPTIONS THROWN', valH: matchStats.home.intsThrown, valA: matchStats.away.intsThrown },
                        { label: 'FUMBLES LOST', valH: matchStats.home.fumblesLost, valA: matchStats.away.fumblesLost },
                        { label: 'SACKS SUFFERED', valH: matchStats.home.sacksAllowed, valA: matchStats.away.sacksAllowed },
                        { label: 'FIELD GOALS MADE', valH: `${matchStats.home.fgMade}/${matchStats.home.fgAtt}`, valA: `${matchStats.away.fgMade}/${matchStats.away.fgAtt}` }
                      ].map((s, idx) => (
                        <div key={idx} className="pb-3 border-b border-[#1a222e]/30">
                          <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase mb-1.5 tracking-tight">{s.label}</div>
                          <div className="flex justify-between items-center bg-[#05070a] border border-[#1a222e]/60 px-3 py-1.5">
                            <span className="text-cyan-400 font-bold">{s.valH}</span>
                            <div className="text-[9px] text-slate-700 font-bold">||</div>
                            <span className="text-red-400 font-bold">{s.valA}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Top Performers Cards */}
                  <div className="p-6 space-y-6">
                    <h4 className="text-[10px] font-bold text-cyan-500 font-mono tracking-[0.3em] uppercase border-b border-[#1a222e] pb-3 flex items-center gap-2">
                      <Award size={14} />
                       locker_room_TOP_PERFORMERS
                    </h4>

                    <div className="space-y-4 pt-2 font-mono">
                      {/* HOME Passer */}
                      <div className="bg-[#05070a] border border-[#1a222e] p-4 relative group">
                        <div className="text-[8px] tracking-widest bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 inline-block mb-3 uppercase font-bold">HOME PASSING LEADER</div>
                        <h5 className="text-sm font-bold text-white uppercase">{homeQb.name} <span className="text-[9px] text-slate-500">OVR {homeQb.overall}</span></h5>
                        <p className="text-[11px] text-slate-400 mt-2 uppercase">{matchStats.home.passComp} of {matchStats.home.passAtt} passes // {matchStats.home.passYds} Yards // {matchStats.home.passTds} touchdowns // {matchStats.home.intsThrown} interceptions</p>
                      </div>

                      {/* HOME Rusher */}
                      <div className="bg-[#05070a] border border-[#1a222e] p-4 relative group">
                        <div className="text-[8px] tracking-widest bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 inline-block mb-3 uppercase font-bold">HOME RUSHING LEADER</div>
                        <h5 className="text-sm font-bold text-white uppercase">{homeRb.name} <span className="text-[9px] text-slate-500">OVR {homeRb.overall}</span></h5>
                        <p className="text-[11px] text-slate-400 mt-2 uppercase">{matchStats.home.rushAtt} rushes // {matchStats.home.rushYds} Yards // {matchStats.home.rushTds} touchdowns</p>
                      </div>

                      <div className="h-[2px] bg-[#1a222e] my-4"></div>

                      {/* AWAY Passer */}
                      <div className="bg-[#05070a] border border-[#1a222e] p-4 relative group">
                        <div className="text-[8px] tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 inline-block mb-3 uppercase font-bold">AWAY PASSING LEADER</div>
                        <h5 className="text-sm font-bold text-white uppercase">{awayQb.name} <span className="text-[9px] text-slate-500">OVR {awayQb.overall}</span></h5>
                        <p className="text-[11px] text-slate-400 mt-2 uppercase">{matchStats.away.passComp} of {matchStats.away.passAtt} passes // {matchStats.away.passYds} Yards // {matchStats.away.passTds} touchdowns // {matchStats.away.intsThrown} interceptions</p>
                      </div>

                      {/* AWAY Rusher */}
                      <div className="bg-[#05070a] border border-[#1a222e] p-4 relative group">
                        <div className="text-[8px] tracking-widest bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 inline-block mb-3 uppercase font-bold">AWAY RUSHING LEADER</div>
                        <h5 className="text-sm font-bold text-white uppercase">{awayRb.name} <span className="text-[9px] text-slate-500">OVR {awayRb.overall}</span></h5>
                        <p className="text-[11px] text-slate-400 mt-2 uppercase">{matchStats.away.rushAtt} rushes // {matchStats.away.rushYds} Yards // {matchStats.away.rushTds} touchdowns</p>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Scoring Events Chronological sequence */}
                  <div className="p-6 space-y-6">
                    <h4 className="text-[10px] font-bold text-cyan-500 font-mono tracking-[0.3em] uppercase border-b border-[#1a222e] pb-3 flex items-center gap-2">
                      <ListFilter size={14} />
                      SCORING_TIMELINE_SEQUENCING
                    </h4>

                    <div className="space-y-4 pt-2 overflow-y-auto max-h-[480px] pr-2">
                      {scoringSummary.map((event, index) => (
                        <div key={index} className="p-3 bg-[#05070a] border border-[#1a222e] font-mono text-[10.5px]">
                          <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-[#1a222e]/40">
                            <span className="text-cyan-400 font-bold uppercase tracking-widest">Q{event.quarter} - {event.timeLeft}</span>
                            <span className={`px-1.5 py-0.2 text-[8px] font-bold border ${event.type === 'TD' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>{event.type}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed uppercase tracking-tighter">{event.description}</p>
                          <div className="text-[9px] text-slate-500 mt-2 font-bold text-right">RUN_SCORE: {event.score.home} - {event.score.away}</div>
                        </div>
                      ))}
                      {scoringSummary.length === 0 && (
                        <div className="text-center text-[10px] text-slate-700 font-mono tracking-[0.4em] uppercase py-16 italic">NO_SCORES_SEQUENCED</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer and exit buttons */}
                <div className="bg-[#0c1017] border-t border-[#1a222e] p-6 flex justify-between items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Activity size={14} className="text-cyan-500 animate-pulse" />
                    <span>HQ DATABASE SYNC STABLE // W-L STANDINGS COMMITTED // CAREER STATISTICS MODIFIED S_RECORD</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchHighlightVideoPackage}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-[0.2em] text-[10px] px-6 py-3.5 border border-amber-400 flex items-center gap-2 transition-all font-mono shadow-lg"
                    >
                      <Film size={14} />
                      VEO 3 HIGHLIGHT PACKAGE
                    </button>
                    <button 
                      onClick={saveAndExitGame}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-[0.3em] text-[10px] px-8 py-3.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all font-mono"
                    >
                      EXIT TO HQ
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 16:9 Weekly Highlight Video Package Modal */}
        <AnimatePresence>
          {showHighlightModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-[#0a0e14] border border-amber-500/50 w-full max-w-4xl p-6 shadow-2xl relative font-mono">
                <button
                  onClick={() => setShowHighlightModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  ✕ CLOSE
                </button>

                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#1a222e]">
                  <Film className="text-amber-400 animate-pulse" size={24} />
                  <div>
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block">
                      VEO 3.1 AI HIGHLIGHT VIDEO ENGINE // 16:9 BROADCAST REEL
                    </span>
                    <h3 className="text-xl font-bold text-white header-font uppercase italic">
                      {highlightPackage?.headline || `${team.name} vs ${opponentTeam.name} Weekly Highlights`}
                    </h3>
                  </div>
                </div>

                {isGeneratingHighlight ? (
                  <div className="aspect-video bg-[#05070a] border border-[#1a222e] flex flex-col items-center justify-center space-y-4 p-8">
                    <RefreshCw className="animate-spin text-amber-400" size={36} />
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      GENERATING VEO 3.1 BROADCAST HIGHLIGHT REEL...
                    </p>
                    <p className="text-[10px] text-slate-500 max-w-md text-center">
                      Synthesizing 16:9 slow-motion touchdown sequences, stadium crowd ambience, and AI commentary broadcast script...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 16:9 Video Player Container */}
                    <div className="aspect-video bg-gradient-to-br from-slate-950 via-[#0a0e14] to-amber-950/30 border border-amber-500/30 relative overflow-hidden flex flex-col justify-between p-6 group">
                      {/* Stadium Floodlight Grid Lines Visual */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none"></div>

                      {/* Header Overlays */}
                      <div className="flex justify-between items-center relative z-10">
                        <span className="px-2.5 py-1 bg-red-600/90 text-white font-bold text-[9px] uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                          <Radio size={12} /> LIVE BROADCAST REEL
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">16:9 HIGH DEFINITION</span>
                      </div>

                      {/* Simulated Motion Play / Video Canvas overlay */}
                      <div className="my-auto text-center relative z-10 py-6">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.4)]" onClick={() => setIsVideoPlaying(!isVideoPlaying)}>
                          {isVideoPlaying ? <Tv className="text-amber-400" size={28} /> : <PlayIcon className="text-amber-400 ml-1" size={28} />}
                        </div>
                        <h4 className="text-2xl font-bold text-white header-font uppercase tracking-tight italic">
                          {highlightPackage?.topPlay || '4th Quarter Game-Winning Touchdown Drive'}
                        </h4>
                        <p className="text-xs text-amber-300 mt-1 uppercase font-bold">
                          {team.name} {gameState.homeScore} — {opponentTeam.name} {gameState.awayScore}
                        </p>
                      </div>

                      {/* Video Player Bottom Controls Bar */}
                      <div className="flex justify-between items-center pt-2 border-t border-amber-500/20 relative z-10 text-[10px] text-slate-300">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setIsVideoPlaying(!isVideoPlaying)} className="hover:text-amber-400 font-bold">
                            {isVideoPlaying ? 'PAUSE' : 'PLAY'}
                          </button>
                          <span>00:45 / 01:30</span>
                        </div>
                        <span className="text-[9px] text-slate-500 italic">VEO 3.1 FAST GENERATE PREVIEW (16:9)</span>
                      </div>
                    </div>

                    {/* AI Anchor Commentary Script */}
                    <div className="bg-[#05070a] border border-[#1a222e] p-4 space-y-2 text-xs text-slate-300">
                      <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block">
                        NFL NETWORK HIGHLIGHT DESK COMMENTARY SCRIPT
                      </span>
                      {highlightPackage?.commentary?.map((line, i) => (
                        <p key={i} className="leading-relaxed">
                          • {line}
                        </p>
                      ))}
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => setShowHighlightModal(false)}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        CLOSE HIGHLIGHT REEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default MatchSim;
