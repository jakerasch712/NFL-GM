import React, { useState } from 'react';
import { Shield, Zap, Target, AlertCircle, Activity, ChevronRight, Clipboard, Flame, Award, TrendingUp, Sparkles, CheckCircle2, Sliders, UserCheck, Check, Brain } from 'lucide-react';
import { TEAMS_DB } from '../constants';
import { Player, PositionGroup, ScheduleMatch } from '../types';

interface GamePlanProps {
  selectedTeamId: string;
  currentWeek: number;
  allPlayers: Player[];
  setAllPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  teams: Record<string, any>;
  schedule: ScheduleMatch[];
}

interface GroupFocusSetting {
  group: PositionGroup;
  focusArea: string;
  intensity: 'Low' | 'Medium' | 'High';
}

interface IndividualDevState {
  playerId: string;
  focusArea: string;
  progress: number; // 0 to 100
}

const POSITION_FOCUS_OPTIONS: Record<PositionGroup, string[]> = {
  QB: ['Pass Accuracy & Precision', 'Pocket Mobility', 'Field Vision', 'Play-Action Execution'],
  RB: ['Elusive Cuts & Agility', 'Power Rushing', 'Ball Security', 'Pass Protection & Catching'],
  WR: ['Route Running Precision', 'Release & Press Separation', 'Deep Vertical Threat', 'Contested Catches'],
  TE: ['Inline Power Blocking', 'Seam Route Speed', 'Red Zone Target Isolation'],
  OL: ['Pass Protection Technique', 'Zone Reach Blocking', 'Power Gap Pulling'],
  DL: ['Pass Rush Finesse', 'Power Bull Rush', 'Block Shedding & Run Stuff'],
  LB: ['Zone Pass Coverage', 'Gap Discipline & Tackling', 'Pass Blitz Angles'],
  DB: ['Press Man Coverage', 'Zone Deep Field Reading', 'Ball Hawk Interceptions'],
  ST: ['Kick Power & Distance', 'Coverage Unit Tackling']
};

const GamePlan: React.FC<GamePlanProps> = ({
  selectedTeamId,
  currentWeek,
  allPlayers,
  setAllPlayers,
  teams,
  schedule
}) => {
  const players = allPlayers.filter(p => p.teamId === selectedTeamId);
  const [activeTab, setActiveTab] = useState<'tactical' | 'scheme' | 'development'>('tactical');
  const [schemeFilter, setSchemeFilter] = useState<'ALL' | 'IDEAL' | 'MISMATCH'>('ALL');
  const [focus, setFocus] = useState<'OFFENSE' | 'DEFENSE' | 'BALANCED'>('BALANCED');
  const [intensity, setIntensity] = useState(50);

  // Helper for Coordinator Scheme Fit analysis
  const getPlayerSchemeFit = (player: Player) => {
    const diff = (player.schemeOvr || player.overall) - player.overall;
    let fitPct = 84 + diff * 4;
    if (player.developmentTrait === 'X-Factor') fitPct += 6;
    if (player.developmentTrait === 'Superstar') fitPct += 4;
    fitPct = Math.min(99, Math.max(64, fitPct));

    let tag: 'IDEAL FIT' | 'SCHEME FIT' | 'FLEX FIT' | 'MISMATCH' = 'SCHEME FIT';
    let tagColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

    if (fitPct >= 90) {
      tag = 'IDEAL FIT';
      tagColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (fitPct >= 80) {
      tag = 'SCHEME FIT';
      tagColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    } else if (fitPct >= 72) {
      tag = 'FLEX FIT';
      tagColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else {
      tag = 'MISMATCH';
      tagColor = 'text-red-400 bg-red-500/10 border-red-500/30';
    }

    const traitsMap: Record<string, string> = {
      QB: 'Field Vision & Quick Pocket Release',
      RB: 'Zone One-Cut & Agility',
      WR: 'Route Precision & Press Separation',
      TE: 'Seam Route Speed & Inline Blocking',
      OL: 'Lateral Zone Footwork & Anchor',
      DL: 'Pass Rush Finesse & Block Shedding',
      LB: 'Zone Coverage Reading & Gap Tackling',
      DB: 'Press Man Speed & Ball Hawk Instincts',
      K: 'Clutch Kicking Power',
      P: 'Directional Hangtime'
    };

    return {
      fitPct,
      tag,
      tagColor,
      schemeTrait: traitsMap[player.position] || 'Tactical Alignment'
    };
  };

  const handleAlignPlayerScheme = (playerId: string) => {
    if (!setAllPlayers) return;
    setAllPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          schemeOvr: Math.min(99, (p.schemeOvr || p.overall) + 2)
        };
      }
      return p;
    }));
    setDrillSuccess(`SCHEME ALIGNMENT BOOST :: Player scheme understanding optimized!`);
    setTimeout(() => setDrillSuccess(null), 3500);
  };

  // Position Group Focus Settings
  const [groupSettings, setGroupSettings] = useState<GroupFocusSetting[]>([
    { group: 'QB', focusArea: 'Pass Accuracy & Precision', intensity: 'Medium' },
    { group: 'RB', focusArea: 'Power Rushing', intensity: 'Medium' },
    { group: 'WR', focusArea: 'Route Running Precision', intensity: 'High' },
    { group: 'TE', focusArea: 'Inline Power Blocking', intensity: 'Low' },
    { group: 'OL', focusArea: 'Pass Protection Technique', intensity: 'Medium' },
    { group: 'DL', focusArea: 'Pass Rush Finesse', intensity: 'High' },
    { group: 'LB', focusArea: 'Gap Discipline & Tackling', intensity: 'Medium' },
    { group: 'DB', focusArea: 'Press Man Coverage', intensity: 'High' },
  ]);

  // Individual Player Dev Focuses
  const defaultSelectedPlayerIds = players.slice(0, 3).map(p => p.id);
  const [individualDevs, setIndividualDevs] = useState<IndividualDevState[]>([
    { playerId: defaultSelectedPlayerIds[0] || '', focusArea: 'Primary Technique', progress: 45 },
    { playerId: defaultSelectedPlayerIds[1] || '', focusArea: 'Explosiveness', progress: 70 },
    { playerId: defaultSelectedPlayerIds[2] || '', focusArea: 'Tactical Reading', progress: 20 },
  ]);

  const [drillLog, setDrillLog] = useState<string[]>([]);
  const [drillSuccess, setDrillSuccess] = useState<string | null>(null);

  // Find next match
  const nextMatch = schedule.find(m =>
    m.week >= currentWeek && !m.isCompleted && (m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId)
  );

  let nextOpp: any = { name: 'BYE', code: 'BYE' };
  if (nextMatch) {
    const oppId = nextMatch.homeTeamId === selectedTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId;
    const oppTeam = teams[oppId] || TEAMS_DB[oppId];
    nextOpp = {
      name: `${oppTeam.city} ${oppTeam.name}`,
      code: oppId
    };
  }

  const updateGroupFocus = (group: PositionGroup, key: 'focusArea' | 'intensity', val: any) => {
    setGroupSettings(prev => prev.map(item => item.group === group ? { ...item, [key]: val } : item));
  };

  const updateIndividualPlayer = (index: number, playerId: string) => {
    setIndividualDevs(prev => {
      const next = [...prev];
      next[index] = { playerId, focusArea: 'Technique Mastery', progress: Math.floor(Math.random() * 30) + 10 };
      return next;
    });
  };

  const updateIndividualFocusArea = (index: number, focusArea: string) => {
    setIndividualDevs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], focusArea };
      return next;
    });
  };

  const handleRunTrainingSession = () => {
    if (!setAllPlayers) return;

    const newLogs: string[] = [];
    let levelUps = 0;

    // Advance individual focus progress
    const updatedDevs = individualDevs.map(dev => {
      const targetPlayer = players.find(p => p.id === dev.playerId);
      if (!targetPlayer) return dev;

      // Dev multiplier based on development trait
      const devMultiplier = 
        targetPlayer.developmentTrait === 'X-Factor' ? 1.6 :
        targetPlayer.developmentTrait === 'Superstar' ? 1.4 :
        targetPlayer.developmentTrait === 'Star' ? 1.2 : 1.0;

      const xpGain = Math.round((25 + Math.floor(Math.random() * 15)) * devMultiplier);
      const newProgress = dev.progress + xpGain;

      if (newProgress >= 100) {
        levelUps++;
        newLogs.push(`LEVEL UP! ${targetPlayer.name} (${targetPlayer.position}) reached 100 XP in ${dev.focusArea}! +1 Overall Rating!`);
        
        // Upgrade player overall
        setAllPlayers(prevAll => prevAll.map(p => {
          if (p.id === targetPlayer.id) {
            return {
              ...p,
              overall: Math.min(99, p.overall + 1),
              schemeOvr: Math.min(99, p.schemeOvr + 1)
            };
          }
          return p;
        }));

        return { ...dev, progress: newProgress - 100 };
      } else {
        newLogs.push(`${targetPlayer.name} (${targetPlayer.position}) gained +${xpGain} XP in ${dev.focusArea} (${newProgress}/100)`);
        return { ...dev, progress: newProgress };
      }
    });

    setIndividualDevs(updatedDevs);

    // Minor boost across active position groups
    newLogs.unshift(`GROUP DRILLS EXECUTED :: ${groupSettings.length} Position Groups completed custom drill protocols.`);
    setDrillLog(newLogs);
    setDrillSuccess(`PRACTICE SESSION COMPLETE :: ${levelUps > 0 ? `${levelUps} PLAYER LEVEL UP!` : 'ATTRIBUTES BOOSTED'}`);

    setTimeout(() => {
      setDrillSuccess(null);
    }, 4000);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-[#05070a]">
      <header className="mb-6 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">TACTICAL_&_DEVELOPMENT_HUB</h2>
          <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
            <Activity size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
            WEEK {currentWeek.toString().padStart(2, '0')} // TARGET::{nextOpp.name.replace(' ', '_').toUpperCase()}
          </p>
        </div>

        <div className="flex bg-[#0a0e14] border border-[#1a222e] p-1">
          <button
            onClick={() => setActiveTab('tactical')}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mono-font transition-all ${
              activeTab === 'tactical' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-500 hover:text-white'
            }`}
          >
            TACTICAL GAME PLAN
          </button>
          <button
            onClick={() => setActiveTab('scheme')}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mono-font flex items-center gap-2 transition-all ${
              activeTab === 'scheme' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            SCHEME FIT ANALYSIS
          </button>
          <button
            onClick={() => setActiveTab('development')}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mono-font flex items-center gap-2 transition-all ${
              activeTab === 'development' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            PLAYER DEVELOPMENT ({players.length})
          </button>
        </div>
      </header>

      {drillSuccess && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-mono text-[11px] uppercase tracking-widest flex items-center gap-3">
          <CheckCircle2 size={18} />
          <span>{drillSuccess}</span>
        </div>
      )}

      {activeTab === 'tactical' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 flex-1 overflow-hidden">
          {/* Left: Game Planning */}
          <div className="lg:col-span-2 space-y-1 overflow-y-auto pr-1">
            <div className="bg-[#0a0e14] border border-[#1a222e] p-8 shadow-xl">
              <h3 className="text-[10px] font-bold text-white mb-8 flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Clipboard size={18} className="text-cyan-400 animate-pulse" />
                STRATEGIC_PROTOCOL_INITIALIZATION
              </h3>
              
              <div className="grid grid-cols-3 gap-1 mb-10">
                {(['OFFENSE', 'DEFENSE', 'BALANCED'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setFocus(f)}
                    className={`p-6 border transition-all relative overflow-hidden group ${
                      focus === f 
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(0,209,255,0.1)]' 
                      : 'bg-[#05070a] border-[#1a222e] text-slate-600 hover:border-slate-700'
                    }`}
                  >
                    {focus === f && <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500 animate-pulse"></div>}
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 mono-font italic">{f}</div>
                    <div className="text-[9px] font-mono tracking-widest opacity-50 uppercase">FOCUS_LOAD</div>
                  </button>
                ))}
              </div>

              <div className="space-y-10">
                <div>
                  <div className="flex justify-between mb-4 items-end">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mono-font italic">PRACTICE_INTENSITY_CORE</label>
                    <span className={`text-2xl font-mono font-bold tracking-tighter ${intensity > 75 ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-cyan-500 shadow-[0_0_10px_rgba(0,209,255,0.3)]'}`}>{intensity}%</span>
                  </div>
                  <div className="relative pt-2">
                    <input 
                      type="range" min="0" max="100" 
                      value={intensity} 
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#1a222e] appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all border-x border-[#1a222e]" 
                    />
                    <div className="flex justify-between text-[8px] text-slate-700 mt-3 uppercase font-bold tracking-widest mono-font italic">
                      <span className="flex items-center gap-2"><div className="w-1 h-1 bg-[#1a222e]"></div> MIN_THRESHOLD::WALKTHROUGH</span>
                      <span className="flex items-center gap-2">MAX_THRESHOLD::FULL_GEAR <div className="w-1 h-1 bg-[#1a222e]"></div></span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#05070a] border border-[#1a222e] p-6 flex items-start gap-4 group hover:border-amber-500/30 transition-colors">
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
                    <AlertCircle size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-white mb-2 uppercase tracking-[0.2em] mono-font italic">BIOMETRIC_RISK_ASSESSMENT</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-mono uppercase tracking-widest italic">
                      High intensity engagement increases <span className="text-red-500 underline decoration-red-500/20 underline-offset-4">FATIGUE_NODE</span> & <span className="text-red-500 underline decoration-red-500/20 underline-offset-4">STRUCT_FAILURE</span>. 
                      Active settings: <span className="text-amber-500 font-bold">+12% FATIGUE_ACCELERATION</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-8 shadow-xl">
              <h3 className="text-[10px] font-bold text-white mb-8 flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Target size={18} className="text-fuchsia-400 animate-pulse" />
                ADVERSARY_SIGNATURE_READOUT
              </h3>
              <div className="grid grid-cols-2 gap-1 mb-8">
                <div className="p-6 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                  <div className="text-[9px] text-slate-600 uppercase font-bold mb-3 tracking-widest italic">OFFENSIVE_TENDENCY</div>
                  <div className="text-xs text-white font-bold tracking-widest font-mono uppercase">HEAVY_RUN // RPO_ENGINE</div>
                </div>
                <div className="p-6 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                  <div className="text-[9px] text-slate-600 uppercase font-bold mb-3 tracking-widest italic">DEFENSIVE_VULNERABILITY</div>
                  <div className="text-xs text-white font-bold tracking-widest font-mono uppercase">DEEP_PASS_VECTOR // SLOT_ENTRY</div>
                </div>
              </div>

              {/* Play-Call Probability Heatmap */}
              <div className="pt-4 border-t border-[#1a222e]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={14} />
                      PLAY-CALL PROBABILITY HEATMAP vs {nextOpp.name.toUpperCase()}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                      TACTICAL EFFICIENCY MATRIX BASED ON SIMULATED OPPONENT COVERAGES
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-[9px] font-bold">
                    RECOMMENDED: SHOTGUN vs COVER 3
                  </span>
                </div>

                {/* Heatmap Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-[#1a222e] text-[8.5px] text-slate-500 uppercase">
                        <th className="p-2 border-r border-[#1a222e]">FORMATION</th>
                        <th className="p-2 text-center">COVER 1 PRESS</th>
                        <th className="p-2 text-center">COVER 2 ZONE</th>
                        <th className="p-2 text-center">COVER 3 MATCH</th>
                        <th className="p-2 text-center">COVER 4 QUARTERS</th>
                        <th className="p-2 text-center">ZERO BLITZ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a222e] text-[10px]">
                      {[
                        {
                          formation: 'Shotgun 11 Spread',
                          c1: { prob: 68, yds: 6.2, play: 'Slot Out & Up' },
                          c2: { prob: 78, yds: 8.1, play: 'PA Y-Leak' },
                          c3: { prob: 88, yds: 11.4, play: 'Four Verticals' },
                          c4: { prob: 54, yds: 4.8, play: 'Inside Zone' },
                          c0: { prob: 82, yds: 12.0, play: 'Quick Slant / Screen' }
                        },
                        {
                          formation: 'Singleback Ace',
                          c1: { prob: 75, yds: 7.0, play: 'Stretch Right' },
                          c2: { prob: 62, yds: 5.5, play: 'TE Seam' },
                          c3: { prob: 58, yds: 4.9, play: 'Power G' },
                          c4: { prob: 72, yds: 6.8, play: 'Outside Zone' },
                          c0: { prob: 45, yds: 2.1, play: 'Fullback Dive' }
                        },
                        {
                          formation: 'Pistol Trips Left',
                          c1: { prob: 80, yds: 9.2, play: 'RPO Bubble Screen' },
                          c2: { prob: 70, yds: 7.1, play: 'WR Dig Route' },
                          c3: { prob: 84, yds: 10.5, play: 'PA Post Cross' },
                          c4: { prob: 60, yds: 5.2, play: 'Draw Play' },
                          c0: { prob: 76, yds: 8.8, play: 'QB Keep' }
                        },
                        {
                          formation: 'I-Form Heavy',
                          c1: { prob: 82, yds: 6.8, play: 'ISO Lead Rush' },
                          c2: { prob: 52, yds: 3.8, play: 'Power Counter' },
                          c3: { prob: 48, yds: 3.2, play: 'Fullback Lead' },
                          c4: { prob: 65, yds: 5.0, play: 'PA FB Wheel' },
                          c0: { prob: 38, yds: 1.5, play: 'Toss Sweep' }
                        }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-cyan-500/5">
                          <td className="p-2 font-bold text-white border-r border-[#1a222e] bg-[#05070a]">
                            {row.formation}
                          </td>
                          {[row.c1, row.c2, row.c3, row.c4, row.c0].map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 text-center">
                              <div className={`p-1.5 border font-bold ${
                                cell.prob >= 75
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                                  : cell.prob >= 60
                                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                                  : 'bg-red-500/15 border-red-500/50 text-red-400'
                              }`}>
                                <div className="text-xs">{cell.prob}%</div>
                                <div className="text-[7.5px] opacity-80 uppercase">{cell.yds} YDS/P</div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Roster Health & Wear and Tear */}
          <div className="bg-[#0a0e14] border border-[#1a222e] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-[#1a222e] bg-[#0d121a]/50">
              <h3 className="text-[10px] font-bold text-white flex items-center gap-2 mono-font tracking-[0.3em] uppercase italic">
                <Activity size={18} className="text-emerald-500 animate-pulse" />
                BIOMETRIC_REGISTRY
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-1 bg-[#05070a]/20">
              {players.map(player => (
                <div key={player.id} className="p-5 bg-[#0a0e14] border border-[#1a222e] group hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-white text-xs tracking-tight uppercase italic header-font group-hover:text-cyan-400 transition-colors">{player.name}</div>
                      <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mono-font mt-1">{player.position} // NODE_ID::{player.id.slice(0, 4)}</div>
                    </div>
                    <div className={`text-lg font-mono font-bold tracking-tighter ${player.fatigue < 80 ? 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>
                      {player.fatigue}%
                    </div>
                  </div>
                  <div className="w-full bg-[#05070a] h-[2px] border border-[#1a222e] overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${player.fatigue < 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} 
                      style={{width: `${player.fatigue}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'scheme' ? (
        /* COORDINATOR SCHEME FIT ANALYSIS TAB */
        <div className="flex-1 overflow-y-auto space-y-6 font-mono">
          {/* Top Coaching Staff Scheme Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 relative overflow-hidden group">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mb-1">OFFENSIVE_COORDINATOR_SCHEME</div>
              <h3 className="text-2xl font-bold text-white header-font uppercase italic">WEST COAST SPREAD</h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Prioritizes quick QBs with high field vision, route-running precision WRs, and one-cut zone RBs.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold">PASS 68%</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-bold">ZONE RUN 32%</span>
              </div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 relative overflow-hidden group">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] mb-1">DEFENSIVE_COORDINATOR_SCHEME</div>
              <h3 className="text-2xl font-bold text-white header-font uppercase italic">4-3 COVER 3 MATCH</h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Demands high finesse pass rush DL, range LBs for deep seam coverage, and press-man DBs.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold">MATCH ZONE 65%</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-bold">BLITZ 35%</span>
              </div>
            </div>

            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.3em] mb-1">ROSTER_SCHEME_ALIGNMENT_INDEX</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white header-font italic">
                    {Math.round(
                      players.reduce((acc, p) => acc + getPlayerSchemeFit(p).fitPct, 0) / Math.max(1, players.length)
                    )}%
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">HIGH HARMONY</span>
                </div>
              </div>
              <div className="w-full bg-[#05070a] border border-[#1a222e] h-2.5 rounded-none overflow-hidden mt-3">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,209,255,0.8)]"
                  style={{ 
                    width: `${Math.round(
                      players.reduce((acc, p) => acc + getPlayerSchemeFit(p).fitPct, 0) / Math.max(1, players.length)
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 flex justify-between">
                <span>IDEAL: {players.filter(p => getPlayerSchemeFit(p).fitPct >= 90).length} PLAYERS</span>
                <span>MISMATCH: {players.filter(p => getPlayerSchemeFit(p).fitPct < 75).length} PLAYERS</span>
              </div>
            </div>
          </div>

          {/* Scheme Fit Filter & Player List */}
          <div className="bg-[#0a0e14] border border-[#1a222e] p-6">
            <div className="flex justify-between items-center mb-6 border-b border-[#1a222e] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white header-font uppercase italic flex items-center gap-2">
                  <UserCheck className="text-cyan-400" size={20} />
                  PLAYER_SCHEME_COMPATIBILITY_REGISTRY
                </h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">
                  Individual compatibility analysis mapping roster attributes directly to coordinator scheme requirements.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSchemeFilter('ALL')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase transition-all border ${
                    schemeFilter === 'ALL' 
                      ? 'bg-cyan-500 text-black border-cyan-400' 
                      : 'bg-[#05070a] text-slate-400 border-[#1a222e] hover:text-white'
                  }`}
                >
                  ALL ({players.length})
                </button>
                <button
                  onClick={() => setSchemeFilter('IDEAL')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase transition-all border ${
                    schemeFilter === 'IDEAL' 
                      ? 'bg-emerald-500 text-black border-emerald-400' 
                      : 'bg-[#05070a] text-slate-400 border-[#1a222e] hover:text-white'
                  }`}
                >
                  IDEAL FITS ({players.filter(p => getPlayerSchemeFit(p).fitPct >= 90).length})
                </button>
                <button
                  onClick={() => setSchemeFilter('MISMATCH')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase transition-all border ${
                    schemeFilter === 'MISMATCH' 
                      ? 'bg-red-500 text-black border-red-400' 
                      : 'bg-[#05070a] text-slate-400 border-[#1a222e] hover:text-white'
                  }`}
                >
                  MISMATCHES ({players.filter(p => getPlayerSchemeFit(p).fitPct < 75).length})
                </button>
              </div>
            </div>

            {/* Player Scheme Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {players
                .filter(p => {
                  const fit = getPlayerSchemeFit(p);
                  if (schemeFilter === 'IDEAL') return fit.fitPct >= 90;
                  if (schemeFilter === 'MISMATCH') return fit.fitPct < 75;
                  return true;
                })
                .map((player) => {
                  const fit = getPlayerSchemeFit(player);
                  return (
                    <div 
                      key={player.id}
                      className="bg-[#05070a] border border-[#1a222e] hover:border-cyan-500/50 p-4 flex flex-col justify-between transition-all group relative"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{player.position} // NODE::{player.id.slice(0, 4)}</span>
                            <h4 className="text-base font-bold text-white header-font tracking-wide block">{player.name}</h4>
                          </div>
                          <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${fit.tagColor}`}>
                            {fit.tag} ({fit.fitPct}%)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 text-[10px] bg-[#0a0e14] p-2 border border-[#1a222e]">
                          <div>
                            <span className="text-slate-500 text-[8px] block uppercase font-bold">BASE OVERALL</span>
                            <span className="text-white font-bold text-sm">{player.overall} OVR</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[8px] block uppercase font-bold">SCHEME OVERALL</span>
                            <span className="text-cyan-400 font-bold text-sm">{player.schemeOvr || player.overall} OVR</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 mb-3 leading-tight">
                          <span className="text-slate-500 text-[9px] uppercase font-bold block mb-0.5">KEY SCHEME TRAIT:</span>
                          <span className="text-cyan-300 font-bold">🎯 {fit.schemeTrait}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAlignPlayerScheme(player.id)}
                        className="w-full mt-2 py-2 bg-[#0a0e14] hover:bg-cyan-500 hover:text-black border border-[#1a222e] hover:border-cyan-400 text-cyan-400 text-[9.5px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Brain size={12} />
                        OPTIMIZE SCHEME ALIGNMENT
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        /* PLAYER DEVELOPMENT & TRAINING FOCUS TAB */
        <div className="grid grid-cols-12 gap-6 flex-1 overflow-y-auto">
          {/* Position Group Training Focus Matrix */}
          <div className="col-span-12 xl:col-span-7 bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#1a222e]">
              <div>
                <h3 className="text-lg font-bold text-white header-font tracking-tight uppercase italic flex items-center gap-2">
                  <Award className="text-cyan-400" size={20} />
                  POSITION_GROUP_TRAINING_FOCUS
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                  Assign tactical drills to position units to boost specialized stats over the season.
                </p>
              </div>
              <button 
                onClick={handleRunTrainingSession}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 text-[10px] font-bold font-mono tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,209,255,0.3)] flex items-center gap-2"
              >
                <Flame size={14} />
                SIMULATE_TRAINING_SESSION
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {groupSettings.map(setting => {
                const groupOptions = POSITION_FOCUS_OPTIONS[setting.group] || ['Technique Mastery'];
                return (
                  <div key={setting.group} className="bg-[#05070a] border border-[#1a222e] p-4 flex items-center justify-between hover:border-cyan-500/40 transition-all group">
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <div className="w-10 h-10 bg-[#0d121a] border border-[#1a222e] flex items-center justify-center font-mono font-bold text-cyan-400 text-sm">
                        {setting.group}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase font-mono tracking-wider">{setting.group} UNIT</div>
                        <div className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">
                          {players.filter(p => {
                            if (setting.group === 'DB') return p.position === 'CB' || p.position === 'S';
                            return p.position === setting.group;
                          }).length} PLAYERS
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 mx-6">
                      <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">DRILL FOCUS</label>
                      <select 
                        value={setting.focusArea}
                        onChange={(e) => updateGroupFocus(setting.group, 'focusArea', e.target.value)}
                        className="w-full bg-[#0a0e14] border border-[#1a222e] text-slate-200 text-[10px] font-mono px-3 py-1.5 focus:outline-none focus:border-cyan-500 uppercase tracking-wider cursor-pointer"
                      >
                        {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">INTENSITY</label>
                      <select 
                        value={setting.intensity}
                        onChange={(e) => updateGroupFocus(setting.group, 'intensity', e.target.value as any)}
                        className={`w-full bg-[#0a0e14] border text-[10px] font-mono font-bold px-3 py-1.5 focus:outline-none uppercase tracking-wider cursor-pointer ${
                          setting.intensity === 'High' ? 'text-red-400 border-red-500/30' : setting.intensity === 'Medium' ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="Low">LOW</option>
                        <option value="Medium">MEDIUM</option>
                        <option value="High">HIGH</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Player Mentorship Focus */}
          <div className="col-span-12 xl:col-span-5 flex flex-col gap-6">
            <div className="bg-[#0a0e14] border border-[#1a222e] p-6 shadow-2xl flex-1 flex flex-col">
              <div className="pb-4 mb-4 border-b border-[#1a222e]">
                <h3 className="text-base font-bold text-white header-font tracking-tight uppercase italic flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" size={18} />
                  INDIVIDUAL_DEVELOPMENT_SLOTS
                </h3>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                  Assign high-priority individual mentorship to fast-track attribute growth.
                </p>
              </div>

              <div className="space-y-4 flex-1">
                {individualDevs.map((dev, idx) => {
                  const targetPlayer = players.find(p => p.id === dev.playerId);
                  return (
                    <div key={idx} className="bg-[#05070a] border border-[#1a222e] p-4 hover:border-emerald-500/40 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                          SLOT {idx + 1} // MENTORSHIP
                        </span>
                        {targetPlayer && (
                          <span className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest border ${
                            targetPlayer.developmentTrait === 'X-Factor' ? 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/5' :
                            targetPlayer.developmentTrait === 'Superstar' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
                            'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
                          }`}>
                            {targetPlayer.developmentTrait}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">SELECT PLAYER</label>
                          <select
                            value={dev.playerId}
                            onChange={(e) => updateIndividualPlayer(idx, e.target.value)}
                            className="w-full bg-[#0a0e14] border border-[#1a222e] text-white text-[10px] font-mono px-2 py-1 focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
                          >
                            {players.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.position} {p.name} ({p.overall} OVR)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mb-1">FOCUS AREA</label>
                          <input 
                            type="text"
                            value={dev.focusArea}
                            onChange={(e) => updateIndividualFocusArea(idx, e.target.value)}
                            className="w-full bg-[#0a0e14] border border-[#1a222e] text-emerald-400 text-[10px] font-mono px-2 py-1 focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
                          />
                        </div>
                      </div>

                      {/* Progress Bar towards Level Up */}
                      <div>
                        <div className="flex justify-between text-[9px] font-mono mb-1">
                          <span className="text-slate-500">XP PROGRESS TO NEXT OVR</span>
                          <span className="text-emerald-400 font-bold">{dev.progress} / 100 XP</span>
                        </div>
                        <div className="w-full bg-[#0a0e14] h-2 border border-[#1a222e] overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                            style={{ width: `${dev.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drill Execution Output Log */}
            {drillLog.length > 0 && (
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5 shadow-2xl">
                <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity size={14} />
                  DRILL_EXECUTION_LOG
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {drillLog.map((log, i) => (
                    <div key={i} className="text-[9.5px] font-mono text-slate-300 leading-tight border-l border-cyan-500/30 pl-2">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlan;
