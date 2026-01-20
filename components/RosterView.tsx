import React, { useState } from 'react';
import { MOCK_PLAYERS } from '../constants';
import { Shield, TrendingUp, Battery, AlertCircle, Briefcase } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { Player } from '../types';

const RosterView: React.FC = () => {
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [capSpace, setCapSpace] = useState(14.2);

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);

  const handleSignContract = (playerId: string, newContract: any) => {
    setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                contract: newContract,
                contractDemand: undefined // Remove demand as they are signed
            };
        }
        return p;
    }));
    
    // Simple cap update logic for demo
    setCapSpace(prev => parseFloat((prev - (newContract.totalValue / newContract.years)).toFixed(2)));
    setNegotiatingPlayerId(null);
  };

  return (
    <div className="p-8 h-full flex flex-col relative">
       <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font">ACTIVE ROSTER</h2>
          <p className="text-slate-400 text-sm font-mono">53/53 Active • <span className={capSpace < 5 ? 'text-red-400' : 'text-emerald-400'}>${capSpace}M Cap Space</span></p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded text-sm font-medium transition-colors">Depth Chart</button>
            <button className="px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-500 rounded text-sm font-medium transition-colors shadow-lg shadow-cyan-900/20">Manage Salaries</button>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                        <th className="p-4 font-semibold">Player</th>
                        <th className="p-4 font-semibold">Pos</th>
                        <th className="p-4 font-semibold text-center">OVR</th>
                        <th className="p-4 font-semibold">Contract</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold w-32">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {players.map(player => (
                        <tr key={player.id} className="hover:bg-slate-800/50 transition-colors group">
                            <td className="p-4">
                                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <span>{player.age} yrs</span>
                                    {player.developmentTrait === 'X-Factor' && <Shield size={10} className="text-red-500" />}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-bold">{player.position}</span>
                            </td>
                            <td className="p-4 text-center">
                                <span className={`text-lg font-bold font-mono ${player.overall >= 90 ? 'text-amber-400' : player.overall >= 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {player.overall}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="text-sm text-slate-300 font-mono">${player.contract.salary.toFixed(1)}M / yr</div>
                                <div className="text-xs text-slate-500">{player.contract.yearsLeft} years left</div>
                            </td>
                            <td className="p-4">
                                {player.contract.yearsLeft === 0 ? (
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                        <AlertCircle size={12} /> Expiring
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Active</span>
                                )}
                            </td>
                            <td className="p-4">
                                {player.contractDemand ? (
                                    <button 
                                        onClick={() => setNegotiatingPlayerId(player.id)}
                                        className="flex items-center gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 px-3 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider"
                                    >
                                        <Briefcase size={12} /> Negotiate
                                    </button>
                                ) : (
                                    <span className="text-slate-600 text-xs">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {activeNegotiationPlayer && (
        <ContractNegotiation 
            player={activeNegotiationPlayer} 
            onClose={() => setNegotiatingPlayerId(null)}
            onSign={handleSignContract}
            capSpace={capSpace}
        />
      )}
    </div>
  );
};

export default RosterView;