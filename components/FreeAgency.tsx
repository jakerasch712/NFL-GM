import React, { useState } from 'react';
import { MOCK_PLAYERS } from '../constants';
import { Search, Filter, DollarSign, TrendingUp, UserPlus, Info } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { Player } from '../types';

interface FreeAgencyProps {
  selectedTeamId: string;
  allPlayers: Player[];
  setAllPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

const FreeAgency: React.FC<FreeAgencyProps> = ({ selectedTeamId, allPlayers, setAllPlayers }) => {
  const players = allPlayers.filter(p => !p.teamId || p.teamId === 'FA');
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [capSpace, setCapSpace] = useState(14.2);
  const [searchTerm, setSearchTerm] = useState('');

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);

  const handleUpdateMorale = (playerId: string, moraleChange: number) => {
    setAllPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, morale: Math.min(100, Math.max(0, p.morale + moraleChange)) };
      }
      return p;
    }));
  };

  const handleSignContract = (playerId: string, newContract: any) => {
    // Sign player to our team
    setAllPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
            return {
                ...p,
                teamId: selectedTeamId,
                contract: { ...p.contract, ...newContract }
            };
        }
        return p;
    }));
    setCapSpace(prev => parseFloat((prev - (newContract.totalValue / newContract.years)).toFixed(2)));
    setNegotiatingPlayerId(null);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col bg-[#05070a]">
      <header className="mb-10 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">FA_MARKET_MONITOR</h2>
          <p className="text-emerald-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
            <DollarSign size={14} className="inline mr-2 text-emerald-500 animate-pulse" />
            NODE_LIQUIDITY::AVAILABLE_CREDITS // ${capSpace}M
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH_MARKET_ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#05070a] border border-[#1a222e] text-cyan-500 pl-10 pr-4 py-2 text-[10px] mono-font focus:outline-none focus:border-cyan-500/50 transition-all w-80 placeholder:text-slate-700 tracking-widest"
            />
          </div>
          <button className="p-2.5 bg-[#0a0e14] border border-[#1a222e] text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-1 flex-1 min-h-0">
        {/* Market List */}
        <div className="col-span-12 lg:col-span-9 bg-[#0a0e14] border border-[#1a222e] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0d121a] z-10 border-b border-[#1a222e]">
                <tr className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mono-font italic">
                  <th className="px-6 py-5 font-bold">NODE_ID</th>
                  <th className="px-4 py-5 font-bold text-center">POS</th>
                  <th className="px-4 py-5 font-bold text-center">OVR</th>
                  <th className="px-4 py-5 font-bold">VALUATION_MODEL</th>
                  <th className="px-4 py-5 font-bold">SYNERGY_PROB</th>
                  <th className="px-6 py-5 font-bold text-right">PROTOCOLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a222e]/30">
                {filteredPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-cyan-500/5 transition-all duration-300 group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight italic header-font">{player.name}</div>
                      <div className="text-[9px] text-slate-600 font-mono tracking-widest mt-1">{player.age}_CYCLES // {player.archetype}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-[#05070a] border border-[#1a222e] text-slate-500 px-2 py-1 text-[9px] font-bold tracking-widest transition-colors group-hover:text-cyan-400">{player.position}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xl font-bold font-mono tracking-widest ${player.overall >= 90 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {player.overall}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-white font-mono tracking-tighter">${player.contractDemand?.marketValue}M / CY</div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">TERM_EXP:: {player.contractDemand?.years}_CY</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-[2px] bg-[#1a222e] relative overflow-hidden">
                          <div className="bg-cyan-500 h-full w-[65%] shadow-[0_0_8px_rgba(0,209,255,0.5)]"></div>
                        </div>
                        <span className="text-[10px] text-cyan-500/80 font-mono tracking-widest">65%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setNegotiatingPlayerId(player.id)}
                        className="inline-flex items-center gap-2 bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-500 hover:border-cyan-400 px-6 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg"
                      >
                        <UserPlus size={14} /> INITIALIZE_OFFER
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Insights */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-1">
          <div className="bg-[#0a0e14] border border-[#1a222e] p-8">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 mono-font italic">
              <TrendingUp size={16} className="text-cyan-500 animate-pulse" />
              MARKET_VECTOR_ANALYSIS
            </h3>
            <div className="space-y-1">
              <div className="p-5 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 font-bold italic">QB_MARKET_INDEX</div>
                <div className="text-white font-bold text-xs tracking-widest">INFLATED // <span className="text-red-500">+12%</span></div>
                <div className="text-[9px] text-slate-600 mt-2 font-mono uppercase tracking-tighter opacity-70 leading-relaxed italic">High demand for veteran backups identified in current data stream.</div>
              </div>
              <div className="p-5 bg-[#05070a] border border-[#1a222e] group hover:border-cyan-500/30 transition-colors">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 font-bold italic">WR_MARKET_INDEX</div>
                <div className="text-emerald-400 font-bold text-xs tracking-widest text-emerald-500">BUY_VECTOR // <span className="text-emerald-500">-5%</span></div>
                <div className="text-[9px] text-slate-600 mt-2 font-mono uppercase tracking-tighter opacity-70 leading-relaxed italic">Deep draft class entries suppressing legacy asset valuations.</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0e14] border border-[#1a222e] p-8 flex-1">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2 mono-font italic">
              <Info size={16} className="text-amber-500 animate-pulse" />
              SESSION_STRATEGY
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-mono uppercase tracking-widest italic leading-loose">
              Prioritize entities with high <span className="text-white px-1 bg-white/5 border-b border-white/20">LOYALTY</span> vectors for optimized sustainability. Avoid bidding on <span className="text-white px-1 bg-white/5 border-b border-white/20">MONEY</span> driven nodes without liquid surplus.
            </p>
            <div className="mt-8 pt-8 border-t border-[#1a222e]">
              <div className="flex justify-between text-[10px] mono-font mb-3 tracking-widest uppercase items-center">
                <span className="text-slate-600">ROSTER_SLOT_TOTAL</span>
                <span className="text-white font-bold">51 / 53</span>
              </div>
              <div className="w-full bg-[#05070a] h-1 border border-[#1a222e]">
                <div className="bg-cyan-500 h-full w-[96%] shadow-[0_0_10px_rgba(0,209,255,0.5)]"></div>
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
          onUpdateMorale={handleUpdateMorale}
          capSpace={capSpace}
        />
      )}
    </div>
  );
};

export default FreeAgency;
