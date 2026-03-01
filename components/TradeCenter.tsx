import React, { useState } from 'react';
import { TEAMS_DB } from '../constants';
import { ArrowLeftRight, Plus, Trash2, TrendingUp, Shield, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Player, DraftPick } from '../types';

interface TradeCenterProps {
  players: Player[];
  draftPicks: DraftPick[];
  onExecuteTrade: (myAssets: (Player | DraftPick)[], theirAssets: (Player | DraftPick)[], theirTeamId: string) => void;
}

type Asset = Player | DraftPick;
const isPlayer = (a: Asset): a is Player => 'overall' in a;

const TradeCenter: React.FC<TradeCenterProps> = ({ players, draftPicks, onExecuteTrade }) => {
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [theirAssets, setTheirAssets] = useState<Asset[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('KC');
  const [tradeComplete, setTradeComplete] = useState(false);

  const teams = Object.values(TEAMS_DB)
    .filter((t: any) => t.id !== 'HOU')
    .map((t: any) => ({ id: t.id, label: `${t.city} ${t.name}` }));

  const myPlayers = players.filter(p => p.teamId === 'HOU');
  const myPicks = draftPicks.filter(p => p.currentTeamId === 'HOU');
  const theirPlayers = players.filter(p => p.teamId === selectedTeam);
  const theirPicksAll = draftPicks.filter(p => p.currentTeamId === selectedTeam);

  const calcValue = (assets: Asset[]) =>
    assets.reduce((acc, a) => {
      if (isPlayer(a)) {
        const ageFactor = Math.max(0.5, (35 - a.age) / 10);
        return acc + (a.overall * a.overall * ageFactor) / 10;
      }
      return acc + a.value;
    }, 0);

  const myValue = calcValue(myAssets);
  const theirValue = calcValue(theirAssets);
  const diff = myValue - theirValue;
  const fairness =
    Math.abs(diff) < Math.max(myValue, theirValue) * 0.15 ? 'FAIR'
    : diff > 0 ? 'OVERPAY' : 'UNDERPAY';
  const fairnessColor =
    fairness === 'FAIR' ? 'text-emerald-500' :
    fairness === 'OVERPAY' ? 'text-amber-500' : 'text-cyan-400';

  const addMine = (a: Asset) => { if (!myAssets.find(x => x.id === a.id)) setMyAssets(p => [...p, a]); };
  const addTheirs = (a: Asset) => { if (!theirAssets.find(x => x.id === a.id)) setTheirAssets(p => [...p, a]); };
  const removeMine = (id: string) => setMyAssets(p => p.filter(a => a.id !== id));
  const removeTheirs = (id: string) => setTheirAssets(p => p.filter(a => a.id !== id));

  const handleExecute = () => {
    if (myAssets.length === 0 && theirAssets.length === 0) return;
    onExecuteTrade(myAssets, theirAssets, selectedTeam);
    setTradeComplete(true);
    setMyAssets([]);
    setTheirAssets([]);
  };

  const assetCard = (a: Asset, onRemove: () => void) => (
    <div key={a.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center font-bold text-slate-400 text-xs">
          {isPlayer(a) ? a.position : `R${a.round}`}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{isPlayer(a) ? a.name : `${a.year} Rd ${a.round}`}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {isPlayer(a) ? `${a.overall} OVR • ${a.age}y` : `Pick #${a.pickNumber}`}
          </div>
        </div>
      </div>
      <button onClick={onRemove} className="text-slate-600 hover:text-red-500 transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  );

  const addBtn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 px-3 border border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-left text-xs"
    >
      <Plus size={12} /> {label}
    </button>
  );

  return (
    <div className="p-8 h-full flex flex-col bg-slate-950">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 header-font tracking-tight">TRADE ANALYZER</h2>
          <p className="text-slate-400 text-sm font-mono flex items-center gap-2">
            <TrendingUp size={14} className="text-cyan-500" /> Rich Hill Model • 2026 Valuation
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 uppercase font-bold">Trading With:</span>
          <select
            value={selectedTeam}
            onChange={(e) => { setSelectedTeam(e.target.value); setTheirAssets([]); setTradeComplete(false); }}
            className="bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {teams.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </header>

      {tradeComplete && (
        <div className="mb-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-emerald-300 font-bold text-sm">Trade executed! Check your roster.</span>
          <button onClick={() => setTradeComplete(false)} className="ml-auto text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* My Side */}
        <div className="col-span-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Houston Texans</h3>
            <span className="text-cyan-400 font-mono font-bold">{myValue.toFixed(0)} pts</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 p-4 overflow-y-auto space-y-2">
            {myAssets.map(a => assetCard(a, () => removeMine(a.id)))}
            <div className="text-[10px] text-slate-500 uppercase font-bold pt-2">Players</div>
            {myPlayers.filter(p => !myAssets.find(a => a.id === p.id)).map(p =>
              addBtn(`${p.name} (${p.position}, ${p.overall} OVR)`, () => addMine(p))
            )}
            <div className="text-[10px] text-slate-500 uppercase font-bold pt-2">Draft Picks</div>
            {myPicks.filter(p => !myAssets.find(a => a.id === p.id)).map(p =>
              addBtn(`${p.year} Round ${p.round} (#${p.pickNumber})`, () => addMine(p))
            )}
          </div>
        </div>

        {/* Center */}
        <div className="col-span-2 flex flex-col items-center justify-center gap-6">
          <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-cyan-500">
            <ArrowLeftRight size={28} />
          </div>
          <div className="text-center">
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${fairnessColor}`}>{fairness}</div>
            <div className="text-2xl font-bold text-white font-mono">
              {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
            </div>
          </div>
          <button
            onClick={handleExecute}
            disabled={myAssets.length === 0 && theirAssets.length === 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg uppercase tracking-widest shadow-lg transition-all text-sm"
          >
            Execute
          </button>
        </div>

        {/* Their Side */}
        <div className="col-span-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold uppercase tracking-wider text-sm">
              {(TEAMS_DB[selectedTeam] as any)?.city} {(TEAMS_DB[selectedTeam] as any)?.name}
            </h3>
            <span className="text-amber-400 font-mono font-bold">{theirValue.toFixed(0)} pts</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 p-4 overflow-y-auto space-y-2">
            {theirAssets.map(a => assetCard(a, () => removeTheirs(a.id)))}
            <div className="text-[10px] text-slate-500 uppercase font-bold pt-2">Their Players</div>
            {theirPlayers.filter(p => !theirAssets.find(a => a.id === p.id)).map(p =>
              <button key={p.id} onClick={() => addTheirs(p)} className="w-full flex items-center gap-2 py-1.5 px-3 border border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-all text-left text-xs">
                <Plus size={12} /> {p.name} ({p.position}, {p.overall} OVR)
              </button>
            )}
            <div className="text-[10px] text-slate-500 uppercase font-bold pt-2">Their Picks</div>
            {theirPicksAll.filter(p => !theirAssets.find(a => a.id === p.id)).map(p =>
              <button key={p.id} onClick={() => addTheirs(p)} className="w-full flex items-center gap-2 py-1.5 px-3 border border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-all text-left text-xs">
                <Plus size={12} /> {p.year} Round {p.round} (#{p.pickNumber})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 rounded text-cyan-500"><Shield size={18} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1">Team Needs Match</h4>
            <p className="text-xs text-slate-500">Better value when you fill the other team's positional need.</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded text-amber-500"><AlertTriangle size={18} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1">Dead Cap Warning</h4>
            <p className="text-xs text-slate-500">Trading players with signing bonuses incurs dead cap hits.</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-emerald-500/10 rounded text-emerald-500"><Info size={18} /></div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1">Value Logic</h4>
            <p className="text-xs text-slate-500">UNDERPAY means you get more value — you win this trade.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCenter;
