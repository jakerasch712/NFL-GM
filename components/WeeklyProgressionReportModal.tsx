import React from 'react';
import { ProgressionWeekSummary, Player, Position } from '../types';
import { 
  Award, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Flame, 
  Zap,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

interface WeeklyProgressionReportModalProps {
  summary: ProgressionWeekSummary;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  allPlayers: Player[];
}

const WeeklyProgressionReportModal: React.FC<WeeklyProgressionReportModalProps> = ({
  summary,
  onClose,
  onSelectPlayer,
  allPlayers
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0a0e14] border border-cyan-500/30 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,209,255,0.15)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-[#05070a] border-b border-[#1a222e] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">
                WEEK {summary.week} PROGRESSION & DEVELOPMENT REPORT
              </h2>
              <p className="text-xs text-cyan-500 font-mono tracking-widest uppercase mt-0.5">
                SEASON {summary.season} // TACTICAL & MORALE ADVANCEMENT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 transition-all border border-[#1a222e]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#05070a]/50">
          {/* 1. LEVEL UPS & SKILL POINTS READY */}
          {summary.leveledUpPlayers.length > 0 && (
            <div className="bg-[#0a0e14] border border-cyan-500/30 p-5 shadow-[0_0_15px_rgba(0,209,255,0.08)]">
              <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                PLAYERS_LEVEL_UP :: SKILL POINTS AVAILABLE ({summary.leveledUpPlayers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summary.leveledUpPlayers.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-[#05070a] border border-cyan-500/20 hover:border-cyan-400 transition-all flex items-center justify-between cursor-pointer group"
                    onClick={() => {
                      const fullPlayer = allPlayers.find(p => p.id === item.player.id) || item.player;
                      onSelectPlayer(fullPlayer);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/40 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-mono text-slate-500">OVR</span>
                        <span className="text-sm font-bold font-mono text-white">{item.newOvr}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono uppercase group-hover:text-cyan-400">
                          {item.player.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">
                          {item.player.position} // +{item.skillPointsGained} Skill Point Ready
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 font-bold">
                      <span>SPEND SP</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. BREAKOUT EVENTS */}
          {summary.breakoutEvents.length > 0 && (
            <div className="bg-[#0a0e14] border border-amber-500/30 p-5 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
              <h3 className="text-xs font-bold text-amber-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                <Flame size={14} className="text-amber-400 animate-pulse" />
                BREAKOUT_DEVELOPMENT_TRIGGERS ({summary.breakoutEvents.length})
              </h3>
              <div className="space-y-2">
                {summary.breakoutEvents.map((b, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white font-mono uppercase">{b.playerName} ({b.position})</span>
                      <p className="text-[10px] text-amber-300 font-mono mt-0.5">{b.headline}</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-500 text-black uppercase">
                      {b.newDev} DEV
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. TRAINING DRILL HIGHLIGHTS */}
          {summary.trainingHighlights.length > 0 && (
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
              <h3 className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-4 flex items-center gap-2">
                <Zap size={14} />
                PRACTICE_DRILL_STANDOUTS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {summary.trainingHighlights.slice(0, 6).map((th, idx) => (
                  <div key={idx} className="p-2.5 bg-[#05070a] border border-[#1a222e] flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white font-mono uppercase">{th.playerName}</div>
                      <div className="text-[9px] font-mono text-slate-500">{th.position} // {th.focus}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20">
                      +{th.xpGained} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MORALE SHIFTS & VETERAN WEAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morale Shifts */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-3 flex items-center gap-2">
                <Heart size={14} className="text-cyan-400" />
                LOCKER_ROOM_MORALE_SHIFTS
              </h3>
              {summary.moraleShifts.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-600 py-3">Locker room morale remained steady this week.</div>
              ) : (
                <div className="space-y-2">
                  {summary.moraleShifts.slice(0, 4).map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-[#05070a] border border-[#1a222e] flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-white font-bold uppercase">{m.playerName}</span>
                        <span className="text-slate-500 text-[9px] ml-2">({m.position})</span>
                        <div className="text-[9px] text-slate-400">{m.reason}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        m.newMorale > m.oldMorale ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'
                      }`}>
                        {m.newMorale}% ({m.newMorale > m.oldMorale ? `+${m.newMorale - m.oldMorale}` : m.newMorale - m.oldMorale})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Veteran Age Wear */}
            <div className="bg-[#0a0e14] border border-[#1a222e] p-5">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase border-b border-[#1a222e] pb-3 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                VETERAN_AGE_WEAR_REPORTS
              </h3>
              {summary.regressedVeterans.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-600 py-3">No veteran age regression observed this week.</div>
              ) : (
                <div className="space-y-2">
                  {summary.regressedVeterans.map((v, idx) => (
                    <div key={idx} className="p-2.5 bg-[#05070a] border border-red-500/20 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-white font-bold uppercase">{v.playerName}</span>
                        <span className="text-slate-500 text-[9px] ml-2">Age {v.age} ({v.position})</span>
                      </div>
                      <span className="text-red-400 font-bold text-[10px]">
                        {v.attributeLosses.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#05070a] border-t border-[#1a222e] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,209,255,0.3)] transition-all"
          >
            CONFIRM & RETURN TO HQ
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WeeklyProgressionReportModal;
