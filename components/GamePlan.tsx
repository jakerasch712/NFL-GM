import React, { useState } from 'react';
import { Shield, Target, AlertCircle, Activity, Clipboard, CheckCircle } from 'lucide-react';
import { TEAMS_DB } from '../constants';
import { Player, ScheduleGame, GamePlanSettings } from '../types';

interface GamePlanProps {
  players: Player[];
  week: number;
  schedule: ScheduleGame[];
  gamePlan: GamePlanSettings;
  onFinalizeGamePlan: (settings: GamePlanSettings) => void;
}

const GamePlan: React.FC<GamePlanProps> = ({ players, week, schedule, gamePlan, onFinalizeGamePlan }) => {
  const [focus, setFocus] = useState<GamePlanSettings['focus']>(gamePlan.focus);
  const [intensity, setIntensity] = useState(gamePlan.intensity);
  const [finalized, setFinalized] = useState(false);

  const nextGame = schedule.find(g => g.week === week && !g.result);
  const opponent = nextGame ? TEAMS_DB[nextGame.opponentId] : null;

  const fatigueWarning = Math.round(intensity * 0.12);

  const handleFinalize = () => {
    onFinalizeGamePlan({ focus, intensity });
    setFinalized(true);
    setTimeout(() => setFinalized(false), 3000);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8">
        <h2 className="text-4xl font-bold text-white header-font tracking-tight">GAME WEEK PREP</h2>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">
          Week {week} vs {opponent ? `${opponent.city} ${opponent.name}` : 'TBD'}
        </p>
      </header>

      {finalized && (
        <div className="mb-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-emerald-300 font-bold text-sm">
            Game plan locked in! Focus: {focus}, Intensity: {intensity}%. These settings will affect your MatchSim.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Left: Game Planning */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clipboard size={24} className="text-cyan-400" />
              Weekly Strategy
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {(['OFFENSE', 'DEFENSE', 'BALANCED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`p-4 rounded-xl border transition-all ${
                    focus === f
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-900/20'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{f}</div>
                  <div className="text-xs font-medium">
                    {f === 'OFFENSE' ? '+10% play success' : f === 'DEFENSE' ? '-10% opp scoring' : 'Balanced approach'}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Practice Intensity</label>
                  <span className={`text-sm font-mono font-bold ${intensity > 75 ? 'text-red-400' : 'text-cyan-400'}`}>{intensity}%</span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 uppercase font-bold">
                  <span>Walkthrough</span>
                  <span>Full Pads</span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertCircle size={20} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wide">Injury Risk Warning</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    High intensity practice increases <span className="text-red-400">Fatigue</span> and <span className="text-red-400">Injury Risk</span>.
                    Current settings: <span className="text-amber-500 font-bold">+{fatigueWarning}% Fatigue</span> this week.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {opponent && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target size={24} className="text-purple-400" />
                Opponent Tendencies — {opponent.city} {opponent.name}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Offense</div>
                  <div className="text-sm text-white font-bold">{opponent.stats.off} RTG</div>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Defense</div>
                  <div className="text-sm text-white font-bold">{opponent.stats.def} RTG</div>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Special Teams</div>
                  <div className="text-sm text-white font-bold">{opponent.stats.st} RTG</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Roster Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={24} className="text-emerald-400" />
              Roster Health
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {players.map(player => (
              <div key={player.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white text-sm">{player.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{player.position}</div>
                  </div>
                  <div className={`text-xs font-mono font-bold ${player.fatigue < 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {player.fatigue}%
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${player.fatigue < 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${player.fatigue}%` }}
                  ></div>
                </div>
                {player.fatigue < 90 && (
                  <div className="mt-2">
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] font-bold uppercase">Wear &amp; Tear</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-800/20 border-t border-slate-800">
            <button
              onClick={handleFinalize}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all"
            >
              {finalized ? '✓ Plan Locked In' : 'Finalize Game Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlan;
