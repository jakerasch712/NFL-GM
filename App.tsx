import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import RosterView from './components/RosterView';
import FreeAgency from './components/FreeAgency';
import TradeCenter from './components/TradeCenter';
import GamePlan from './components/GamePlan';
import MatchSim from './components/MatchSim';
import DraftRoom from './components/DraftRoom';
import StaffView from './components/StaffView';
import ScoutingView from './components/ScoutingView';
import HallOfFame from './components/HallOfFame';
import TeamSelection from './components/TeamSelection';
import { AppView, DraftProspect, DraftPick, Scout, LeagueState, LeaguePhase, Player, Coach, TradeRecord, ScheduleMatch } from './types';
import { DRAFT_CLASS, INITIAL_PICKS, MOCK_SCOUTS, TEAMS_DB, MOCK_PLAYERS, MOCK_COACHES } from './constants';
import { nflverseService } from './services/nflverseService';
import { LEAGUE_PLAYERS, LEAGUE_SCHEDULE } from './data/leagueData';
import { GameResult, applyCompletedGame, simulateWeek } from './services/leagueSimService';
import { loadSave, persistSave } from './services/saveService';

// Read the save file once per page load; every initializer below falls back to seed data.
const savedState = loadSave();

const App: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(savedState?.selectedTeamId ?? null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [teams, setTeams] = useState<Record<string, any>>(savedState?.teams ?? TEAMS_DB);
  const [allPlayers, setAllPlayers] = useState<Player[]>(
    savedState?.allPlayers ?? (LEAGUE_PLAYERS.length ? LEAGUE_PLAYERS : MOCK_PLAYERS)
  );
  const [coaches, setCoaches] = useState<Coach[]>(savedState?.coaches ?? MOCK_COACHES);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(savedState?.tradeHistory ?? []);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const nflTeams = await nflverseService.fetchTeams().catch(() => []);

        if (nflTeams && nflTeams.length > 0) {
          setTeams(prev => {
            const newTeams = { ...prev };
            nflTeams.forEach(nt => {
              if (newTeams[nt.team_abbr]) {
                newTeams[nt.team_abbr] = {
                  ...newTeams[nt.team_abbr],
                  name: nt.team_nick,
                  city: nt.team_name.replace(nt.team_nick, '').trim(),
                  logo: nt.team_logo_espn || nt.team_logo_wikipedia,
                  primaryColor: nt.team_color,
                  secondaryColor: nt.team_color2
                };
              }
            });
            return newTeams;
          });
        }
      } catch (err) {
        console.warn('Initialization using default local databases:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);
  
  // Global State
  const [prospects, setProspects] = useState<DraftProspect[]>(savedState?.prospects ?? DRAFT_CLASS);
  const [scouts, setScouts] = useState<Scout[]>(savedState?.scouts ?? MOCK_SCOUTS);
  const [picks, setPicks] = useState<DraftPick[]>(savedState?.picks ?? INITIAL_PICKS);
  const [schedule, setSchedule] = useState<ScheduleMatch[]>(savedState?.schedule ?? LEAGUE_SCHEDULE);
  const [leagueState, setLeagueState] = useState<LeagueState>(savedState?.leagueState ?? {
    currentPhase: LeaguePhase.REGULAR_SEASON,
    week: 1,
    year: 2027,
    salaryCap: 255.4,
    difficulty: 'Simulation'
  });

  // Debounced auto-save of the whole franchise. Skipped until a team is
  // selected so an empty session never overwrites a real save.
  useEffect(() => {
    if (loading || !selectedTeamId) return;
    const timer = setTimeout(() => {
      persistSave({
        selectedTeamId, teams, allPlayers, coaches, tradeHistory,
        prospects, scouts, picks, leagueState, schedule
      });
    }, 750);
    return () => clearTimeout(timer);
  }, [loading, selectedTeamId, teams, allPlayers, coaches, tradeHistory, prospects, scouts, picks, leagueState, schedule]);

  const rollWeekForward = () => {
    setLeagueState(prev => {
      if (prev.week >= 18) {
        return { ...prev, week: 1, currentPhase: LeaguePhase.PLAYOFFS };
      }
      return { ...prev, week: prev.week + 1 };
    });
  };

  // Advance Week button: resolve every remaining game this week (including the
  // user's, if unplayed), then move the calendar.
  const advanceWeek = () => {
    if (leagueState.currentPhase === LeaguePhase.REGULAR_SEASON) {
      const simmed = simulateWeek(leagueState.week, schedule, teams, allPlayers);
      setSchedule(simmed.schedule);
      setTeams(simmed.teams);
    }
    rollWeekForward();
  };

  // Called by MatchSim when the user finishes playing their game: record the
  // real result, sim the rest of the league's week, and advance.
  const completeUserGame = (result: GameResult) => {
    const afterUserGame = applyCompletedGame(schedule, teams, result);
    const simmed = simulateWeek(leagueState.week, afterUserGame.schedule, afterUserGame.teams, allPlayers);
    setSchedule(simmed.schedule);
    setTeams(simmed.teams);
    rollWeekForward();
  };

  const renderView = () => {
    if (!selectedTeamId) {
      return <TeamSelection onSelect={setSelectedTeamId} teams={teams} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} currentWeek={leagueState.week} teams={teams} allPlayers={allPlayers} schedule={schedule} />;
      case AppView.ROSTER:
        return <RosterView selectedTeamId={selectedTeamId} allPlayers={allPlayers} setAllPlayers={setAllPlayers} teams={teams} salaryCap={leagueState.salaryCap} />;
      case AppView.FREE_AGENCY:
        return <FreeAgency selectedTeamId={selectedTeamId} allPlayers={allPlayers} setAllPlayers={setAllPlayers} salaryCap={leagueState.salaryCap} />;
      case AppView.TRADE_CENTER:
        return (
          <TradeCenter 
            selectedTeamId={selectedTeamId} 
            allPlayers={allPlayers} 
            setAllPlayers={setAllPlayers}
            teams={teams} 
            tradeHistory={tradeHistory}
            setTradeHistory={setTradeHistory}
            currentWeek={leagueState.week}
          />
        );
      case AppView.GAMEPLAN:
        return (
          <GamePlan 
            selectedTeamId={selectedTeamId} 
            currentWeek={leagueState.week}
            allPlayers={allPlayers}
            setAllPlayers={setAllPlayers}
            teams={teams}
            schedule={schedule}
          />
        );
      case AppView.MATCH:
        return (
          <MatchSim
            selectedTeamId={selectedTeamId}
            allPlayers={allPlayers}
            setAllPlayers={setAllPlayers}
            teams={teams}
            currentWeek={leagueState.week}
            schedule={schedule}
            onGameComplete={completeUserGame}
            setView={setCurrentView}
          />
        );
      case AppView.DRAFT:
        return (
          <DraftRoom 
            selectedTeamId={selectedTeamId}
            prospects={prospects} 
            setProspects={setProspects} 
            picks={picks} 
            setPicks={setPicks}
            teams={teams}
            allPlayers={allPlayers}
            setAllPlayers={setAllPlayers}
          />
        );
      case AppView.STAFF:
        return <StaffView selectedTeamId={selectedTeamId} coaches={coaches} setCoaches={setCoaches} teams={teams} />;
      case AppView.SCOUTING:
        return (
          <ScoutingView 
            selectedTeamId={selectedTeamId}
            prospects={prospects} 
            setProspects={setProspects} 
            scouts={scouts} 
            setScouts={setScouts} 
          />
        );
      case AppView.HALL_OF_FAME:
        return (
          <HallOfFame
            selectedTeamId={selectedTeamId}
            allPlayers={allPlayers}
            teams={teams}
          />
        );
      default:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} currentWeek={leagueState.week} teams={teams} allPlayers={allPlayers} schedule={schedule} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      {/* Visual Effects Layer */}
      <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none"></div>
      <div className="scan-line"></div>

      {selectedTeamId && <Navigation currentView={currentView} setView={setCurrentView} selectedTeamId={selectedTeamId} teams={teams} allPlayers={allPlayers} salaryCap={leagueState.salaryCap} />}
      <main className="flex-1 relative overflow-hidden flex flex-col z-10">
        {/* League Status Bar */}
        {selectedTeamId && (
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex justify-between items-center z-10">
            <div className="flex gap-6 items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">League Year</span>
                <span className="text-sm font-bold text-white">{leagueState.year}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Phase</span>
                <span className="text-sm font-bold text-cyan-400">{leagueState.currentPhase.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Week</span>
                <span className="text-sm font-bold text-white">{leagueState.week}</span>
              </div>
            </div>
            
            <button
              onClick={advanceWeek}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(8,145,178,0.3)]"
            >
              ADVANCE WEEK
            </button>
          </div>
        )}
        
        <div className="flex-1 relative overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;