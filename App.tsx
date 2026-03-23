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
import { AppView, DraftProspect, DraftPick, Scout } from './types';
import { DRAFT_CLASS, INITIAL_PICKS, MOCK_SCOUTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Global State
  const [prospects, setProspects] = useState<DraftProspect[]>(DRAFT_CLASS);
  const [scouts, setScouts] = useState<Scout[]>(MOCK_SCOUTS);
  const [picks, setPicks] = useState<DraftPick[]>(INITIAL_PICKS);
  const [teamBudget, setTeamBudget] = useState(255.4); // Cap space in millions

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard />;
      case AppView.ROSTER:
        return <RosterView />;
      case AppView.FREE_AGENCY:
        return <FreeAgency />;
      case AppView.TRADE_CENTER:
        return <TradeCenter />;
      case AppView.GAMEPLAN:
        return <GamePlan />;
      case AppView.MATCH:
        return <MatchSim />;
      case AppView.DRAFT:
        return (
          <DraftRoom 
            prospects={prospects} 
            setProspects={setProspects} 
            picks={picks} 
            setPicks={setPicks} 
          />
        );
      case AppView.STAFF:
        return <StaffView />;
      case AppView.SCOUTING:
        return (
          <ScoutingView 
            prospects={prospects} 
            setProspects={setProspects} 
            scouts={scouts} 
            setScouts={setScouts} 
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      <Navigation currentView={currentView} setView={setCurrentView} />
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