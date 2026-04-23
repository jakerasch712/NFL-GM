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
import TeamSelection from './components/TeamSelection';
import { AppView, DraftProspect, DraftPick, Scout, LeagueState, LeaguePhase } from './types';
import { DRAFT_CLASS, INITIAL_PICKS, MOCK_SCOUTS, TEAMS_DB, MOCK_PLAYERS } from './constants';

const App: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Global State
  const [prospects, setProspects] = useState<DraftProspect[]>(DRAFT_CLASS);
  const [scouts, setScouts] = useState<Scout[]>(MOCK_SCOUTS);
  const [picks, setPicks] = useState<DraftPick[]>(INITIAL_PICKS);
  const [teamBudget, setTeamBudget] = useState(255.4); // Cap space in millions
  const [leagueState, setLeagueState] = useState<LeagueState>({
    currentPhase: LeaguePhase.REGULAR_SEASON,
    week: 1,
    year: 2026,
    salaryCap: 255.4,
    difficulty: 'Simulation'
  });

  const nextWeek = () => {
    setLeagueState(prev => {
      if (prev.week >= 18) {
        return { ...prev, week: 1, currentPhase: LeaguePhase.PLAYOFFS };
      }
      return { ...prev, week: prev.week + 1 };
    });
  };

  const renderView = () => {
    if (!selectedTeamId) {
      return <TeamSelection onSelect={setSelectedTeamId} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} />;
      case AppView.ROSTER:
        return <RosterView selectedTeamId={selectedTeamId} />;
      case AppView.FREE_AGENCY:
        return <FreeAgency selectedTeamId={selectedTeamId} />;
      case AppView.TRADE_CENTER:
        return <TradeCenter selectedTeamId={selectedTeamId} />;
      case AppView.GAMEPLAN:
        return <GamePlan selectedTeamId={selectedTeamId} />;
      case AppView.MATCH:
        return <MatchSim selectedTeamId={selectedTeamId} />;
      case AppView.DRAFT:
        return (
          <DraftRoom 
            selectedTeamId={selectedTeamId}
            prospects={prospects} 
            setProspects={setProspects} 
            picks={picks} 
            setPicks={setPicks} 
          />
        );
      case AppView.STAFF:
        return <StaffView selectedTeamId={selectedTeamId} />;
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
      default:
        return <Dashboard selectedTeamId={selectedTeamId} leaguePhase={leagueState.currentPhase} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      {/* Visual Effects Layer */}
      <div className="absolute inset-0 grid-lines opacity-20 pointer-events-none"></div>
      <div className="scan-line"></div>

      {selectedTeamId && <Navigation currentView={currentView} setView={setCurrentView} selectedTeamId={selectedTeamId} />}
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
              onClick={nextWeek}
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