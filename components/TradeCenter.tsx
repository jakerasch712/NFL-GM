import React, { useState } from 'react';
import { MOCK_PLAYERS, INITIAL_PICKS, TEAMS_DB } from '../constants';
import { ArrowLeftRight, Plus, Trash2, TrendingUp, Shield, Info, AlertTriangle } from 'lucide-react';
import { Player, DraftPick } from '../types';

interface TradeCenterProps {
  selectedTeamId: string;
  allPlayers: Player[];
  teams: Record<string, any>;
}

const TradeCenter: React.FC<TradeCenterProps> = ({ selectedTeamId, allPlayers, teams }) => {
  const [myAssets, setMyAssets] = useState<(Player | DraftPick)[]>([]);
  const [theirAssets, setTheirAssets] = useState<(Player | DraftPick)[]>([]);
  const [targetTeamId, setTargetTeamId] = useState(selectedTeamId === 'FA' ? 'BAL' : Object.keys(teams).find(id => id !== selectedTeamId) || 'BAL');

  const myTeam = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];
  const otherTeams = Object.values(teams).filter(t => t.id !== selectedTeamId).map(t => ({
    id: t.id,
    name: t.name,
    needs: ['WR', 'CB'] // Mocked needs for now
  }));

  const calculateValue = (assets: (Player | DraftPick)[]) => {
    return assets.reduce((acc, asset) => {
      if ('overall' in asset) {
        // Player value based on OVR and age
        const ageFactor = Math.max(0.5, (35 - asset.age) / 10);
        return acc + (asset.overall * asset.overall * ageFactor) / 10;
      } else {
        // Draft pick value (Rich Hill)
        return acc + asset.value;
      }
    }, 0);
  };

  const myValue = calculateValue(myAssets);
  const theirValue = calculateValue(theirAssets);
  const diff = myValue - theirValue;
  const fairness = Math.abs(diff) < (Math.max(myValue, theirValue) * 0.15) ? 'FAIR' : diff > 0 ? 'OVERPAY' : 'UNDERPAY';

  const addAsset = (side: 'mine' | 'theirs') => {
    if (side === 'mine') {
      const available = allPlayers.filter(p => p.teamId === selectedTeamId && !myAssets.find(a => a.id === p.id));
      if (available.length > 0) setMyAssets([...myAssets, available[0]]);
    } else {
      const available = allPlayers.filter(p => p.teamId === targetTeamId && !theirAssets.find(a => a.id === p.id));
      if (available.length > 0) setTheirAssets([...theirAssets, available[0]]);
    }
  };

  const removeAsset = (side: 'mine' | 'theirs', id: string) => {
    if (side === 'mine') setMyAssets(myAssets.filter(a => a.id !== id));
    else setTheirAssets(theirAssets.filter(a => a.id !== id));
  };

  return (
    <div className="p-8 h-full flex flex-col bg-[#05070a]">
      <header className="mb-10 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">ASSET_EXCHANGE_TERMINAL</h2>
          <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
            <TrendingUp size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
            VALUATION_ENGINE::RICH_HILL_MODEL // EST_2026_MATRIX
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] mono-font italic">COUNTER_PARTY_INITIALIZATION:</span>
          <select 
            value={targetTeamId}
            onChange={(e) => setTargetTeamId(e.target.value)}
            className="bg-[#0a0e14] border border-[#1a222e] text-cyan-500 px-6 py-2 text-[10px] mono-font font-bold focus:outline-none focus:border-cyan-500/50 transition-all uppercase tracking-widest cursor-pointer"
          >
            {otherTeams.map(t => <option key={t.id} value={t.id} className="bg-[#0a0e14]">{t.name}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-1 flex-1 min-h-0">
        {/* My Side */}
        <div className="col-span-5 flex flex-col gap-1">
          <div className="flex justify-between items-center bg-[#0d121a]/50 p-4 border border-[#1a222e]">
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mono-font italic">{myTeam.city} {myTeam.name} // SOURCE</h3>
            <span className="text-cyan-400 font-mono font-bold text-xl tracking-widest">{myValue.toFixed(0)} <span className="text-[9px] ml-1 opacity-50">PTS</span></span>
          </div>
          <div className="bg-[#0a0e14] border border-[#1a222e] flex-1 p-4 overflow-y-auto space-y-1 shadow-inner">
            {myAssets.map(asset => (
              <div key={asset.id} className="bg-[#05070a] border border-[#1a222e] p-4 flex justify-between items-center group hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0d121a] border border-[#1a222e] flex items-center justify-center font-bold text-slate-500 mono-font text-[10px]">
                    {'position' in asset ? asset.position : `R${asset.round}`}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-tight italic header-font">
                      {'name' in asset ? asset.name : `Round ${asset.round} Pick ${asset.pickNumber}`}
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-0.5">
                      {'overall' in asset ? `${asset.overall} OVR // ${asset.age}_CY` : `NODE_ID::#${asset.pickNumber}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeAsset('mine', asset.id)} className="text-slate-700 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => addAsset('mine')}
              className="w-full py-8 border border-dashed border-[#1a222e] text-slate-600 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex flex-col items-center justify-center gap-3 bg-[#0d121a]/20 group"
            >
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] mono-font">ADD_ASSET_NODE</span>
            </button>
          </div>
        </div>

        {/* Center: Analysis */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-8 px-4 bg-[#0d121a]/20 border-x border-[#1a222e] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          
          <div className="w-20 h-20 bg-[#0a0e14] border border-[#1a222e] rounded-none flex items-center justify-center text-cyan-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] rotate-45 group">
            <ArrowLeftRight size={32} className="-rotate-45 group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="text-center relative">
            <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 mono-font italic ${fairness === 'FAIR' ? 'text-emerald-500 animate-pulse' : fairness === 'OVERPAY' ? 'text-amber-500' : 'text-red-500'}`}>
              {fairness} // DELTA
            </div>
            <div className="text-4xl font-bold text-white font-mono tracking-tighter">
              {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
            </div>
            <div className="mt-2 w-12 h-0.5 bg-cyan-500/20 mx-auto"></div>
          </div>

          <button className="w-full bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-500 hover:border-cyan-400 font-bold py-4 text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl mono-font italic">
            PROPOSE_EXCHANGE
          </button>
        </div>

        {/* Their Side */}
        <div className="col-span-5 flex flex-col gap-1">
          <div className="flex justify-between items-center bg-[#0d121a]/50 p-4 border border-[#1a222e]">
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mono-font italic">{(teams[targetTeamId] || TEAMS_DB[targetTeamId])?.name} // TARGET</h3>
            <span className="text-amber-400 font-mono font-bold text-xl tracking-widest">{theirValue.toFixed(0)} <span className="text-[9px] ml-1 opacity-50">PTS</span></span>
          </div>
          <div className="bg-[#0a0e14] border border-[#1a222e] flex-1 p-4 overflow-y-auto space-y-1 shadow-inner">
            {theirAssets.map(asset => (
              <div key={asset.id} className="bg-[#05070a] border border-[#1a222e] p-4 flex justify-between items-center group hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0d121a] border border-[#1a222e] flex items-center justify-center font-bold text-slate-500 mono-font text-[10px]">
                    {'position' in asset ? asset.position : `R${asset.round}`}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-tight italic header-font">
                      {'name' in asset ? asset.name : `Round ${asset.round} Pick ${asset.pickNumber}`}
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mt-0.5">
                      {'overall' in asset ? `${asset.overall} OVR // ${asset.age}_CY` : `NODE_ID::#${asset.pickNumber}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeAsset('theirs', asset.id)} className="text-slate-700 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => addAsset('theirs')}
              className="w-full py-8 border border-dashed border-[#1a222e] text-slate-600 hover:text-amber-400 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-3 bg-[#0d121a]/20 group"
            >
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] mono-font">ADD_TARGET_ASSET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trade Logic Insights */}
      <div className="mt-1 flex gap-1 h-32">
        <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
          <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 text-cyan-500 group-hover:scale-110 transition-transform"><Shield size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">SYNERGY_OVERLAP_MATCH</h4>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Transmitting WR node to current counter-party increases conversion probability by 15%.</p>
          </div>
        </div>
        <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
          <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-500 group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">CAP_LIABILITY_WARNING</h4>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Exchange of L. Tunsil node results in $10M dead cap impact on primary registry.</p>
          </div>
        </div>
        <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform"><Info size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">ALGORITHM_FEEDBACK</h4>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Current valuation model prioritizes high-tier single nodes over distributed low-tier nodes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCenter;
