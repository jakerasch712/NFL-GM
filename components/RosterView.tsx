import React, { useState } from 'react';
import { Shield, TrendingUp, Battery, AlertCircle, Briefcase, Search, Filter, UserMinus, DollarSign } from 'lucide-react';
import ContractNegotiation from './ContractNegotiation';
import { RestructureModal, ReleasePlayerModal } from './CapModals';
import { Player } from '../types';

interface RosterViewProps {
  players: Player[];
  capSpace: number;
  deadCap: number;
  onSignContract: (playerId: string, newContract: any) => void;
  onCutPlayer: (playerId: string, impact: any) => void;
  onRestructure: (playerId: string, voidYears: number) => void;
}

const RosterView: React.FC<RosterViewProps> = ({
  players,
  capSpace,
  deadCap,
  onSignContract,
  onCutPlayer,
  onRestructure,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [negotiatingPlayerId, setNegotiatingPlayerId] = useState<string | null>(null);
  const [restructuringPlayerId, setRestructuringPlayerId] = useState<string | null>(null);
  const [releasingPlayerId, setReleasingPlayerId] = useState<string | null>(null);

  const activeNegotiationPlayer = players.find(p => p.id === negotiatingPlayerId);
  const activeRestructurePlayer = players.find(p => p.id === restructuringPlayerId);
  const activeReleasePlayer = players.find(p => p.id === releasingPlayerId);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.archetype.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCutConfirm = (impact: any) => {
    if (!activeReleasePlayer) return;
    onCutPlayer(activeReleasePlayer.id, impact);
    setReleasingPlayerId(null);
  };

  const handleRestructureConfirm = (voidYears: number) => {
    if (!activeRestructurePlayer) return;
    onRestructure(activeRestructurePlayer.id, voidYears);
    setRestructuringPlayerId(null);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tight">ACTIVE ROSTER</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium">
            Houston Texans • {players.length} / 53
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[160px] backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Cap Space</div>
            <div className={`text-2xl font-mono font-bold ${capSpace < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
              ${capSpace.toFixed(1)}M
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl min-w-[160px] backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Dead Cap</div>
            <div className="text-2xl font-mono font-bold text-red-400">${deadCap.toFixed(1)}M</div>
          </div>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Scheme Fit</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Expiring</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
                <th className="p-4 font-normal">Player</th>
                <th className="p-4 font-normal">Pos</th>
                <th className="p-4 font-normal">OVR</th>
                <th className="p-4 font-normal">Scheme OVR</th>
                <th className="p-4 font-normal">Cap Hit</th>
                <th className="p-4 font-normal">Dead Cap</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPlayers.map(player => (
                <tr
                  key={player.id}
                  className={`hover:bg-slate-800/30 transition-colors group ${player.contract.yearsLeft === 0 ? 'border-l-2 border-amber-500/40' : ''}`}
                >
                  <td className="p-4">
                    <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter mt-0.5">
                      {player.archetype} • {player.age}y • {player.developmentTrait}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-300">{player.position}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-lg font-mono font-bold text-white">{player.overall}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-mono font-bold ${player.schemeOvr >= player.overall ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {player.schemeOvr}
                      </div>
                      {player.schemeOvr > player.overall && <TrendingUp size={12} className="text-cyan-400" />}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-300">${player.contract.capHit.toFixed(1)}M</td>
                  <td className="p-4 font-mono text-sm text-red-400/70">${player.contract.deadCap.toFixed(1)}M</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {player.contract.yearsLeft === 0 && (
                        <button
                          onClick={() => setNegotiatingPlayerId(player.id)}
                          className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                          title="Extend Contract"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setRestructuringPlayerId(player.id)}
                        className="p-2 hover:bg-cyan-500/10 text-cyan-500 rounded-lg transition-colors"
                        title="Restructure"
                      >
                        <TrendingUp size={16} />
                      </button>
                      <button
                        onClick={() => setReleasingPlayerId(player.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Release"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPlayers.length === 0 && (
            <div className="text-center py-16 text-slate-600 text-sm italic">
              No players match "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {activeNegotiationPlayer && (
        <ContractNegotiation
          player={activeNegotiationPlayer}
          onSign={onSignContract}
          onClose={() => setNegotiatingPlayerId(null)}
          capSpace={capSpace}
        />
      )}

      {activeRestructurePlayer && (
        <RestructureModal
          player={activeRestructurePlayer}
          onConfirm={handleRestructureConfirm}
          onClose={() => setRestructuringPlayerId(null)}
        />
      )}

      {activeReleasePlayer && (
        <ReleasePlayerModal
          player={activeReleasePlayer}
          onConfirm={handleCutConfirm}
          onClose={() => setReleasingPlayerId(null)}
        />
      )}
    </div>
  );
};

export default RosterView;
