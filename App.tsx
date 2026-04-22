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
import { AppView, DraftProspect, DraftPick, Scout } from './types';
import { DRAFT_CLASS, INITIAL_PICKS, MOCK_SCOUTS, TEAMS_DB } from './constants';

const App: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Global State
  const [prospects, setProspects] = useState<DraftProspect[]>(DRAFT_CLASS);
  const [scouts, setScouts] = useState<Scout[]>(MOCK_SCOUTS);
  const [picks, setPicks] = useState<DraftPick[]>(INITIAL_PICKS);
  const [teamBudget, setTeamBudget] = useState(255.4); // Cap space in millions

  const renderView = () => {
    if (!selectedTeamId) {
      return <TeamSelection onSelect={setSelectedTeamId} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard selectedTeamId={selectedTeamId} />;
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
        return <Dashboard selectedTeamId={selectedTeamId} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      {selectedTeamId && <Navigation currentView={currentView} setView={setCurrentView} selectedTeamId={selectedTeamId} />}
      <main className="flex-1 relative overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}>
        </div>
        
        {renderView()}
      </main>
    </div>
  );
};

export default App;