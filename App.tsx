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
import { DRAFT_CLASS, INITIAL_PICKS, MOCK_SCOUTS } from './constants';

const LS = {
  team: 'nfl_gm_team',
  prospects: 'nfl_gm_prospects',
  scouts: 'nfl_gm_scouts',
  picks: 'nfl_gm_picks',
  capSpace: 'nfl_gm_capSpace',
  trust: 'nfl_gm_trust',
  week: 'nfl_gm_week',
};

const App: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    () => localStorage.getItem(LS.team) || null
  );
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const [prospects, setProspects] = useState<DraftProspect[]>(() => {
    try {
      const saved = localStorage.getItem(LS.prospects);
      return saved ? JSON.parse(saved) : DRAFT_CLASS;
    } catch { return DRAFT_CLASS; }
  });
  const [scouts, setScouts] = useState<Scout[]>(() => {
    try {
      const saved = localStorage.getItem(LS.scouts);
      return saved ? JSON.parse(saved) : MOCK_SCOUTS;
    } catch { return MOCK_SCOUTS; }
  });
  const [picks, setPicks] = useState<DraftPick[]>(() => {
    try {
      const saved = localStorage.getItem(LS.picks);
      return saved ? JSON.parse(saved) : INITIAL_PICKS;
    } catch { return INITIAL_PICKS; }
  });
  const [capSpace, setCapSpace] = useState<number>(() => {
    const saved = localStorage.getItem(LS.capSpace);
    return saved ? parseFloat(saved) : 14.2;
  });
  const [trustRating, setTrustRating] = useState<number>(() => {
    const saved = localStorage.getItem(LS.trust);
    return saved ? parseInt(saved) : 88;
  });
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem(LS.week);
    return saved ? parseInt(saved) : 8;
  });

  // Persist state to localStorage
  useEffect(() => {
    if (selectedTeamId) localStorage.setItem(LS.team, selectedTeamId);
  }, [selectedTeamId]);
  useEffect(() => {
    localStorage.setItem(LS.prospects, JSON.stringify(prospects));
  }, [prospects]);
  useEffect(() => {
    localStorage.setItem(LS.scouts, JSON.stringify(scouts));
  }, [scouts]);
  useEffect(() => {
    localStorage.setItem(LS.picks, JSON.stringify(picks));
  }, [picks]);
  useEffect(() => {
    localStorage.setItem(LS.capSpace, capSpace.toString());
  }, [capSpace]);
  useEffect(() => {
    localStorage.setItem(LS.trust, trustRating.toString());
  }, [trustRating]);
  useEffect(() => {
    localStorage.setItem(LS.week, currentWeek.toString());
  }, [currentWeek]);

  const handleTeamSelect = (teamId: string) => {
    // Reset all game state when selecting a new team
    setSelectedTeamId(teamId);
    setCurrentView(AppView.DASHBOARD);
    setProspects(DRAFT_CLASS);
    setScouts(MOCK_SCOUTS);
    setPicks(INITIAL_PICKS);
    setCapSpace(14.2);
    setTrustRating(88);
    setCurrentWeek(8);
  };

  const renderView = () => {
    if (!selectedTeamId) {
      return <TeamSelection onSelect={handleTeamSelect} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            selectedTeamId={selectedTeamId}
            onNavigate={setCurrentView}
            currentWeek={currentWeek}
          />
        );
      case AppView.ROSTER:
        return (
          <RosterView
            selectedTeamId={selectedTeamId}
            capSpace={capSpace}
            setCapSpace={setCapSpace}
          />
        );
      case AppView.FREE_AGENCY:
        return <FreeAgency selectedTeamId={selectedTeamId} />;
      case AppView.TRADE_CENTER:
        return <TradeCenter selectedTeamId={selectedTeamId} />;
      case AppView.GAMEPLAN:
        return <GamePlan selectedTeamId={selectedTeamId} currentWeek={currentWeek} />;
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
        return (
          <Dashboard
            selectedTeamId={selectedTeamId}
            onNavigate={setCurrentView}
            currentWeek={currentWeek}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      {selectedTeamId && (
        <Navigation
          currentView={currentView}
          setView={setCurrentView}
          selectedTeamId={selectedTeamId}
          capSpace={capSpace}
          trustRating={trustRating}
        />
      )}
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
