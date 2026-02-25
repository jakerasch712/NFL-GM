import React, { useState } from 'react';
import { MOCK_PLAYERS } from '../constants';
import { Search, Filter, DollarSign, TrendingUp, UserPlus, Info } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { Player } from '../types';

const FreeAgency: React.FC = () => {
  const [players, setPlayers] = useState(MOCK_PLAYERS.filter(p => p.teamId === 'FA'));
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [capSpace, setCapSpace] = useState(14.2);
  const [searchTerm, setSearchTerm] = useState('');

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);

  const handleSignContract = (playerId: string, newContract: any) => {
    // In a real app, we'd move the player to the team
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setCapSpace(prev => parseFloat((prev - (newContract.totalValue / newContract.years)).toFixed(2)));
    setNegotiatingPlayerId(null);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font tracking-tight">FREE AGENT TRACKER</h2>
          <p className="text-slate-400 text-sm font-mono flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-500" /> 
            Available Cap: <span className="text-emerald-400 font-bold">${capSpace}M</span>
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-64"
            />
          </div>
          <button className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Market List */}
        <div className="col-span-12 lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-950/50">
                  <th className="p-4 font-semibold">Player</th>
                  <th className="p-4 font-semibold">Pos</th>
                  <th className="p-4 font-semibold text-center">OVR</th>
                  <th className="p-4 font-semibold">Market Value</th>
                  <th className="p-4 font-semibold">Interest</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{player.age} yrs • {player.archetype}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-bold">{player.position}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-bold font-mono ${player.overall >= 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {player.overall}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white font-mono">${player.contractDemand?.marketValue}M / yr</div>
                      <div className="text-xs text-slate-500">Expected: {player.contractDemand?.years} yrs</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full w-[65%]"></div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">65%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setNegotiatingPlayerId(player.id)}
                        className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-lg shadow-cyan-900/20"
                      >
                        <UserPlus size={14} /> Make Offer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Insights */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-500" />
              Market Trends
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">QB Market</div>
                <div className="text-white font-bold">Inflated (+12%)</div>
                <div className="text-[10px] text-slate-500 mt-1">High demand for veteran backups.</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">WR Market</div>
                <div className="text-emerald-400 font-bold">Buyer's Market (-5%)</div>
                <div className="text-[10px] text-slate-500 mt-1">Deep draft class suppressing values.</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={16} className="text-amber-500" />
              GM Strategy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target players with high <span className="text-white">Loyalty</span> interest for better value. Avoid bidding wars on <span className="text-white">Money</span>-motivated stars unless you have surplus cap.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Roster Spots</span>
                <span className="text-white">51 / 53</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full">
                <div className="bg-cyan-500 h-full w-[96%]"></div>
              </div>
            </div>
          </div>
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

export default FreeAgency;
