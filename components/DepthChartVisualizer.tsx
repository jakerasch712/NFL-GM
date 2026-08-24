import React, { useState, useMemo } from 'react';
import { Player, Position, Team } from '../types';
import { 
  Shield, 
  TrendingUp, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Users, 
  ExternalLink, 
  ArrowUpDown, 
  Swords, 
  Sparkles, 
  LayoutGrid, 
  Eye,
  DollarSign,
  AlertCircle,
  Loader2,
  Lock,
  Flame,
  ArrowRight
} from 'lucide-react';
import { syncSpotracRoster } from '../services/geminiService';

export interface UnitRatingInfo {
  id: string;
  name: string;
  category: 'OFFENSE' | 'DEFENSE' | 'SPECIAL_TEAMS';
  positions: Position[];
  overall: number;
  starterAvg: number;
  depthAvg: number;
  grade: string;
  gradeColor: string;
  capAllocation: number;
  starters: Player[];
  depthCount: number;
  statusTag: string;
  schemeFitBonus: number;
  keyStrength: string;
}

interface DepthChartVisualizerProps {
  teamId: string;
  team: any;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onExtendPlayer?: (player: Player) => void;
  onRestructurePlayer?: (player: Player) => void;
}

export const DepthChartVisualizer: React.FC<DepthChartVisualizerProps> = ({
  teamId,
  team,
  allPlayers,
  setAllPlayers,
  onExtendPlayer,
  onRestructurePlayer
}) => {
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>('ALL');
  const [chartViewMode, setChartViewMode] = useState<'cards' | 'field'>('cards');
  const [fieldSide, setFieldSide] = useState<'OFFENSE' | 'DEFENSE'>('OFFENSE');
  const [isSpotracSyncing, setIsSpotracSyncing] = useState<boolean>(false);
  const [spotracSyncSuccess, setSpotracSyncSuccess] = useState<boolean>(false);
  const [spotracUrl, setSpotracUrl] = useState<string>(
    `https://www.spotrac.com/nfl/${(team?.city || '').toLowerCase().replace(/\s+/g, '-')}-${(team?.name || '').toLowerCase()}/cap/`
  );
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null);

  const teamPlayers = useMemo(() => {
    return allPlayers.filter(p => p.teamId === teamId);
  }, [allPlayers, teamId]);

  // Helper to sort players within a position by custom depth or overall
  const getSortedPositionPlayers = (pos: Position): Player[] => {
    const posPlayers = teamPlayers.filter(p => p.position === pos);
    return [...posPlayers].sort((a, b) => {
      if (a.depth !== undefined && b.depth !== undefined) {
        return a.depth - b.depth;
      }
      if (a.depth !== undefined) return -1;
      if (b.depth !== undefined) return 1;
      return b.overall - a.overall;
    });
  };

  // Helper to get grade badge & color
  const getGrade = (ovr: number): { grade: string; color: string } => {
    if (ovr >= 93) return { grade: 'A+', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
    if (ovr >= 89) return { grade: 'A', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' };
    if (ovr >= 86) return { grade: 'A-', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' };
    if (ovr >= 83) return { grade: 'B+', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' };
    if (ovr >= 80) return { grade: 'B', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' };
    if (ovr >= 77) return { grade: 'B-', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' };
    if (ovr >= 74) return { grade: 'C+', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
    if (ovr >= 70) return { grade: 'C', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' };
    if (ovr >= 65) return { grade: 'D', color: 'text-red-400 border-red-500/30 bg-red-500/5' };
    return { grade: 'F', color: 'text-red-500 border-red-600/40 bg-red-500/10' };
  };

  // Calculate unit overall rating dynamically
  const calculatedUnits: UnitRatingInfo[] = useMemo(() => {
    // 1. Offensive Line Unit (OL)
    const olPlayers = getSortedPositionPlayers(Position.OL);
    const olStarters = olPlayers.slice(0, 5);
    const olDepth = olPlayers.slice(5);
    const olStarterAvg = olStarters.length > 0 ? olStarters.reduce((acc, p) => acc + (p.schemeOvr || p.overall), 0) / olStarters.length : 72;
    const olDepthAvg = olDepth.length > 0 ? olDepth.reduce((acc, p) => acc + p.overall, 0) / olDepth.length : olStarterAvg - 8;
    const olOvr = Math.round(olStarters.length >= 5 ? olStarterAvg * 0.8 + olDepthAvg * 0.2 : olStarterAvg * 0.7);
    const olCap = olPlayers.reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const olGrade = getGrade(olOvr);

    // 2. Secondary Unit (CB & S)
    const cbPlayers = getSortedPositionPlayers(Position.CB);
    const sPlayers = getSortedPositionPlayers(Position.S);
    const secStarters = [...cbPlayers.slice(0, 2), ...sPlayers.slice(0, 2), ...(cbPlayers[2] ? [cbPlayers[2]] : [])];
    const secDepth = [...cbPlayers.slice(3), ...sPlayers.slice(2)];
    const secStarterAvg = secStarters.length > 0 ? secStarters.reduce((acc, p) => acc + (p.schemeOvr || p.overall), 0) / secStarters.length : 74;
    const secDepthAvg = secDepth.length > 0 ? secDepth.reduce((acc, p) => acc + p.overall, 0) / secDepth.length : secStarterAvg - 7;
    const secOvr = Math.round(secStarters.length >= 4 ? secStarterAvg * 0.75 + secDepthAvg * 0.25 : secStarterAvg);
    const secCap = [...cbPlayers, ...sPlayers].reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const secGrade = getGrade(secOvr);

    // 3. Pass Catchers / Receiving Corps (WR & TE)
    const wrPlayers = getSortedPositionPlayers(Position.WR);
    const tePlayers = getSortedPositionPlayers(Position.TE);
    const pcStarters = [...wrPlayers.slice(0, 3), tePlayers[0]].filter(Boolean);
    const pcDepth = [...wrPlayers.slice(3), ...tePlayers.slice(1)];
    const pcStarterAvg = pcStarters.length > 0 ? pcStarters.reduce((acc, p) => acc + (p.schemeOvr || p.overall), 0) / pcStarters.length : 75;
    const pcDepthAvg = pcDepth.length > 0 ? pcDepth.reduce((acc, p) => acc + p.overall, 0) / pcDepth.length : pcStarterAvg - 6;
    const pcOvr = Math.round(pcStarters.length >= 3 ? pcStarterAvg * 0.8 + pcDepthAvg * 0.2 : pcStarterAvg);
    const pcCap = [...wrPlayers, ...tePlayers].reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const pcGrade = getGrade(pcOvr);

    // 4. Offensive Backfield (QB & RB)
    const qbPlayers = getSortedPositionPlayers(Position.QB);
    const rbPlayers = getSortedPositionPlayers(Position.RB);
    const qb1 = qbPlayers[0];
    const rb1 = rbPlayers[0];
    const backfieldStarters = [qb1, rb1].filter(Boolean);
    const backfieldDepth = [...qbPlayers.slice(1), ...rbPlayers.slice(1)];
    const qbOvr = qb1 ? (qb1.schemeOvr || qb1.overall) : 70;
    const rbOvr = rb1 ? (rb1.schemeOvr || rb1.overall) : 70;
    const backfieldStarterAvg = (qbOvr * 0.6) + (rbOvr * 0.4);
    const backfieldDepthAvg = backfieldDepth.length > 0 ? backfieldDepth.reduce((acc, p) => acc + p.overall, 0) / backfieldDepth.length : backfieldStarterAvg - 8;
    const backfieldOvr = Math.round(backfieldStarterAvg * 0.85 + backfieldDepthAvg * 0.15);
    const backfieldCap = [...qbPlayers, ...rbPlayers].reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const backfieldGrade = getGrade(backfieldOvr);

    // 5. Pass Rush & Defensive Front (DL)
    const dlPlayers = getSortedPositionPlayers(Position.DL);
    const dlStarters = dlPlayers.slice(0, 4);
    const dlDepth = dlPlayers.slice(4);
    const dlStarterAvg = dlStarters.length > 0 ? dlStarters.reduce((acc, p) => acc + (p.schemeOvr || p.overall), 0) / dlStarters.length : 74;
    const dlDepthAvg = dlDepth.length > 0 ? dlDepth.reduce((acc, p) => acc + p.overall, 0) / dlDepth.length : dlStarterAvg - 6;
    const dlOvr = Math.round(dlStarters.length >= 3 ? dlStarterAvg * 0.75 + dlDepthAvg * 0.25 : dlStarterAvg);
    const dlCap = dlPlayers.reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const dlGrade = getGrade(dlOvr);

    // 6. Linebacker Corps (LB)
    const lbPlayers = getSortedPositionPlayers(Position.LB);
    const lbStarters = lbPlayers.slice(0, 3);
    const lbDepth = lbPlayers.slice(3);
    const lbStarterAvg = lbStarters.length > 0 ? lbStarters.reduce((acc, p) => acc + (p.schemeOvr || p.overall), 0) / lbStarters.length : 73;
    const lbDepthAvg = lbDepth.length > 0 ? lbDepth.reduce((acc, p) => acc + p.overall, 0) / lbDepth.length : lbStarterAvg - 6;
    const lbOvr = Math.round(lbStarters.length >= 2 ? lbStarterAvg * 0.8 + lbDepthAvg * 0.2 : lbStarterAvg);
    const lbCap = lbPlayers.reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const lbGrade = getGrade(lbOvr);

    // 7. Special Teams (K)
    const kPlayers = getSortedPositionPlayers(Position.K);
    const kStarters = kPlayers.slice(0, 1);
    const kOvr = kStarters[0] ? kStarters[0].overall : 78;
    const kCap = kPlayers.reduce((acc, p) => acc + (p.contract?.capHit || 0), 0);
    const kGrade = getGrade(kOvr);

    return [
      {
        id: 'ol',
        name: 'Offensive Line',
        category: 'OFFENSE',
        positions: [Position.OL],
        overall: olOvr,
        starterAvg: Math.round(olStarterAvg),
        depthAvg: Math.round(olDepthAvg),
        grade: olGrade.grade,
        gradeColor: olGrade.color,
        capAllocation: parseFloat(olCap.toFixed(1)),
        starters: olStarters,
        depthCount: olDepth.length,
        statusTag: olOvr >= 90 ? 'ELITE ANCHOR TRENCHES' : olOvr >= 83 ? 'SOLID PROTECTION' : 'PASS PRO CONCERN',
        schemeFitBonus: Math.round(olStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 1.5),
        keyStrength: olOvr >= 85 ? 'Pass Protection & Pocket Stability' : 'Developing Line Cohesion'
      },
      {
        id: 'sec',
        name: 'Secondary',
        category: 'DEFENSE',
        positions: [Position.CB, Position.S],
        overall: secOvr,
        starterAvg: Math.round(secStarterAvg),
        depthAvg: Math.round(secDepthAvg),
        grade: secGrade.grade,
        gradeColor: secGrade.color,
        capAllocation: parseFloat(secCap.toFixed(1)),
        starters: secStarters,
        depthCount: secDepth.length,
        statusTag: secOvr >= 90 ? 'LOCKDOWN NO-FLY ZONE' : secOvr >= 83 ? 'DISCIPLINED COVERAGE' : 'COVERAGE VULNERABILITY',
        schemeFitBonus: Math.round(secStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 1.2),
        keyStrength: secOvr >= 85 ? 'Man/Zone Coverage & Turnover Generation' : 'Secondary Rotation Depth'
      },
      {
        id: 'catchers',
        name: 'Pass Catchers',
        category: 'OFFENSE',
        positions: [Position.WR, Position.TE],
        overall: pcOvr,
        starterAvg: Math.round(pcStarterAvg),
        depthAvg: Math.round(pcDepthAvg),
        grade: pcGrade.grade,
        gradeColor: pcGrade.color,
        capAllocation: parseFloat(pcCap.toFixed(1)),
        starters: pcStarters,
        depthCount: pcDepth.length,
        statusTag: pcOvr >= 90 ? 'EXPLOSIVE AIR ARSENAL' : pcOvr >= 83 ? 'BALANCED TARGET CORPS' : 'SEPARATION DEFICIT',
        schemeFitBonus: Math.round(pcStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 1.2),
        keyStrength: pcOvr >= 85 ? 'Route Separation & Red Zone Matchups' : 'Possession & Chain Moving'
      },
      {
        id: 'backfield',
        name: 'Offensive Backfield',
        category: 'OFFENSE',
        positions: [Position.QB, Position.RB],
        overall: backfieldOvr,
        starterAvg: Math.round(backfieldStarterAvg),
        depthAvg: Math.round(backfieldDepthAvg),
        grade: backfieldGrade.grade,
        gradeColor: backfieldGrade.color,
        capAllocation: parseFloat(backfieldCap.toFixed(1)),
        starters: backfieldStarters,
        depthCount: backfieldDepth.length,
        statusTag: backfieldOvr >= 90 ? 'FRANCHISE ENGINE' : backfieldOvr >= 83 ? 'PRODUCING BACKFIELD' : 'QB PLAYMAKING NEED',
        schemeFitBonus: Math.round(backfieldStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 2.0),
        keyStrength: backfieldOvr >= 88 ? 'Clutch Playmaking & Dual Rushing Threat' : 'System Execution'
      },
      {
        id: 'dfront',
        name: 'Pass Rush & Front',
        category: 'DEFENSE',
        positions: [Position.DL],
        overall: dlOvr,
        starterAvg: Math.round(dlStarterAvg),
        depthAvg: Math.round(dlDepthAvg),
        grade: dlGrade.grade,
        gradeColor: dlGrade.color,
        capAllocation: parseFloat(dlCap.toFixed(1)),
        starters: dlStarters,
        depthCount: dlDepth.length,
        statusTag: dlOvr >= 90 ? 'HAVOC PRESSURE FRONT' : dlOvr >= 83 ? 'STOUT EDGE & TRENCHES' : 'PRESSURE DEFICIT',
        schemeFitBonus: Math.round(dlStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 1.4),
        keyStrength: dlOvr >= 86 ? 'High QB Pressure Rate & Run Stuffing' : 'Gap Penetration'
      },
      {
        id: 'lb',
        name: 'Linebacker Corps',
        category: 'DEFENSE',
        positions: [Position.LB],
        overall: lbOvr,
        starterAvg: Math.round(lbStarterAvg),
        depthAvg: Math.round(lbDepthAvg),
        grade: lbGrade.grade,
        gradeColor: lbGrade.color,
        capAllocation: parseFloat(lbCap.toFixed(1)),
        starters: lbStarters,
        depthCount: lbDepth.length,
        statusTag: lbOvr >= 88 ? 'SIDELINE-TO-SIDELINE ENFORCERS' : lbOvr >= 82 ? 'GAP DISCIPLINED' : 'RANGE DEFICIT',
        schemeFitBonus: Math.round(lbStarters.filter(p => (p.schemeOvr || p.overall) > p.overall).length * 1.5),
        keyStrength: lbOvr >= 85 ? 'Tackle Security & Intermediate Zone' : 'Between-the-Tackles Run Stop'
      },
      {
        id: 'st',
        name: 'Special Teams',
        category: 'SPECIAL_TEAMS',
        positions: [Position.K],
        overall: kOvr,
        starterAvg: kOvr,
        depthAvg: kOvr - 5,
        grade: kGrade.grade,
        gradeColor: kGrade.color,
        capAllocation: parseFloat(kCap.toFixed(1)),
        starters: kStarters,
        depthCount: 0,
        statusTag: kOvr >= 85 ? 'CLUTCH RANGE ACCURACY' : 'DEVELOPING SPECIALS',
        schemeFitBonus: 0,
        keyStrength: 'Field Position & Extra Point Security'
      }
    ];
  }, [teamPlayers]);

  // Reorder player logic
  const handleReorder = (draggedId: string, targetId: string) => {
    const dragged = allPlayers.find(p => p.id === draggedId);
    const target = allPlayers.find(p => p.id === targetId);
    if (!dragged || !target || dragged.position !== target.position || dragged.teamId !== target.teamId) return;

    const pos = dragged.position;
    const sortedPosPlayers = getSortedPositionPlayers(pos);

    const draggedIdx = sortedPosPlayers.findIndex(p => p.id === draggedId);
    const targetIdx = sortedPosPlayers.findIndex(p => p.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newOrder = [...sortedPosPlayers];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, dragged);

    const updatedPlayers = allPlayers.map(p => {
      if (p.teamId === teamId && p.position === pos) {
        const idx = newOrder.findIndex(np => np.id === p.id);
        return { ...p, depth: idx + 1 };
      }
      return p;
    });

    setAllPlayers(updatedPlayers);
  };

  // Promote player to #1 starter
  const handlePromoteToStarter = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    const pos = player.position;
    const sortedPosPlayers = getSortedPositionPlayers(pos);
    const currentIdx = sortedPosPlayers.findIndex(p => p.id === playerId);
    if (currentIdx <= 0) return;

    const newOrder = [player, ...sortedPosPlayers.filter(p => p.id !== playerId)];

    const updatedPlayers = allPlayers.map(p => {
      if (p.teamId === teamId && p.position === pos) {
        const idx = newOrder.findIndex(np => np.id === p.id);
        return { ...p, depth: idx + 1 };
      }
      return p;
    });

    setAllPlayers(updatedPlayers);
  };

  const [autoGenSuccess, setAutoGenSuccess] = useState<boolean>(false);

  // Auto-generate complete depth chart based on player OVR ratings
  const handleAutoGenerateDepthChart = () => {
    const allPositions = [
      Position.QB, 
      Position.RB, 
      Position.WR, 
      Position.TE, 
      Position.OL, 
      Position.DL, 
      Position.LB, 
      Position.CB, 
      Position.S, 
      Position.K
    ];

    // Build position-by-position depth order for this team
    const depthMap = new Map<string, number>();

    allPositions.forEach(pos => {
      const posPlayers = allPlayers.filter(p => p.teamId === teamId && p.position === pos);
      // Sort strictly by highest overall / scheme overall first to populate starters efficiently
      const sorted = [...posPlayers].sort((a, b) => {
        const ovrA = a.schemeOvr || a.overall;
        const ovrB = b.schemeOvr || b.overall;
        if (ovrB !== ovrA) return ovrB - ovrA;
        return (b.morale || 75) - (a.morale || 75);
      });

      sorted.forEach((player, idx) => {
        depthMap.set(player.id, idx + 1);
      });
    });

    const updatedPlayers = allPlayers.map(p => {
      if (p.teamId === teamId && depthMap.has(p.id)) {
        return {
          ...p,
          depth: depthMap.get(p.id)!
        };
      }
      return p;
    });

    setAllPlayers(updatedPlayers);
    setAutoGenSuccess(true);
    setTimeout(() => setAutoGenSuccess(false), 3500);
  };

  // Spotrac live sync handler
  const handleSyncSpotrac = async () => {
    setIsSpotracSyncing(true);
    setSpotracSyncSuccess(false);
    try {
      const fullTeamName = `${team?.city || ''} ${team?.name || ''}`.trim() || teamId;
      const result = await syncSpotracRoster(fullTeamName, teamId);
      
      if (result.spotracUrl) {
        setSpotracUrl(result.spotracUrl);
      }

      if (result.players && result.players.length > 0) {
        // Keep players not in current team and merge spotrac players
        setAllPlayers(prev => {
          const otherTeamPlayers = prev.filter(p => p.teamId !== teamId);
          return [...otherTeamPlayers, ...result.players];
        });
        setSpotracSyncSuccess(true);
        setTimeout(() => setSpotracSyncSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to sync Spotrac roster:', err);
    } finally {
      setIsSpotracSyncing(false);
    }
  };

  // Positions to display based on unit filter
  const positionsToRender = useMemo(() => {
    if (activeUnitFilter === 'ALL') {
      return [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL, Position.DL, Position.LB, Position.CB, Position.S, Position.K];
    }
    if (activeUnitFilter === 'OFFENSE') {
      return [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL];
    }
    if (activeUnitFilter === 'DEFENSE') {
      return [Position.DL, Position.LB, Position.CB, Position.S];
    }
    if (activeUnitFilter === 'SPECIAL_TEAMS') {
      return [Position.K];
    }
    const unit = calculatedUnits.find(u => u.id === activeUnitFilter);
    return unit ? unit.positions : [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL];
  }, [activeUnitFilter, calculatedUnits]);

  // Position Labels & Slot Mapping
  const getSlotLabel = (pos: Position, rank: number): string => {
    if (pos === Position.QB) return rank === 1 ? 'QB1 (STARTER)' : rank === 2 ? 'QB2 (PRIMARY BACKUP)' : `QB${rank} (DEVELOPMENTAL)`;
    if (pos === Position.RB) return rank === 1 ? 'RB1 (LEAD BACK)' : rank === 2 ? 'RB2 (3RD DOWN / CHANGE OF PACE)' : `RB${rank} (DEPTH)`;
    if (pos === Position.WR) return rank === 1 ? 'WR1 (X RECEIVER)' : rank === 2 ? 'WR2 (Z RECEIVER)' : rank === 3 ? 'WR3 (SLOT WEAPON)' : `WR${rank} (ROTATION)`;
    if (pos === Position.TE) return rank === 1 ? 'TE1 (PRIMARY TARGET)' : rank === 2 ? 'TE2 (INLINE BLOCKER)' : `TE${rank} (DEPTH)`;
    if (pos === Position.OL) return rank === 1 ? 'LT (BLINDSIDE TACKLE)' : rank === 2 ? 'LG (LEFT GUARD)' : rank === 3 ? 'C (OFFENSIVE CENTER)' : rank === 4 ? 'RG (RIGHT GUARD)' : rank === 5 ? 'RT (RIGHT TACKLE)' : `SWING LINEMAN (DEPTH ${rank})`;
    if (pos === Position.DL) return rank === 1 ? 'EDGE 1 (LEAD RUSHER)' : rank === 2 ? 'DT 1 (INTERIOR 3-TECH)' : rank === 3 ? 'DT 2 (NOSE TACKLE)' : rank === 4 ? 'EDGE 2 (CONTAIN RUSHER)' : `DL ROTATION ${rank}`;
    if (pos === Position.LB) return rank === 1 ? 'MIKE (MIDDLE LB)' : rank === 2 ? 'WILL (WEAKSIDE LB)' : rank === 3 ? 'SAM (STRONGSIDE LB)' : `LB DEPTH ${rank}`;
    if (pos === Position.CB) return rank === 1 ? 'CB1 (SHADOW / LOCKDOWN)' : rank === 2 ? 'CB2 (BOUNDARY CORNER)' : rank === 3 ? 'NICKEL CB (SLOT)' : `DIME / DEPTH ${rank}`;
    if (pos === Position.S) return rank === 1 ? 'FS1 (FREE SAFETY / CENTER FIELD)' : rank === 2 ? 'SS1 (STRONG SAFETY / IN THE BOX)' : `S DEPTH ${rank}`;
    if (pos === Position.K) return rank === 1 ? 'K1 (PLACEKICKER / FG)' : `P / SPECIALS ${rank}`;
    return `DEPTH ${rank}`;
  };

  return (
    <div className="space-y-8">
      {/* SPOTRAC INTEGRATION & QUICK VERIFICATION BANNER */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black tracking-tighter text-sm font-mono">
            SPOTRAC
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-white font-mono text-sm font-bold tracking-tight uppercase">
                SPOTRAC NFL FINANCIAL & DEPTH ROSTER ENGINE
              </span>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={10} />
                SPOTRAC.COM/NFL VERIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5">
              Live salary cap hits, dead money, void years, and positional depth charts synced with Spotrac NFL databases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoGenerateDepthChart}
            className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
              autoGenSuccess
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            }`}
          >
            {autoGenSuccess ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
            {autoGenSuccess ? 'DEPTH CHART AUTO-GENERATED!' : 'AUTO-GENERATE DEPTH CHART (BY OVR)'}
          </button>

          <a 
            href={spotracUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#05070a] border border-[#1a222e] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
          >
            <ExternalLink size={12} />
            VIEW SPOTRAC CAP PAGE
          </a>

          <button
            onClick={handleSyncSpotrac}
            disabled={isSpotracSyncing}
            className={`flex items-center gap-2.5 px-5 py-2 border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
              spotracSyncSuccess 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(0,209,255,0.1)]'
            }`}
          >
            {isSpotracSyncing ? (
              <Loader2 size={13} className="animate-spin text-cyan-400" />
            ) : spotracSyncSuccess ? (
              <CheckCircle2 size={13} />
            ) : (
              <RefreshCw size={13} />
            )}
            {isSpotracSyncing ? 'FETCHING SPOTRAC ROSTERS...' : spotracSyncSuccess ? 'SPOTRAC SYNC COMPLETE' : 'SYNC WITH SPOTRAC'}
          </button>
        </div>
      </div>

      {/* TACTICAL UNIT OVERALL RATINGS DASHBOARD */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <Shield size={16} className="text-cyan-400" />
              TACTICAL_UNIT_CALCULATED_RATINGS
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider mt-0.5">
              Calculated real-time overall ratings based on starter caliber, scheme synergy, and depth chart hierarchy.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#05070a] p-1 border border-[#1a222e]">
            <button
              onClick={() => setChartViewMode('cards')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest transition-all ${
                chartViewMode === 'cards' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutGrid size={12} />
              UNIT CARDS
            </button>
            <button
              onClick={() => setChartViewMode('field')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest transition-all ${
                chartViewMode === 'field' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Eye size={12} />
              FORMATION FIELD
            </button>
          </div>
        </div>

        {/* CALCULATED UNIT TILES (Offensive Line, Secondary, Pass Catchers, Backfield, Front, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {calculatedUnits.map((unit) => {
            const isSelected = activeUnitFilter === unit.id;
            return (
              <button
                key={unit.id}
                onClick={() => setActiveUnitFilter(isSelected ? 'ALL' : unit.id)}
                className={`text-left p-4 border transition-all relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,209,255,0.15)]' 
                    : 'bg-[#0a0e14] border-[#1a222e] hover:border-slate-700 hover:bg-[#0d121a]'
                }`}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full ${
                  unit.overall >= 88 ? 'bg-emerald-500' : unit.overall >= 80 ? 'bg-cyan-500' : 'bg-amber-500'
                }`} />

                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                    {unit.category}
                  </span>
                  <span className={`px-1.5 py-0.5 font-mono text-[10px] font-bold border ${unit.gradeColor}`}>
                    {unit.grade}
                  </span>
                </div>

                <div className="text-xs font-bold text-white font-mono uppercase tracking-tight truncate">
                  {unit.name}
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black font-mono text-white tracking-tight">
                    {unit.overall}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">
                    OVR
                  </span>
                  {unit.schemeFitBonus > 0 && (
                    <span className="text-[8px] font-mono text-cyan-400 font-bold ml-auto">
                      +{unit.schemeFitBonus} SCH
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-[#1a222e] mt-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      unit.overall >= 90 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]' :
                      unit.overall >= 82 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]' :
                      'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (unit.overall / 99) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#1a222e]/60 text-[8.5px] font-mono text-slate-500">
                  <span>${unit.capAllocation}M CAP</span>
                  <span>{unit.starters.length} ST / {unit.depthCount} DEP</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER / UNIT SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a222e] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest mr-2">
            UNIT_FILTER:
          </span>
          <button
            onClick={() => setActiveUnitFilter('ALL')}
            className={`px-4 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'ALL'
                ? 'bg-cyan-500 text-black border-cyan-500'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            ALL UNITS (10 POS)
          </button>
          <button
            onClick={() => setActiveUnitFilter('OFFENSE')}
            className={`px-4 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'OFFENSE'
                ? 'bg-cyan-500 text-black border-cyan-500'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            OFFENSE ONLY
          </button>
          <button
            onClick={() => setActiveUnitFilter('DEFENSE')}
            className={`px-4 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'DEFENSE'
                ? 'bg-emerald-500 text-black border-emerald-500'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            DEFENSE ONLY
          </button>
          <button
            onClick={() => setActiveUnitFilter('ol')}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'ol'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-500 hover:text-slate-300'
            }`}
          >
            OFFENSIVE LINE
          </button>
          <button
            onClick={() => setActiveUnitFilter('sec')}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'sec'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-500 hover:text-slate-300'
            }`}
          >
            SECONDARY (CB/S)
          </button>
          <button
            onClick={() => setActiveUnitFilter('catchers')}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${
              activeUnitFilter === 'catchers'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-[#0a0e14] border-[#1a222e] text-slate-500 hover:text-slate-300'
            }`}
          >
            PASS CATCHERS (WR/TE)
          </button>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <GripVertical size={12} className="text-cyan-400" />
            DRAG & DROP TO REORDER
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-emerald-400" />
            INSTANT STARTER ELEVATION
          </span>
        </div>
      </div>

      {/* TACTICAL FORMATION FIELD VIEW */}
      {chartViewMode === 'field' && (
        <div className="bg-[#0a0e14] border border-[#1a222e] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                TACTICAL ON-FIELD FORMATION VISUALIZER
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                // CLICK ANY FORMATION SLOT TO INSPECT OR SWAP STARTERS
              </span>
            </div>

            <div className="flex bg-[#05070a] p-1 border border-[#1a222e]">
              <button
                onClick={() => setFieldSide('OFFENSE')}
                className={`px-4 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${
                  fieldSide === 'OFFENSE' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                OFFENSE (11 PERSONNEL)
              </button>
              <button
                onClick={() => setFieldSide('DEFENSE')}
                className={`px-4 py-1 text-[9px] font-mono font-bold uppercase tracking-wider ${
                  fieldSide === 'DEFENSE' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                DEFENSE (4-2-5 NICKEL)
              </button>
            </div>
          </div>

          {/* FOOTBALL TURF FIELD SCHEMATIC */}
          <div className="relative bg-gradient-to-b from-[#061e12] via-[#082b1a] to-[#061e12] border-2 border-[#164e32] p-8 min-h-[380px] flex flex-col justify-between overflow-hidden shadow-2xl rounded-none">
            {/* Field Yard Lines & Markings */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-4">
              <div className="border-b border-dashed border-white/40 w-full h-0"></div>
              <div className="border-b border-dashed border-white/60 w-full h-0"></div>
              <div className="border-b-2 border-white/80 w-full h-0"></div>
              <div className="border-b border-dashed border-white/60 w-full h-0"></div>
              <div className="border-b border-dashed border-white/40 w-full h-0"></div>
            </div>

            {fieldSide === 'OFFENSE' ? (
              <div className="relative z-10 space-y-8">
                {/* Receivers & Tight End Line */}
                <div className="flex justify-between items-center px-4">
                  {/* WR1 (X) */}
                  {(() => {
                    const wrs = getSortedPositionPlayers(Position.WR);
                    const wr1 = wrs[0];
                    return (
                      <div className="bg-[#05070a]/90 border border-cyan-500/40 p-2.5 w-44 text-center shadow-lg">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">WR1 // X RECEIVER</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{wr1?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{wr1?.overall || '--'} OVR // ${wr1?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })()}

                  {/* WR3 (Slot) */}
                  {(() => {
                    const wrs = getSortedPositionPlayers(Position.WR);
                    const wr3 = wrs[2] || wrs[1];
                    return (
                      <div className="bg-[#05070a]/90 border border-cyan-500/40 p-2.5 w-44 text-center shadow-lg">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">WR3 // SLOT</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{wr3?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{wr3?.overall || '--'} OVR // ${wr3?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })()}

                  {/* TE1 */}
                  {(() => {
                    const tes = getSortedPositionPlayers(Position.TE);
                    const te1 = tes[0];
                    return (
                      <div className="bg-[#05070a]/90 border border-cyan-500/40 p-2.5 w-44 text-center shadow-lg">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">TE1 // PRIMARY</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{te1?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{te1?.overall || '--'} OVR // ${te1?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })()}

                  {/* WR2 (Z) */}
                  {(() => {
                    const wrs = getSortedPositionPlayers(Position.WR);
                    const wr2 = wrs[1] || wrs[0];
                    return (
                      <div className="bg-[#05070a]/90 border border-cyan-500/40 p-2.5 w-44 text-center shadow-lg">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">WR2 // Z RECEIVER</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{wr2?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{wr2?.overall || '--'} OVR // ${wr2?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })()}
                </div>

                {/* OFFENSIVE LINE (LT, LG, C, RG, RT) */}
                <div className="flex justify-center gap-3 items-center">
                  {['LT', 'LG', 'C', 'RG', 'RT'].map((slot, idx) => {
                    const ols = getSortedPositionPlayers(Position.OL);
                    const lineman = ols[idx];
                    return (
                      <div key={slot} className="bg-[#05070a]/95 border border-cyan-400/50 p-2 w-32 text-center shadow-xl">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">{slot}</div>
                        <div className="text-[11px] font-bold text-white font-mono uppercase truncate">{lineman?.name || 'TBD'}</div>
                        <div className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">{lineman?.overall || '--'} OVR</div>
                      </div>
                    );
                  })}
                </div>

                {/* BACKFIELD (QB & RB) */}
                <div className="flex flex-col items-center gap-3">
                  {/* QB */}
                  {(() => {
                    const qbs = getSortedPositionPlayers(Position.QB);
                    const qb1 = qbs[0];
                    return (
                      <div className="bg-[#05070a]/95 border-2 border-cyan-400 p-3 w-56 text-center shadow-[0_0_20px_rgba(0,209,255,0.2)]">
                        <div className="text-[8.5px] font-mono text-cyan-400 font-bold uppercase flex items-center justify-center gap-1.5">
                          <Flame size={10} className="text-amber-400 animate-pulse" />
                          QB1 // FRANCHISE SIGNAL CALLER
                        </div>
                        <div className="text-sm font-bold text-white font-mono uppercase tracking-wider">{qb1?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{qb1?.overall || '--'} OVR // ${qb1?.contract?.capHit || '0'}M CAP</div>
                      </div>
                    );
                  })()}

                  {/* RB */}
                  {(() => {
                    const rbs = getSortedPositionPlayers(Position.RB);
                    const rb1 = rbs[0];
                    return (
                      <div className="bg-[#05070a]/90 border border-cyan-500/40 p-2.5 w-48 text-center shadow-lg">
                        <div className="text-[8px] font-mono text-cyan-400 font-bold uppercase">RB1 // LEAD RUSHER</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{rb1?.name || 'Vacant'}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold mt-0.5">{rb1?.overall || '--'} OVR // ${rb1?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-8">
                {/* SAFETIES (FS1, SS1) */}
                <div className="flex justify-around items-center px-12">
                  {(() => {
                    const safeties = getSortedPositionPlayers(Position.S);
                    const fs1 = safeties[0];
                    const ss1 = safeties[1];
                    return (
                      <>
                        <div className="bg-[#05070a]/90 border border-emerald-500/50 p-2.5 w-48 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">FS1 // FREE SAFETY</div>
                          <div className="text-xs font-bold text-white font-mono uppercase truncate">{fs1?.name || 'Vacant'}</div>
                          <div className="text-[10px] font-mono text-emerald-300 font-bold mt-0.5">{fs1?.overall || '--'} OVR // ${fs1?.contract?.capHit || '0'}M</div>
                        </div>

                        <div className="bg-[#05070a]/90 border border-emerald-500/50 p-2.5 w-48 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">SS1 // STRONG SAFETY</div>
                          <div className="text-xs font-bold text-white font-mono uppercase truncate">{ss1?.name || 'Vacant'}</div>
                          <div className="text-[10px] font-mono text-emerald-300 font-bold mt-0.5">{ss1?.overall || '--'} OVR // ${ss1?.contract?.capHit || '0'}M</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* CORNERBACKS & LINEBACKERS */}
                <div className="flex justify-between items-center px-4">
                  {(() => {
                    const cbs = getSortedPositionPlayers(Position.CB);
                    const lbs = getSortedPositionPlayers(Position.LB);
                    const cb1 = cbs[0];
                    const cb2 = cbs[1];
                    const nickel = cbs[2];
                    const mike = lbs[0];
                    const will = lbs[1];

                    return (
                      <>
                        <div className="bg-[#05070a]/90 border border-emerald-500/40 p-2 w-36 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">CB1 // SHADOW</div>
                          <div className="text-[11px] font-bold text-white font-mono uppercase truncate">{cb1?.name || 'TBD'}</div>
                          <div className="text-[9px] font-mono text-emerald-300 font-bold">{cb1?.overall || '--'} OVR</div>
                        </div>

                        <div className="bg-[#05070a]/90 border border-emerald-500/40 p-2 w-36 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">WILL LB</div>
                          <div className="text-[11px] font-bold text-white font-mono uppercase truncate">{will?.name || 'TBD'}</div>
                          <div className="text-[9px] font-mono text-emerald-300 font-bold">{will?.overall || '--'} OVR</div>
                        </div>

                        <div className="bg-[#05070a]/95 border-2 border-emerald-500/70 p-2.5 w-40 text-center shadow-xl">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">MIKE LB</div>
                          <div className="text-xs font-bold text-white font-mono uppercase truncate">{mike?.name || 'TBD'}</div>
                          <div className="text-[9px] font-mono text-emerald-300 font-bold">{mike?.overall || '--'} OVR</div>
                        </div>

                        <div className="bg-[#05070a]/90 border border-emerald-500/40 p-2 w-36 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">NICKEL CB</div>
                          <div className="text-[11px] font-bold text-white font-mono uppercase truncate">{nickel?.name || 'TBD'}</div>
                          <div className="text-[9px] font-mono text-emerald-300 font-bold">{nickel?.overall || '--'} OVR</div>
                        </div>

                        <div className="bg-[#05070a]/90 border border-emerald-500/40 p-2 w-36 text-center shadow-lg">
                          <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">CB2 // BOUNDARY</div>
                          <div className="text-[11px] font-bold text-white font-mono uppercase truncate">{cb2?.name || 'TBD'}</div>
                          <div className="text-[9px] font-mono text-emerald-300 font-bold">{cb2?.overall || '--'} OVR</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* DEFENSIVE FRONT (DE1, DT1, DT2, DE2) */}
                <div className="flex justify-center gap-4 items-center">
                  {['DE1 (EDGE)', 'DT1 (3-TECH)', 'DT2 (NOSE)', 'DE2 (EDGE)'].map((slot, idx) => {
                    const dls = getSortedPositionPlayers(Position.DL);
                    const dl = dls[idx];
                    return (
                      <div key={slot} className="bg-[#05070a]/95 border border-emerald-400/60 p-2.5 w-36 text-center shadow-xl">
                        <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase">{slot}</div>
                        <div className="text-xs font-bold text-white font-mono uppercase truncate">{dl?.name || 'TBD'}</div>
                        <div className="text-[9px] font-mono text-emerald-300 font-bold mt-0.5">{dl?.overall || '--'} OVR // ${dl?.contract?.capHit || '0'}M</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POSITIONAL DEPTH CHART INTERACTIVE COLUMNS */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {positionsToRender.map((pos) => {
            const sortedPlayers = getSortedPositionPlayers(pos);
            const isOffense = [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL].includes(pos);
            const posFullTitle = 
              pos === Position.QB ? 'QUARTERBACK' :
              pos === Position.RB ? 'RUNNING BACK' :
              pos === Position.WR ? 'WIDE RECEIVER' :
              pos === Position.TE ? 'TIGHT END' :
              pos === Position.OL ? 'OFFENSIVE LINE' :
              pos === Position.DL ? 'DEFENSIVE LINE & EDGE' :
              pos === Position.LB ? 'LINEBACKER' :
              pos === Position.CB ? 'CORNERBACK' :
              pos === Position.S ? 'SAFETY' : 'SPECIALISTS';

            const starterCount = pos === Position.OL ? 5 : pos === Position.WR ? 3 : pos === Position.DL ? 4 : pos === Position.CB ? 2 : pos === Position.S ? 2 : 1;
            const starterAvgOvr = sortedPlayers.slice(0, starterCount).length > 0 
              ? Math.round(sortedPlayers.slice(0, starterCount).reduce((acc, p) => acc + p.overall, 0) / Math.min(starterCount, sortedPlayers.length))
              : 0;

            return (
              <div key={pos} className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-xl flex flex-col justify-between">
                {/* Position Group Header */}
                <div className="border-b border-[#1a222e] pb-4 mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-xs border ${
                      isOffense ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    }`}>
                      {pos}
                    </span>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        {posFullTitle}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                        {sortedPlayers.length} Active Personnel // {starterCount} Starter Slots
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-[8.5px] text-slate-500 uppercase font-bold tracking-widest">
                      UNIT STARTER RATING
                    </div>
                    <div className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                      <span>{starterAvgOvr} OVR</span>
                      <span className={`text-[8.5px] px-1.5 py-0.2 border ${getGrade(starterAvgOvr).color}`}>
                        {getGrade(starterAvgOvr).grade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Player List with Drag-and-Drop & Reordering */}
                <div className="space-y-2 flex-1">
                  {sortedPlayers.length === 0 ? (
                    <div className="text-center py-8 text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                      NO REGISTERED PLAYERS IN POSITION GROUP
                    </div>
                  ) : (
                    sortedPlayers.map((player, idx) => {
                      const isStarter = idx < starterCount;
                      const slotText = getSlotLabel(pos, idx + 1);
                      const isBeingDragged = draggedPlayerId === player.id;
                      const isDragOver = dragOverPlayerId === player.id;

                      return (
                        <div
                          key={player.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedPlayerId(player.id);
                            e.dataTransfer.setData('text/plain', player.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverPlayerId(player.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverPlayerId === player.id) setDragOverPlayerId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const srcId = e.dataTransfer.getData('text/plain');
                            if (srcId && srcId !== player.id) {
                              handleReorder(srcId, player.id);
                            }
                            setDraggedPlayerId(null);
                            setDragOverPlayerId(null);
                          }}
                          className={`flex items-center justify-between p-3.5 border transition-all cursor-grab active:cursor-grabbing group ${
                            isStarter 
                              ? isOffense 
                                ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_12px_rgba(0,209,255,0.03)]' 
                                : 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.03)]'
                              : 'bg-[#05070a] border-[#1a222e] hover:border-slate-700'
                          } ${isDragOver ? 'border-amber-400 bg-amber-500/10' : ''} ${isBeingDragged ? 'opacity-40' : 'opacity-100'}`}
                        >
                          {/* Left: Grip Handle + Rank + Player Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-slate-600 group-hover:text-cyan-400 transition-colors">
                              <GripVertical size={14} />
                            </div>

                            <div className={`w-28 text-[8.5px] font-mono font-bold tracking-tight px-1.5 py-0.5 text-center border truncate ${
                              isStarter 
                                ? isOffense 
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-[#0a0e14] text-slate-500 border-slate-800'
                            }`}>
                              {slotText}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white font-mono uppercase tracking-wide truncate">
                                  {player.name}
                                </span>
                                <span className="text-[7.5px] px-1 py-0.2 bg-[#0a0e14] text-slate-400 border border-slate-800 font-mono uppercase">
                                  {player.age} YO
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 font-mono text-[8px]">
                                <span className="text-slate-500 uppercase">{player.archetype}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-emerald-400 font-bold">${player.contract?.capHit?.toFixed(1) || '0'}M SPOTRAC CAP</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-500">{player.contract?.yearsLeft || 1} YRS</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Ratings & Action Buttons */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right font-mono">
                              <div className="text-xs font-bold text-white tracking-widest flex items-center justify-end gap-1">
                                <span>{player.overall}</span>
                                {player.schemeOvr > player.overall && (
                                  <span className="text-cyan-400 text-[9px]">({player.schemeOvr})</span>
                                )}
                              </div>
                              <span className={`text-[7.5px] px-1 py-0.2 uppercase font-bold ${
                                player.developmentTrait === 'X-Factor' ? 'text-fuchsia-400' :
                                player.developmentTrait === 'Superstar' ? 'text-amber-400' :
                                player.developmentTrait === 'Star' ? 'text-cyan-400' : 'text-slate-500'
                              }`}>
                                {player.developmentTrait}
                              </span>
                            </div>

                            {/* Quick Action: Promote to Starter */}
                            {!isStarter && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePromoteToStarter(player.id);
                                }}
                                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/30 text-[8px] font-mono font-bold uppercase transition-all"
                                title="Promote directly to #1 Starter"
                              >
                                <ArrowRight size={10} />
                                STARTER
                              </button>
                            )}

                            {/* Up / Down Reordering Chevrons */}
                            <div className="flex flex-col border border-[#1a222e] divide-y divide-[#1a222e]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (idx > 0) handleReorder(player.id, sortedPlayers[idx - 1].id);
                                }}
                                disabled={idx === 0}
                                className="p-1 hover:bg-cyan-500 hover:text-black text-slate-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                title="Move up in depth chart"
                              >
                                <ChevronUp size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (idx < sortedPlayers.length - 1) handleReorder(player.id, sortedPlayers[idx + 1].id);
                                }}
                                disabled={idx === sortedPlayers.length - 1}
                                className="p-1 hover:bg-cyan-500 hover:text-black text-slate-500 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                title="Move down in depth chart"
                              >
                                <ChevronDown size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DepthChartVisualizer;
