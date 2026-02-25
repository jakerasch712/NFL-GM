import React, { useState } from 'react';
import { Player } from '@/types';
import { executePlayerRelease } from '@/utils/capUtils';
import { X, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface RestructureModalProps {
  player: Player;
  onConfirm: (voidYears: number) => void;
  onClose: () => void;
}

export const RestructureModal: React.FC<RestructureModalProps> = ({ player, onConfirm, onClose }) => {
  const [voidYears, setVoidYears] = useState(0);
  
  // NFL Rule: Proration cannot exceed 5 total years
  const maxVoidYears = Math.min(4, 5 - player.contract.yearsLeft);
  
  // Calculate potential savings: 
  // Converting Base Salary to Signing Bonus and spreading it over (Years + Void Years)
  const amountToRestructure = player.contract.salary - 1.21; // Leaving veteran minimum (1.21M)
  const prorationTerm = player.contract.yearsLeft + voidYears;
  const yearlyProration = amountToRestructure / prorationTerm;
  
  const capSavings2026 = amountToRestructure - yearlyProration;
  const futureDeadCap = yearlyProration * voidYears;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 w-full max-w-md border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            Restructure: {player.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
              Add Void Years (0 - {maxVoidYears})
            </label>
            <input 
              type="range" 
              min="0" 
              max={maxVoidYears} 
              value={voidYears} 
              onChange={(e) => setVoidYears(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] font-mono mt-2 text-slate-500 uppercase tracking-tighter">
              <span>Current Term ({player.contract.yearsLeft}y)</span>
              <span className="text-cyan-400">+ {voidYears} Void Years</span>
            </div>
          </div>

          <div className="bg-black/40 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="p-4 text-slate-400 uppercase">2026 Cap Savings</td>
                  <td className="p-4 text-emerald-400 font-bold">+$ {capSavings2026.toFixed(2)}M</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-400 uppercase">Future Dead Cap Bomb</td>
                  <td className="p-4 text-red-400 font-bold">-$ {futureDeadCap.toFixed(2)}M</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={() => onConfirm(voidYears)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
            >
              EXECUTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReleaseModalProps {
  player: Player;
  onConfirm: (impact: any) => void;
  onClose: () => void;
}

export const ReleasePlayerModal: React.FC<ReleaseModalProps> = ({ player, onConfirm, onClose }) => {
  const [usePostJune1, setUsePostJune1] = useState(false);
  const impact = executePlayerRelease(player, usePostJune1);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 w-full max-w-md border border-red-500/30 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-red-950/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Release: {player.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={usePostJune1}
                onChange={(e) => setUsePostJune1(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500"
              />
              <span className="text-slate-200 font-medium group-hover:text-white transition-colors">Designate as Post-June 1 Cut</span>
            </label>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed uppercase tracking-wider">
              *Limits: 2 per season. Spreads dead money across 2026/2027.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">2026 Savings</div>
              <div className="text-emerald-400 text-xl font-mono font-bold">+${impact.net2026Savings.toFixed(2)}M</div>
            </div>
            <div className="p-4 bg-black/40 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">2026 Dead Cap</div>
              <div className="text-red-400 text-xl font-mono font-bold">-${impact.immediateDeadCap.toFixed(2)}M</div>
            </div>
          </div>

          {usePostJune1 && (
            <div className="flex items-start gap-2 text-amber-500 text-[10px] font-mono bg-amber-500/5 p-3 rounded border border-amber-500/20 italic uppercase">
              <Info size={12} className="shrink-0 mt-0.5" />
              <span>NOTE: ${impact.deferredDeadCap.toFixed(2)}M will be added to your 2027 Cap.</span>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={() => onConfirm(impact)}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 transition-all active:scale-95"
            >
              CONFIRM RELEASE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
