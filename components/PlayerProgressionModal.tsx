import React, { useState, useMemo } from 'react';
import { Player, Position, PlayerAttributes, ArchetypeUpgradePackage } from '../types';
import { 
  generatePlayerAttributes, 
  getArchetypeUpgradePackages, 
  spendSkillPoint, 
  conductCoachMeeting,
  getPlayerCareerPhase,
  getDevTraitMultiplier,
  calculateMorale,
  calculatePlayerCareerMilestones
} from '../services/progressionService';
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  Flame, 
  Award, 
  Activity, 
  Sparkles, 
  MessageSquare, 
  X, 
  ChevronRight, 
  Heart, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Brain, 
  Dumbbell, 
  History,
  Target,
  BarChart3,
  Calendar,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Star,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerProgressionModalProps {
  player: Player;
  onClose: () => void;
  onUpdatePlayer: (updatedPlayer: Player) => void;
  team: any;
}

const PlayerProgressionModal: React.FC<PlayerProgressionModalProps> = ({
  player,
  onClose,
  onUpdatePlayer,
  team
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'morale' | 'career' | 'milestones' | 'history'>('attributes');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [boostedStatsNotice, setBoostedStatsNotice] = useState<string | null>(null);

  const attributes: PlayerAttributes = player.attributes || generatePlayerAttributes(player);
  const skillPoints = player.skillPoints || 0;
  const xp = player.xp || 0;
  const xpTarget = player.xpToNextLevel || 1000;
  const xpPct = Math.min(100, Math.round((xp / xpTarget) * 100));

  const careerPhase = player.careerPhase || getPlayerCareerPhase(player.age);
  const devMult = getDevTraitMultiplier(player.developmentTrait);
  const isStarter = (player.depth || 0) === 0;
  const moraleData = calculateMorale(player, team, isStarter);

  const archetypePackages = getArchetypeUpgradePackages(player);
  const milestonesData = useMemo(() => calculatePlayerCareerMilestones(player), [player]);

  const handleSpendPoint = (pkgName: string) => {
    if (skillPoints < 1) return;
    const { updatedPlayer, boostedStats } = spendSkillPoint(player, pkgName);
    onUpdatePlayer(updatedPlayer);
    setBoostedStatsNotice(`UPGRADE COMPLETE :: ${boostedStats.map(s => `+${s.newValue - s.oldValue} ${s.stat}`).join(' | ')}`);
    setTimeout(() => setBoostedStatsNotice(null), 4000);
  };

  const handleCoachAction = (type: 'PEP_TALK' | 'ROLE_PROMISE' | 'TARGET_PROMISE' | 'CONTRACT_ASSURANCE' | 'PRAISE') => {
    const { updatedPlayer, message, moraleDelta } = conductCoachMeeting(player, type);
    onUpdatePlayer(updatedPlayer);
    setActionSuccess(`COACH INTERVENTION :: ${message} (+${moraleDelta}% Morale)`);
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const getAttributeColor = (val?: number) => {
    if (!val) return 'text-slate-500 bg-slate-800/40 border-slate-700';
    if (val >= 90) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#0a0e14] border border-cyan-500/30 w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_50px_rgba(0,209,255,0.15)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 bg-[#05070a] border-b border-[#1a222e] flex items-center justify-between relative">
          <div className="flex items-center gap-5">
            {/* Player OVR Badge */}
            <div className="relative">
              <div className="w-16 h-16 bg-[#0a0e14] border-2 border-cyan-500/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,209,255,0.2)]">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">OVR</span>
                <span className="text-2xl font-bold font-mono text-white leading-none">{player.overall}</span>
                <span className="text-[8px] font-mono text-cyan-400 font-bold">SCH:{player.schemeOvr || player.overall}</span>
              </div>
              <div className={`absolute -bottom-2 -right-2 text-[8px] font-mono font-bold px-1.5 py-0.5 border ${
                player.developmentTrait === 'X-Factor' ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                player.developmentTrait === 'Superstar' ? 'bg-cyan-500 text-black border-cyan-400' :
                player.developmentTrait === 'Star' ? 'bg-emerald-500 text-black border-emerald-400' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {player.developmentTrait}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white uppercase font-mono tracking-wider">{player.name}</h2>
                <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                  {player.position} // #{player.depth === 0 ? 'STARTER' : `DEPTH ${player.depth}`}
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 font-mono">
                  AGE: {player.age} ({careerPhase.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                ARCHETYPE: <span className="text-slate-200 font-bold uppercase">{player.archetype}</span> | 
                PERSONALITY: <span className="text-cyan-400 font-bold">{player.personality}</span> | 
                SCHEME: <span className="text-slate-200 font-bold">{player.scheme}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Skill Points Ready Pill */}
            {skillPoints > 0 ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/50 px-4 py-2 animate-pulse">
                <Sparkles size={16} className="text-cyan-400" />
                <div className="text-right">
                  <div className="text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-widest">SKILL POINTS READY</div>
                  <div className="text-sm font-mono font-bold text-white">{skillPoints} POINT{skillPoints > 1 ? 'S' : ''} TO SPEND</div>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">NEXT SKILL POINT</div>
                <div className="text-xs font-mono font-bold text-cyan-400">{xp} / {xpTarget} XP ({xpPct}%)</div>
              </div>
            )}

            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all border border-[#1a222e]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* XP Progress Bar Strip */}
        <div className="w-full bg-[#05070a] border-b border-[#1a222e] px-6 py-2 flex items-center gap-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest shrink-0">
            PROGRESSION_XP::
          </span>
          <div className="flex-1 bg-slate-900 h-2.5 border border-slate-800 overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(0,209,255,0.5)]"
            />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider shrink-0">
            {xpPct}% (DEV MULTIPLIER: {devMult}x)
          </span>
        </div>

        {/* Notifications & Action Feedback */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-500/10 border-b border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2 px-6"
            >
              <CheckCircle2 size={16} />
              <span>{actionSuccess}</span>
            </motion.div>
          )}
          {boostedStatsNotice && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-cyan-500/10 border-b border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 px-6"
            >
              <Sparkles size={16} />
              <span>{boostedStatsNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="bg-[#05070a] border-b border-[#1a222e] px-6 flex gap-2">
          <button
            onClick={() => setActiveTab('attributes')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'attributes' ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Dumbbell size={14} />
            ATTRIBUTES & ARCHETYPES
            {skillPoints > 0 && (
              <span className="px-1.5 py-0.2 bg-cyan-500 text-black text-[9px] font-bold rounded-none">
                {skillPoints}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('morale')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'morale' ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Heart size={14} />
            MORALE & PSYCHOLOGY ({player.morale || 75}%)
          </button>

          <button
            onClick={() => setActiveTab('career')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'career' ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <TrendingUp size={14} />
            CAREER CURVE & TRAITS
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'milestones' ? 'text-amber-400 border-amber-500 bg-amber-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Trophy size={14} />
            CAREER MILESTONES & RECORDS
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <History size={14} />
            PROGRESSION LOG ({(player.progressionHistory || []).length})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#05070a]/60">
          {/* TAB 1: ATTRIBUTES & ARCHETYPE UPGRADES */}
          {activeTab === 'attributes' && (
            <div className="space-y-6">
              {/* Skill Point Spend Section */}
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                <div className="flex items-center justify-between mb-4 border-b border-[#1a222e] pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-2">
                      <Sparkles size={14} />
                      ARCHETYPE_UPGRADE_PACKAGES
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Spend 1 Skill Point to permanently boost grouped attributes and elevate overall rating.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">AVAILABLE POINTS:</span>
                    <span className={`ml-2 text-sm font-mono font-bold ${skillPoints > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {skillPoints}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {archetypePackages.map((pkg, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 border transition-all flex flex-col justify-between ${
                        skillPoints > 0 
                          ? 'bg-[#05070a] border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,209,255,0.05)]' 
                          : 'bg-[#05070a] border-[#1a222e] opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white font-mono uppercase">{pkg.name}</span>
                          <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20">
                            COST: {pkg.cost} SP
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mb-3 leading-relaxed">
                          {pkg.description}
                        </p>
                        <div className="space-y-1.5 mb-4">
                          {pkg.boosts.map((b, bIdx) => (
                            <div key={bIdx} className="flex justify-between items-center text-[10px] font-mono bg-slate-900/60 px-2.5 py-1 border border-slate-800">
                              <span className="text-slate-300">{b.label}</span>
                              <span className="text-emerald-400 font-bold">+{b.increase}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSpendPoint(pkg.name)}
                        disabled={skillPoints < 1}
                        className={`w-full py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          skillPoints > 0
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)] active:scale-[0.98]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Zap size={13} />
                        {skillPoints > 0 ? 'UPGRADE ARCHETYPE' : 'NEED 1 SKILL POINT'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Physical & Athleticism */}
                <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                  <h4 className="text-[11px] font-bold text-slate-300 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-2 mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    PHYSICAL & ATHLETICISM
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Speed', val: attributes.speed },
                      { label: 'Acceleration', val: attributes.acceleration },
                      { label: 'Strength', val: attributes.strength },
                      { label: 'Agility', val: attributes.agility },
                      { label: 'Awareness', val: attributes.awareness },
                      { label: 'Stamina', val: attributes.stamina },
                      { label: 'Toughness', val: attributes.toughness }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Positional & Technical Mastery */}
                <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                  <h4 className="text-[11px] font-bold text-slate-300 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-2 mb-4 flex items-center gap-2">
                    <Target size={14} className="text-emerald-400" />
                    POSITIONAL & TECHNICAL RATINGS
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* QB */}
                    {player.position === Position.QB && [
                      { label: 'Throw Power', val: attributes.throwPower },
                      { label: 'Short Accuracy', val: attributes.shortAccuracy },
                      { label: 'Medium Accuracy', val: attributes.mediumAccuracy },
                      { label: 'Deep Accuracy', val: attributes.deepAccuracy },
                      { label: 'Throw on Run', val: attributes.throwOnRun },
                      { label: 'Play Action', val: attributes.playAction },
                      { label: 'Carrying', val: attributes.carrying }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* RB */}
                    {player.position === Position.RB && [
                      { label: 'Carrying', val: attributes.carrying },
                      { label: 'Break Tackle', val: attributes.breakTackle },
                      { label: 'Trucking', val: attributes.trucking },
                      { label: 'Elusiveness', val: attributes.elusiveness },
                      { label: 'BC Vision', val: attributes.bcVision },
                      { label: 'Catching', val: attributes.catching }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* WR & TE */}
                    {(player.position === Position.WR || player.position === Position.TE) && [
                      { label: 'Catching', val: attributes.catching },
                      { label: 'Catch in Traffic', val: attributes.catchInTraffic },
                      { label: 'Short Route', val: attributes.shortRouteRunning },
                      { label: 'Medium Route', val: attributes.mediumRouteRunning },
                      { label: 'Deep Route', val: attributes.deepRouteRunning },
                      { label: 'Release vs Press', val: attributes.release },
                      { label: 'Spectacular Catch', val: attributes.spectacularCatch },
                      { label: 'Run Blocking', val: attributes.runBlock }
                    ].filter(i => i.val !== undefined).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* OL */}
                    {player.position === Position.OL && [
                      { label: 'Pass Block', val: attributes.passBlock },
                      { label: 'Run Block', val: attributes.runBlock },
                      { label: 'Impact Block', val: attributes.impactBlock },
                      { label: 'Pass Block Power', val: attributes.passBlockPower },
                      { label: 'Pass Block Finesse', val: attributes.passBlockFinesse },
                      { label: 'Run Block Power', val: attributes.runBlockPower }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* DL & LB */}
                    {(player.position === Position.DL || player.position === Position.LB) && [
                      { label: 'Tackle', val: attributes.tackle },
                      { label: 'Hit Power', val: attributes.hitPower },
                      { label: 'Block Shedding', val: attributes.blockShedding },
                      { label: 'Power Moves', val: attributes.powerMoves },
                      { label: 'Finesse Moves', val: attributes.finesseMoves },
                      { label: 'Pursuit', val: attributes.pursuit },
                      { label: 'Play Recognition', val: attributes.playRecognition },
                      { label: 'Zone Coverage', val: attributes.zoneCoverage }
                    ].filter(i => i.val !== undefined).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* CB & S */}
                    {(player.position === Position.CB || player.position === Position.S) && [
                      { label: 'Man Coverage', val: attributes.manCoverage },
                      { label: 'Zone Coverage', val: attributes.zoneCoverage },
                      { label: 'Press Technique', val: attributes.press },
                      { label: 'Play Recognition', val: attributes.playRecognition },
                      { label: 'Tackling', val: attributes.tackle },
                      { label: 'Hit Power', val: attributes.hitPower },
                      { label: 'Pursuit', val: attributes.pursuit }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}

                    {/* K & P */}
                    {player.position === Position.K && [
                      { label: 'Kick Power', val: attributes.kickPower },
                      { label: 'Kick Accuracy', val: attributes.kickAccuracy }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#05070a] border border-[#1a222e]">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${getAttributeColor(item.val)}`}>
                          {item.val || '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MORALE & PSYCHOLOGY MATRIX */}
          {activeTab === 'morale' && (
            <div className="space-y-6">
              {/* Morale Summary Banner */}
              <div className="bg-[#0a0e14] border border-[#1a222e] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-[#05070a] border-2 border-cyan-500/40 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">MORALE</span>
                    <span className="text-3xl font-bold font-mono text-cyan-400">{player.morale || 75}%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white font-mono uppercase">{moraleData.status} STATE</span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                        moraleData.devModifier >= 1.2 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        moraleData.devModifier <= 0.8 ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      }`}>
                        {moraleData.devModifier >= 1.0 ? `+${Math.round((moraleData.devModifier - 1) * 100)}% XP BOOST` : `-${Math.round((1 - moraleData.devModifier) * 100)}% XP PENALTY`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Morale directly impacts practice XP efficiency, clutch in-game play recognition, and contract negotiation receptiveness.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">PERSONALITY PROFILE:</span>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    {player.personality}
                  </span>
                </div>
              </div>

              {/* Morale Factors Breakdown */}
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                <h4 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-cyan-400" />
                  PSYCHOLOGICAL_DRIVERS & FACTORS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {moraleData.factors.map((factor) => (
                    <div 
                      key={factor.id} 
                      className={`p-3 border flex items-start justify-between gap-3 ${
                        factor.type === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
                        factor.type === 'negative' ? 'bg-red-500/5 border-red-500/20' :
                        'bg-[#05070a] border-[#1a222e]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white font-mono uppercase">{factor.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 leading-relaxed">{factor.description}</div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 border shrink-0 ${
                        factor.impact > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        factor.impact < 0 ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {factor.impact > 0 ? `+${factor.impact}` : factor.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Intervention Center */}
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                  <MessageSquare size={14} />
                  COACH_MEETING_ACTIONS (BOOST MORALE)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleCoachAction('PEP_TALK')}
                    className="p-3 bg-[#05070a] border border-[#1a222e] hover:border-cyan-500 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white font-mono uppercase group-hover:text-cyan-400">
                      1-ON-1 PEP TALK
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1">Review tape & inspire confidence (+12 Morale)</div>
                  </button>

                  <button
                    onClick={() => handleCoachAction('ROLE_PROMISE')}
                    className="p-3 bg-[#05070a] border border-[#1a222e] hover:border-cyan-500 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white font-mono uppercase group-hover:text-cyan-400">
                      ROLE PROMISE
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1">Guarantee expanded gameplan reps (+18 Morale)</div>
                  </button>

                  <button
                    onClick={() => handleCoachAction('TARGET_PROMISE')}
                    className="p-3 bg-[#05070a] border border-[#1a222e] hover:border-cyan-500 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white font-mono uppercase group-hover:text-cyan-400">
                      TARGET GUARANTEE
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1">Script high volume first-read plays (+15 Morale)</div>
                  </button>

                  <button
                    onClick={() => handleCoachAction('PRAISE')}
                    className="p-3 bg-[#05070a] border border-[#1a222e] hover:border-cyan-500 text-left transition-all group"
                  >
                    <div className="text-xs font-bold text-white font-mono uppercase group-hover:text-cyan-400">
                      MEDIA PRAISE
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1">Publicly praise leadership at presser (+10 Morale)</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAREER CURVE & TRAITS */}
          {activeTab === 'career' && (
            <div className="space-y-6">
              {/* Dev Trait & Career Phase Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                  <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                    <Award size={14} />
                    DEVELOPMENT_TRAIT_TIER
                  </h4>
                  <div className="p-4 bg-[#05070a] border border-cyan-500/20 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white font-mono uppercase">{player.developmentTrait} DEV</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{devMult}x XP GAIN</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-2 leading-relaxed">
                      {player.developmentTrait === 'X-Factor' ? 'Generational elite ceiling. Rapid attribute growth, maximum breakout trigger probability, and 50% resistance to age regression.' :
                       player.developmentTrait === 'Superstar' ? 'Pro Bowl caliber ceiling. High training absorption and strong breakout potential.' :
                       player.developmentTrait === 'Star' ? 'Starter ceiling with above average progression speed.' :
                       'Standard NFL player progression pace.'}
                    </p>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 space-y-1">
                    <div>• NORMAL DEV :: 1.0x XP Gain Rate</div>
                    <div>• STAR DEV :: 1.25x XP Gain Rate (+10% Breakout Chance)</div>
                    <div>• SUPERSTAR DEV :: 1.50x XP Gain Rate (+25% Breakout Chance)</div>
                    <div>• X-FACTOR DEV :: 1.85x XP Gain Rate (Age Decline Resistance)</div>
                  </div>
                </div>

                <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                  <h4 className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} />
                    CAREER_AGE_CURVE_ANALYSIS
                  </h4>
                  <div className="p-4 bg-[#05070a] border border-emerald-500/20 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white font-mono uppercase">{careerPhase} PHASE</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">AGE {player.age}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-2 leading-relaxed">
                      {careerPhase === 'Ascending' ? 'Ages 20-25: High developmental velocity. Athletic attributes peak rapidly with zero age regression risk.' :
                       careerPhase === 'Prime' ? 'Ages 26-29: Peak physical & tactical prime. Stable athleticism and high awareness growth.' :
                       careerPhase === 'Veteran' ? 'Ages 30-32: Veteran wisdom. Slight speed/stamina wear, but high football IQ and leadership.' :
                       'Ages 33+: Twilight stage. Accelerated physical decay (Speed/Accel/Stamina loss), requires careful snap management.'}
                    </p>
                  </div>

                  {/* Visual Age Stage Timeline */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
                    <div className={`p-2 border ${careerPhase === 'Ascending' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      ASCENDING<br />(20-25)
                    </div>
                    <div className={`p-2 border ${careerPhase === 'Prime' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      PRIME<br />(26-29)
                    </div>
                    <div className={`p-2 border ${careerPhase === 'Veteran' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      VETERAN<br />(30-32)
                    </div>
                    <div className={`p-2 border ${careerPhase === 'Declining' ? 'bg-red-500/20 border-red-500 text-red-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      DECLINING<br />(33+)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAREER MILESTONES & RECORDS TRACKER */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {/* Milestone Summary Header Banner */}
              <div className="bg-gradient-to-r from-[#0a0e14] via-[#101724] to-[#0a0e14] border border-amber-500/30 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Trophy size={120} className="text-amber-400" />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold uppercase">
                        FRANCHISE_LEGACY_TRACKER
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.max(1, player.age - 21)} NFL SEASONS PLAYED
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <Trophy size={18} className="text-amber-400" />
                      {player.name} — CAREER MILESTONE SUMMARY
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-1">
                      Target Landmark: <span className="text-amber-300 font-bold">{milestonesData.nextMilestoneLabel}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-[#05070a] border border-amber-500/30 px-4 py-2 text-center">
                      <div className="text-[9px] font-mono text-slate-500 uppercase">PRO BOWL HONORS</div>
                      <div className="text-xl font-bold font-mono text-amber-400">{milestonesData.proBowls}x</div>
                    </div>
                    <div className="bg-[#05070a] border border-cyan-500/30 px-4 py-2 text-center">
                      <div className="text-[9px] font-mono text-slate-500 uppercase">ALL-PRO TEAMS</div>
                      <div className="text-xl font-bold font-mono text-cyan-400">{milestonesData.allProCount}x</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Four Core Career Record Trackers: Total Yards, Touchdowns, Sacks, Pro Bowls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tracker 1: Total Yards */}
                <div className="bg-[#0a0e14] border border-[#1a222e] hover:border-amber-500/50 p-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Flame size={12} className="text-amber-400" />
                        TOTAL YARDS
                      </span>
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 border border-amber-400/20">
                        {milestonesData.yardsPct}% NEXT
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {milestonesData.totalYards.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Next Tier: {milestonesData.yardsTarget.toLocaleString()} YDS
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-[#05070a] h-1.5 overflow-hidden border border-[#1a222e]">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${milestonesData.yardsPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
                      <span>{(milestonesData.yardsTarget - milestonesData.totalYards > 0 ? milestonesData.yardsTarget - milestonesData.totalYards : 0).toLocaleString()} to unlock</span>
                      <span>Level Goal</span>
                    </div>
                  </div>
                </div>

                {/* Tracker 2: Touchdowns */}
                <div className="bg-[#0a0e14] border border-[#1a222e] hover:border-emerald-500/50 p-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Zap size={12} className="text-emerald-400" />
                        CAREER TOUCHDOWNS
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 border border-emerald-400/20">
                        {milestonesData.tdsPct}% NEXT
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {milestonesData.touchdowns} <span className="text-xs text-slate-500 font-normal">TDS</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Next Tier: {milestonesData.tdsTarget} TDS
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-[#05070a] h-1.5 overflow-hidden border border-[#1a222e]">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${milestonesData.tdsPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
                      <span>{Math.max(0, milestonesData.tdsTarget - milestonesData.touchdowns)} to unlock</span>
                      <span>Milestone Club</span>
                    </div>
                  </div>
                </div>

                {/* Tracker 3: Sacks */}
                <div className="bg-[#0a0e14] border border-[#1a222e] hover:border-cyan-500/50 p-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Shield size={12} className="text-cyan-400" />
                        CAREER SACKS
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 border border-cyan-400/20">
                        {milestonesData.sacksPct}% NEXT
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {milestonesData.sacks} <span className="text-xs text-slate-500 font-normal">SACKS</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Next Tier: {milestonesData.sacksTarget} SACKS
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-[#05070a] h-1.5 overflow-hidden border border-[#1a222e]">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                        style={{ width: `${milestonesData.sacksPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
                      <span>{Math.max(0, parseFloat((milestonesData.sacksTarget - milestonesData.sacks).toFixed(1)))} to unlock</span>
                      <span>Pass Rush Mark</span>
                    </div>
                  </div>
                </div>

                {/* Tracker 4: Pro Bowl & Honors */}
                <div className="bg-[#0a0e14] border border-[#1a222e] hover:border-purple-500/50 p-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Star size={12} className="text-purple-400" />
                        PRO BOWL SELECTIONS
                      </span>
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 border border-purple-400/20">
                        {milestonesData.proBowls >= 5 ? 'HOF LOCK' : 'IN VOTE'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {milestonesData.proBowls} <span className="text-xs text-slate-500 font-normal">VOTES</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Target Tier: {milestonesData.proBowlsTarget}x Pro Bowl
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-[#05070a] h-1.5 overflow-hidden border border-[#1a222e]">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                        style={{ width: `${milestonesData.proBowlsPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
                      <span>{Math.max(0, milestonesData.proBowlsTarget - milestonesData.proBowls)} to tier up</span>
                      <span>All-Star Elite</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Milestones & Records Timeline */}
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                <h4 className="text-xs font-bold text-amber-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Crown size={14} />
                    CAREER_MILESTONE_LOG_&_RECORD_BADGES
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {milestonesData.milestonesList.length} RECORD LANDMARKS
                  </span>
                </h4>

                <div className="space-y-3">
                  {milestonesData.milestonesList.map((ms, idx) => (
                    <div 
                      key={ms.id || idx}
                      className={`p-4 border flex items-start justify-between gap-4 transition-all ${
                        ms.isAchieved 
                          ? 'bg-[#05070a] border-amber-500/30 hover:border-amber-500/60' 
                          : 'bg-[#05070a]/60 border-dashed border-[#1a222e]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 shrink-0 border ${
                          ms.isAchieved 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}>
                          {ms.isAchieved ? <Trophy size={18} /> : <Lock size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{ms.title}</span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.2 border ${
                              ms.category === 'HONOR' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                              ms.category === 'RECORD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}>
                              {ms.category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">{ms.year}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 leading-relaxed">
                            {ms.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 border ${
                          ms.isAchieved 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {ms.isAchieved ? 'ACHIEVED' : 'IN PROGRESS'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROGRESSION LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
                <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                  <History size={14} />
                  CAREER_PROGRESSION_&_REGRESSION_TIMELINE
                </h4>

                {(player.progressionHistory || []).length === 0 ? (
                  <div className="text-center py-10 text-slate-600 font-mono text-xs">
                    NO PROGRESSION EVENTS LOGGED YET. ADVANCE WEEKS OR RUN DRILLS TO LOG ATTRIBUTE GAINS.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {player.progressionHistory?.map((entry) => (
                      <div key={entry.id} className="p-4 bg-[#05070a] border border-[#1a222e] flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${
                              entry.type === 'BREAKOUT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              entry.type === 'SKILL_POINT' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                              entry.type === 'AGE_REGRESSION' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {entry.type}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{entry.title}</span>
                            <span className="text-[9px] font-mono text-slate-500">{entry.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                            {entry.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          {entry.statChanges.map((stat, sIdx) => (
                            <div 
                              key={sIdx}
                              className={`text-[10px] font-mono font-bold ${
                                stat.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {stat}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerProgressionModal;
