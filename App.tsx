import React, { useState, useEffect, useRef } from 'react';
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
import HallOfFame, { INITIAL_HALL_OF_FAMERS } from './components/HallOfFame';
import TeamSelection from './components/TeamSelection';
import { AppView, DraftProspect, DraftPick, Scout, LeagueState, LeaguePhase, Player, Coach, TradeRecord, ScheduleMatch, HallOfFamer, DraftSelection } from './types';
import { MOCK_SCOUTS, TEAMS_DB, MOCK_PLAYERS, MOCK_COACHES } from './constants';
import { ensureFullTeamRosters } from './data/nflRosters';
import { nflverseService } from './services/nflverseService';
import { LEAGUE_PLAYERS, LEAGUE_SCHEDULE } from './data/leagueData';
import { GameResult, applyCompletedGame, simulateWeek } from './services/leagueSimService';
import { loadSave, persistSave } from './services/saveService';
import { generateDraftClass, generateDraftOrder } from './services/draftService';
import { advanceInjuryClocks, rollGameInjuries } from './services/injuryService';
import { approvalAfterCapReview } from './services/approvalService';

const LEAGUE_YEAR = 2027;

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
        const [nflTeams, nflPlayers] = await Promise.all([
          nflverseService.fetchTeams().catch(() => []),
          nflverseService.fetchRosters(2024).catch(() => [])
        ]);
        
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

        if (!savedState && nflPlayers && nflPlayers.length > 0) {
          setAllPlayers(ensureFullTeamRosters([...nflPlayers, ...MOCK_PLAYERS]));
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
  const [prospects, setProspects] = useState<DraftProspect[]>(
    savedState?.prospects ?? generateDraftClass(LEAGUE_YEAR)
  );
  const [scouts, setScouts] = useState<Scout[]>(savedState?.scouts ?? MOCK_SCOUTS);
  const [picks, setPicks] = useState<DraftPick[]>(
    savedState?.picks ?? generateDraftOrder(LEAGUE_YEAR, TEAMS_DB)
  );
  const [schedule, setSchedule] = useState<ScheduleMatch[]>(savedState?.schedule ?? LEAGUE_SCHEDULE);
  const [inductees, setInductees] = useState<HallOfFamer[]>(savedState?.inductees ?? INITIAL_HALL_OF_FAMERS);
  const [draftHistory, setDraftHistory] = useState<DraftSelection[]>(savedState?.draftHistory ?? []);
  const [leagueState, setLeagueState] = useState<LeagueState>(savedState?.leagueState ?? {
    currentPhase: LeaguePhase.REGULAR_SEASON,
    week: 1,
    year: 2027,
    salaryCap: 255.4,
    difficulty: 'Simulation'
  });

  // Debounced auto-save of the whole franchise. Skipped until a team is
  // selected so an empty session never overwrites a real save.
  //
  // A plain debounce would starve during sustained activity — the AI draft
  // changes state every ~450ms, so a 750ms debounce would never fire and a
  // closed tab could lose an entire round. `lastSaveRef` caps how stale the
  // save is allowed to get regardless of how busy the app is.
  const lastSaveRef = useRef(Date.now());
  const MAX_SAVE_STALENESS_MS = 3000;

  useEffect(() => {
    if (loading || !selectedTeamId) return;
    const snapshot = {
      selectedTeamId, teams, allPlayers, coaches, tradeHistory,
      prospects, scouts, picks, leagueState, schedule, inductees, draftHistory
    };
    const overdue = Date.now() - lastSaveRef.current >= MAX_SAVE_STALENESS_MS;
    const commit = () => {
      persistSave(snapshot);
      lastSaveRef.current = Date.now();
    };
    if (overdue) {
      commit();
      return;
    }
    const timer = setTimeout(commit, 750);
    return () => clearTimeout(timer);
  }, [loading, selectedTeamId, teams, allPlayers, coaches, tradeHistory, prospects, scouts, picks, leagueState, schedule, inductees, draftHistory]);

  const rollWeekForward = () => {
    setLeagueState(prev => {
      if (prev.week >= 18) {
        return { ...prev, week: 1, currentPhase: LeaguePhase.PLAYOFFS };
      }
      return { ...prev, week: prev.week + 1 };
    });
  };

  // Shared tail for both ways a week can end: resolve the league's remaining
  // games, roll injuries, review the books, tick injury clocks, then advance.
  const closeOutWeek = (
    baseSchedule: ScheduleMatch[],
    baseTeams: Record<string, any>,
    basePlayers: Player[]
  ) => {
    const week = leagueState.week;
    const simmed = simulateWeek(week, baseSchedule, baseTeams, basePlayers);

    // Owners review cap health each week
    const reviewed = { ...simmed.teams };
    Object.keys(reviewed).forEach(id => {
      reviewed[id] = {
        ...reviewed[id],
        ...approvalAfterCapReview(
          reviewed[id],
          basePlayers.filter(p => p.teamId === id),
          leagueState.salaryCap
        ),
      };
    });

    setSchedule(simmed.schedule);
    setTeams(reviewed);
    // Functional update: MatchSim credits per-player stats in this same batch,
    // so we must build on the latest players rather than the stale closure.
    setAllPlayers(prev =>
      advanceInjuryClocks(
        rollGameInjuries(prev, simmed.playedTeams, week, leagueState.year),
        week
      )
    );
    rollWeekForward();
  };

  // Advance Week button: resolve every remaining game this week (including the
  // user's, if unplayed), then move the calendar.
  const advanceWeek = () => {
    if (leagueState.currentPhase !== LeaguePhase.REGULAR_SEASON) {
      rollWeekForward();
      return;
    }
    closeOutWeek(schedule, teams, allPlayers);
  };

  // Called by MatchSim when the user finishes playing their game: record the
  // real result, then close out the week like any other.
  const completeUserGame = (result: GameResult) => {
    const afterUserGame = applyCompletedGame(schedule, teams, result);
    closeOutWeek(afterUserGame.schedule, afterUserGame.teams, allPlayers);
  };

  const renderView = () => {
    if (!selectedTeamId) {
      return <TeamSelection onSelect={setSelectedTeamId} teams={teams} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} currentWeek={leagueState.week} teams={teams} allPlayers={allPlayers} schedule={schedule} salaryCap={leagueState.salaryCap} />;
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
            draftHistory={draftHistory}
            setDraftHistory={setDraftHistory}
          />
        );
      case AppView.STAFF:
        return <StaffView selectedTeamId={selectedTeamId} coaches={coaches} setCoaches={setCoaches} teams={teams} schedule={schedule} tradeHistory={tradeHistory} />;
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
            inductees={inductees}
            setInductees={setInductees}
          />
        );
      default:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} currentWeek={leagueState.week} teams={teams} allPlayers={allPlayers} schedule={schedule} salaryCap={leagueState.salaryCap} />;
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
