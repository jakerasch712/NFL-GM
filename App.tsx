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
import { AppView, Player, DraftPick, DraftProspect, GamePlanSettings, Position } from './types';
import { MOCK_PLAYERS, INITIAL_PICKS, HOU_SCHEDULE } from './constants';

const STORAGE_KEY = 'nfl_gm_save_v1';

interface SaveState {
  players: Player[];
  capSpace: number;
  deadCap: number;
  draftPicks: DraftPick[];
  week: number;
  trust: number;
  gamePlan: GamePlanSettings;
}

const defaultState: SaveState = {
  players: MOCK_PLAYERS,
  capSpace: 14.2,
  deadCap: 12.8,
  draftPicks: INITIAL_PICKS,
  week: 8,
  trust: 88,
  gamePlan: { focus: 'BALANCED', intensity: 50 },
};

const loadState = (): SaveState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch {}
  return defaultState;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const saved = loadState();
  const [players, setPlayers] = useState<Player[]>(saved.players);
  const [capSpace, setCapSpace] = useState(saved.capSpace);
  const [deadCap, setDeadCap] = useState(saved.deadCap);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>(saved.draftPicks);
  const [week, setWeek] = useState(saved.week);
  const [trust, setTrust] = useState(saved.trust);
  const [gamePlan, setGamePlan] = useState<GamePlanSettings>(saved.gamePlan);

  // Persist to localStorage on every significant state change
  useEffect(() => {
    const state: SaveState = { players, capSpace, deadCap, draftPicks, week, trust, gamePlan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [players, capSpace, deadCap, draftPicks, week, trust, gamePlan]);

  // --- Roster Actions ---
  const handleSignContract = (playerId: string, newContract: any) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, contract: { ...p.contract, ...newContract }, contractDemand: undefined }
        : p
    ));
    setCapSpace(prev => parseFloat((prev - (newContract.capHit ?? newContract.totalValue / newContract.years)).toFixed(2)));
  };

  const handleCutPlayer = (playerId: string, impact: any) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setCapSpace(prev => parseFloat((prev + impact.net2026Savings).toFixed(2)));
    setDeadCap(prev => parseFloat((prev + impact.immediateDeadCap).toFixed(2)));
  };

  const handleRestructure = (playerId: string, voidYears: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const amountToRestructure = p.contract.salary - 1.21;
      const prorationTerm = p.contract.yearsLeft + voidYears;
      const yearlyProration = amountToRestructure / prorationTerm;
      const savings = amountToRestructure - yearlyProration;
      setCapSpace(cs => parseFloat((cs + savings).toFixed(2)));
      return {
        ...p,
        contract: {
          ...p.contract,
          capHit: parseFloat((p.contract.capHit - savings).toFixed(2)),
          voidYears: p.contract.voidYears + voidYears,
          totalLength: p.contract.totalLength + voidYears,
        },
      };
    }));
  };

  // --- Free Agency ---
  const handleSignFreeAgent = (playerId: string, newContract: any) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, teamId: 'HOU', contract: { ...p.contract, ...newContract }, contractDemand: undefined }
        : p
    ));
    setCapSpace(prev => parseFloat((prev - (newContract.capHit ?? newContract.totalValue / newContract.years)).toFixed(2)));
  };

  // --- Trade Center ---
  const handleExecuteTrade = (
    myAssets: (Player | DraftPick)[],
    theirAssets: (Player | DraftPick)[],
    theirTeamId: string
  ) => {
    setPlayers(prev => {
      let updated = [...prev];
      myAssets.forEach(asset => {
        if ('overall' in asset) {
          updated = updated.map(p => p.id === asset.id ? { ...p, teamId: theirTeamId } : p);
        }
      });
      theirAssets.forEach(asset => {
        if ('overall' in asset) {
          updated = updated.map(p => p.id === asset.id ? { ...p, teamId: 'HOU' } : p);
        }
      });
      return updated;
    });
    setDraftPicks(prev => {
      let updated = [...prev];
      myAssets.forEach(asset => {
        if (!('overall' in asset)) {
          updated = updated.map(p => p.id === asset.id ? { ...p, currentTeamId: theirTeamId } : p);
        }
      });
      theirAssets.forEach(asset => {
        if (!('overall' in asset)) {
          const existing = updated.find(p => p.id === asset.id);
          if (existing) {
            updated = updated.map(p => p.id === asset.id ? { ...p, currentTeamId: 'HOU' } : p);
          } else {
            updated = [...updated, { ...asset, currentTeamId: 'HOU' }];
          }
        }
      });
      return updated;
    });
  };

  // --- Draft ---
  const handleDraftPlayer = (prospect: DraftProspect, pick: DraftPick) => {
    const devTrait: Player['developmentTrait'] =
      prospect.scoutingGrade >= 95 ? 'X-Factor' :
      prospect.scoutingGrade >= 90 ? 'Superstar' :
      prospect.scoutingGrade >= 80 ? 'Star' : 'Normal';

    const rookieCapHit = pick.round === 1 ? 3.25 : pick.round === 2 ? 2.0 : 1.2;
    const newPlayer: Player = {
      id: `rookie_${prospect.id}`,
      name: prospect.name,
      position: prospect.position,
      age: 21 + Math.floor(Math.random() * 3),
      overall: Math.round(prospect.scoutingGrade * 0.82),
      schemeOvr: Math.round(prospect.scoutingGrade * 0.82),
      morale: 90,
      fatigue: 100,
      archetype: prospect.traits[0] || 'Rookie',
      scheme: 'Zone',
      developmentTrait: devTrait,
      stats: { gamesPlayed: 0 },
      contract: {
        years: 4,
        salary: pick.round === 1 ? 3.0 : 1.5,
        bonus: pick.round === 1 ? 5.0 : 1.5,
        guaranteed: pick.round === 1 ? 10.0 : 3.0,
        yearsLeft: 4,
        totalValue: pick.round === 1 ? 17.0 : 7.5,
        capHit: rookieCapHit,
        deadCap: pick.round === 1 ? 6.5 : 1.5,
        voidYears: 0,
        startYear: 2026,
        totalLength: 4,
      },
      teamId: 'HOU',
    };

    setPlayers(prev => [...prev, newPlayer]);
    setCapSpace(prev => parseFloat((prev - rookieCapHit).toFixed(2)));
  };

  // --- Game Plan ---
  const handleFinalizeGamePlan = (settings: GamePlanSettings) => {
    setGamePlan(settings);
  };

  // --- Game Over ---
  const handleGameOver = (userScore: number, opponentScore: number) => {
    setWeek(prev => Math.min(prev + 1, 17));
    if (userScore > opponentScore) {
      setTrust(prev => Math.min(99, prev + 2));
    } else if (userScore < opponentScore) {
      setTrust(prev => Math.max(10, prev - 3));
    }
  };

  const renderView = () => {
    const houPlayers = players.filter(p => p.teamId === 'HOU');
    const faPlayers = players.filter(p => p.teamId === 'FA');
    const houPicks = draftPicks.filter(p => p.currentTeamId === 'HOU');

    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            players={houPlayers}
            week={week}
            capSpace={capSpace}
            schedule={HOU_SCHEDULE}
            onNavigate={setCurrentView}
          />
        );
      case AppView.ROSTER:
        return (
          <RosterView
            players={houPlayers}
            capSpace={capSpace}
            deadCap={deadCap}
            onSignContract={handleSignContract}
            onCutPlayer={handleCutPlayer}
            onRestructure={handleRestructure}
          />
        );
      case AppView.FREE_AGENCY:
        return (
          <FreeAgency
            players={faPlayers}
            capSpace={capSpace}
            onSignPlayer={handleSignFreeAgent}
          />
        );
      case AppView.TRADE_CENTER:
        return (
          <TradeCenter
            players={players}
            draftPicks={draftPicks}
            onExecuteTrade={handleExecuteTrade}
          />
        );
      case AppView.GAMEPLAN:
        return (
          <GamePlan
            players={houPlayers}
            week={week}
            schedule={HOU_SCHEDULE}
            gamePlan={gamePlan}
            onFinalizeGamePlan={handleFinalizeGamePlan}
          />
        );
      case AppView.MATCH:
        return (
          <MatchSim
            players={houPlayers}
            week={week}
            schedule={HOU_SCHEDULE}
            gamePlan={gamePlan}
            onGameOver={handleGameOver}
          />
        );
      case AppView.DRAFT:
        return (
          <DraftRoom
            players={players}
            draftPicks={houPicks}
            onDraftPlayer={handleDraftPlayer}
          />
        );
      case AppView.STAFF:
        return <StaffView />;
      case AppView.SCOUTING:
        return <ScoutingView />;
      default:
        return (
          <Dashboard
            players={houPlayers}
            week={week}
            capSpace={capSpace}
            schedule={HOU_SCHEDULE}
            onNavigate={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      <Navigation
        currentView={currentView}
        setView={setCurrentView}
        capSpace={capSpace}
        trust={trust}
      />
      <main className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        {renderView()}
      </main>
    </div>
  );
};

export default App;
