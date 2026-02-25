import React, { useState } from 'react';
import { MOCK_PLAYERS, INITIAL_PICKS, TEAMS_DB } from '../constants';
import { ArrowLeftRight, Plus, Trash2, TrendingUp, Shield, Info, AlertTriangle } from 'lucide-react';
import { Player, DraftPick } from '../types';

const TradeCenter: React.FC = () => {
  const [myAssets, setMyAssets] = useState<(Player | DraftPick)[]>([]);
  const [theirAssets, setTheirAssets] = useState<(Player | DraftPick)[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('KC');

  const teams = Object.values(TEAMS_DB).map(t => ({
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
    // For demo, just add a random asset
    if (side === 'mine') {
      const available = MOCK_PLAYERS.filter(p => p.teamId === 'HOU' && !myAssets.find(a => a.id === p.id));
      if (available.length > 0) setMyAssets([...myAssets, available[0]]);
    } else {
      const available = MOCK_PLAYERS.filter(p => p.teamId !== 'HOU' && p.teamId !== 'FA' && !theirAssets.find(a => a.id === p.id));
      if (available.length > 0) setTheirAssets([...theirAssets, available[0]]);
    }
  };

  const removeAsset = (side: 'mine' | 'theirs', id: string) => {
    if (side === 'mine') setMyAssets(myAssets.filter(a => a.id !== id));
    else setTheirAssets(theirAssets.filter(a => a.id !== id));
  };

  return (
    <div className="p-8 h-full flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font tracking-tight">TRADE ANALYZER</h2>
          <p className="text-slate-400 text-sm font-mono flex items-center gap-2">
            <TrendingUp size={14} className="text-cyan-500" /> 
            Rich Hill Model • 2026 Valuation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 uppercase font-bold">Trading With:</span>
          <select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* My Side */}
        <div className="col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Houston Texans</h3>
            <span className="text-cyan-400 font-mono font-bold">{myValue.toFixed(0)} pts</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 p-4 overflow-y-auto space-y-3">
            {myAssets.map(asset => (
              <div key={asset.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center font-bold text-slate-500">
                    {'position' in asset ? asset.position : `R${asset.round}`}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{asset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {'overall' in asset ? `${asset.overall} OVR • ${asset.age} yrs` : `Pick #${asset.pickNumber}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeAsset('mine', asset.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => addAsset('mine')}
              className="w-full py-4 border-2 border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Add Asset</span>
            </button>
          </div>
        </div>

        {/* Center: Analysis */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-cyan-500 shadow-lg">
            <ArrowLeftRight size={32} />
          </div>
          
          <div className="text-center">
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${fairness === 'FAIR' ? 'text-emerald-500' : fairness === 'OVERPAY' ? 'text-amber-500' : 'text-red-500'}`}>
              {fairness}
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
            </div>
          </div>

          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest shadow-lg shadow-cyan-900/20 transition-all">
            Propose
          </button>
        </div>

        {/* Their Side */}
        <div className="col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">{teams.find(t => t.id === selectedTeam)?.name}</h3>
            <span className="text-amber-400 font-mono font-bold">{theirValue.toFixed(0)} pts</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 p-4 overflow-y-auto space-y-3">
            {theirAssets.map(asset => (
              <div key={asset.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center font-bold text-slate-500">
                    {'position' in asset ? asset.position : `R${asset.round}`}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{asset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {'overall' in asset ? `${asset.overall} OVR • ${asset.age} yrs` : `Pick #${asset.pickNumber}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeAsset('theirs', asset.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => addAsset('theirs')}
              className="w-full py-4 border-2 border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Add Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trade Logic Insights */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-cyan-500/10 rounded text-cyan-500"><Shield size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Team Needs Match</h4>
            <p className="text-xs text-slate-500">Trading a WR to the Chiefs increases their interest by 15%.</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-amber-500/10 rounded text-amber-500"><AlertTriangle size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Dead Cap Warning</h4>
            <p className="text-xs text-slate-500">Trading L. Tunsil would result in $10M dead cap hit.</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-emerald-500/10 rounded text-emerald-500"><Info size={20} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Value Logic</h4>
            <p className="text-xs text-slate-500">Rich Hill model favors higher picks over multiple late ones.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCenter;
