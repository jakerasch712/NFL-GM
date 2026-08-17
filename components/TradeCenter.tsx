import React, { useState } from 'react';
import { TEAMS_DB } from '../constants';
import { ArrowLeftRight, Plus, Trash2, TrendingUp, Shield, Info, AlertTriangle, History, CheckCircle2, Clock, Scale, X, Zap, Award, UserCheck, DollarSign } from 'lucide-react';
import { Player, DraftPick, TradeRecord } from '../types';

interface TradeCenterProps {
  selectedTeamId: string;
  allPlayers: Player[];
  setAllPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  teams: Record<string, any>;
  tradeHistory?: TradeRecord[];
  setTradeHistory?: React.Dispatch<React.SetStateAction<TradeRecord[]>>;
  currentWeek?: number;
}

const TradeCenter: React.FC<TradeCenterProps> = ({ 
  selectedTeamId, 
  allPlayers, 
  setAllPlayers, 
  teams,
  tradeHistory = [],
  setTradeHistory,
  currentWeek = 1
}) => {
  const [activeTab, setActiveTab] = useState<'exchange' | 'history'>('exchange');
  const [myAssets, setMyAssets] = useState<(Player | DraftPick)[]>([]);
  const [theirAssets, setTheirAssets] = useState<(Player | DraftPick)[]>([]);
  const [targetTeamId, setTargetTeamId] = useState(selectedTeamId === 'FA' ? 'BAL' : Object.keys(teams).find(id => id !== selectedTeamId) || 'BAL');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Asset Comparison State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparePlayerAId, setComparePlayerAId] = useState<string>('');
  const [comparePlayerBId, setComparePlayerBId] = useState<string>('');

  const myTeamPlayers = allPlayers.filter(p => p.teamId === selectedTeamId);
  const targetTeamPlayers = allPlayers.filter(p => p.teamId === targetTeamId);

  const openComparison = () => {
    const mySelectedPlayer = myAssets.find(a => 'overall' in a) as Player | undefined;
    const targetSelectedPlayer = theirAssets.find(a => 'overall' in a) as Player | undefined;

    setComparePlayerAId(mySelectedPlayer?.id || myTeamPlayers[0]?.id || '');
    setComparePlayerBId(targetSelectedPlayer?.id || targetTeamPlayers[0]?.id || '');
    setShowComparisonModal(true);
  };

  // Local fallback state if tradeHistory is not passed from top level
  const [localHistory, setLocalHistory] = useState<TradeRecord[]>([
    {
      id: 'trade-init-1',
      date: 'Year 2027, Preseason Week 1',
      myTeamId: selectedTeamId,
      targetTeamId: 'KC',
      myTeamName: `${teams[selectedTeamId]?.city || 'Primary'} ${teams[selectedTeamId]?.name || 'Franchise'}`,
      targetTeamName: 'Kansas City Chiefs',
      sentAssets: ['2027 Round 3 Pick #65', 'WR Slot Depth'],
      receivedAssets: ['2027 Round 2 Pick #33'],
      fairness: 'FAIR',
      valueDelta: 12
    }
  ]);

  const activeHistory = setTradeHistory && tradeHistory ? tradeHistory : localHistory;

  const myTeam = teams[selectedTeamId] || TEAMS_DB[selectedTeamId] || { city: 'Primary', name: 'Team' };
  const targetTeam = teams[targetTeamId] || TEAMS_DB[targetTeamId] || { city: 'Opponent', name: 'Rivals' };

  const otherTeams = Object.values(teams).filter(t => t.id !== selectedTeamId).map(t => ({
    id: t.id,
    name: `${t.city} ${t.name}`,
    needs: ['WR', 'CB']
  }));

  const calculateValue = (assets: (Player | DraftPick)[]) => {
    return assets.reduce((acc, asset) => {
      if ('overall' in asset) {
        const ageFactor = Math.max(0.5, (35 - asset.age) / 10);
        return acc + (asset.overall * asset.overall * ageFactor) / 10;
      } else {
        return acc + asset.value;
      }
    }, 0);
  };

  const myValue = calculateValue(myAssets);
  const theirValue = calculateValue(theirAssets);
  const diff = myValue - theirValue;
  const fairness = (myAssets.length === 0 && theirAssets.length === 0) 
    ? 'EMPTY' 
    : Math.abs(diff) < (Math.max(myValue, theirValue, 100) * 0.18) 
      ? 'FAIR' 
      : diff > 0 
        ? 'OVERPAY' 
        : 'UNDERPAY';

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

  const handleExecuteTrade = () => {
    if (myAssets.length === 0 && theirAssets.length === 0) {
      setTradeMessage({ type: 'error', text: 'CANNOT EXECUTE EMPTY EXCHANGE :: SELECT ASSETS ON AT LEAST ONE SIDE' });
      return;
    }

    if (fairness === 'UNDERPAY' && diff < -150) {
      setTradeMessage({ type: 'error', text: `${targetTeam.name.toUpperCase()} FRONT OFFICE REJECTED OFFER :: VALUATION TOO LOW` });
      return;
    }

    // Execute swap in player database
    if (setAllPlayers) {
      const myPlayerIds = myAssets.filter(a => 'overall' in a).map(a => a.id);
      const theirPlayerIds = theirAssets.filter(a => 'overall' in a).map(a => a.id);

      setAllPlayers(prev => prev.map(p => {
        if (myPlayerIds.includes(p.id)) {
          return { ...p, teamId: targetTeamId };
        }
        if (theirPlayerIds.includes(p.id)) {
          return { ...p, teamId: selectedTeamId };
        }
        return p;
      }));
    }

    // Create log record
    const newRecord: TradeRecord = {
      id: `trade-${Date.now()}`,
      date: `Year 2027, Week ${currentWeek}`,
      myTeamId: selectedTeamId,
      targetTeamId,
      myTeamName: `${myTeam.city} ${myTeam.name}`,
      targetTeamName: `${targetTeam.city} ${targetTeam.name}`,
      sentAssets: myAssets.map(a => 'name' in a ? `${a.position} ${a.name} (${a.overall} OVR)` : `Round ${a.round} Pick #${a.pickNumber}`),
      receivedAssets: theirAssets.map(a => 'name' in a ? `${a.position} ${a.name} (${a.overall} OVR)` : `Round ${a.round} Pick #${a.pickNumber}`),
      fairness: fairness === 'EMPTY' ? 'FAIR' : fairness,
      valueDelta: Math.round(diff)
    };

    if (setTradeHistory) {
      setTradeHistory(prev => [newRecord, ...prev]);
    } else {
      setLocalHistory(prev => [newRecord, ...prev]);
    }

    setTradeMessage({ 
      type: 'success', 
      text: `TRADE APPROVED & LOGGED :: ${targetTeam.name.toUpperCase()} AGREED TO TRANSACTION` 
    });

    setMyAssets([]);
    setTheirAssets([]);

    setTimeout(() => {
      setTradeMessage(null);
    }, 5000);
  };

  return (
    <div className="p-8 h-full flex flex-col bg-[#05070a] overflow-y-auto">
      <header className="mb-8 flex justify-between items-end border-b border-[#1a222e] pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tighter uppercase italic">ASSET_EXCHANGE_TERMINAL</h2>
          <p className="text-cyan-500 text-[10px] mono-font mt-1 uppercase tracking-[0.3em] font-bold italic">
            <TrendingUp size={14} className="inline mr-2 text-cyan-500 animate-pulse" />
            VALUATION_ENGINE::RICH_HILL_MODEL // EST_2026_MATRIX
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-[#0a0e14] border border-[#1a222e] p-1">
            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mono-font transition-all ${
                activeTab === 'exchange' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-500 hover:text-white'
              }`}
            >
              EXCHANGE TERMINAL
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] mono-font flex items-center gap-2 transition-all ${
                activeTab === 'history' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-500 hover:text-white'
              }`}
            >
              <History size={14} />
              TRADE LOG ({activeHistory.length})
            </button>
          </div>

          {activeTab === 'exchange' && (
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-slate-600 uppercase font-bold tracking-[0.2em] mono-font italic">COUNTER_PARTY:</span>
              <select 
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="bg-[#0a0e14] border border-[#1a222e] text-cyan-500 px-6 py-2 text-[10px] mono-font font-bold focus:outline-none focus:border-cyan-500/50 transition-all uppercase tracking-widest cursor-pointer"
              >
                {otherTeams.map(t => <option key={t.id} value={t.id} className="bg-[#0a0e14]">{t.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>

      {tradeMessage && (
        <div className={`mb-6 p-4 border flex items-center gap-3 text-[11px] font-mono tracking-widest uppercase ${
          tradeMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          {tradeMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{tradeMessage.text}</span>
        </div>
      )}

      {activeTab === 'exchange' ? (
        <>
          <div className="grid grid-cols-12 gap-1 flex-1 min-h-[450px]">
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
                <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 mono-font italic ${fairness === 'FAIR' ? 'text-emerald-500 animate-pulse' : fairness === 'OVERPAY' ? 'text-amber-500' : fairness === 'UNDERPAY' ? 'text-red-500' : 'text-slate-600'}`}>
                  {fairness} // DELTA
                </div>
                <div className="text-4xl font-bold text-white font-mono tracking-tighter">
                  {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
                </div>
                <div className="mt-2 w-12 h-0.5 bg-cyan-500/20 mx-auto"></div>
              </div>

              <button 
                onClick={handleExecuteTrade}
                className="w-full bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-200 hover:border-cyan-400 font-bold py-4 text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl mono-font italic"
              >
                PROPOSE_EXCHANGE
              </button>

              <button 
                onClick={openComparison}
                className="w-full bg-[#0d121a]/80 hover:bg-amber-500 hover:text-black border border-[#1a222e] text-amber-400 hover:border-amber-400 font-bold py-3 text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg mono-font flex items-center justify-center gap-2"
              >
                <Scale size={14} />
                COMPARE_ASSETS
              </button>
            </div>

            {/* Their Side */}
            <div className="col-span-5 flex flex-col gap-1">
              <div className="flex justify-between items-center bg-[#0d121a]/50 p-4 border border-[#1a222e]">
                <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] mono-font italic">{targetTeam.city} {targetTeam.name} // TARGET</h3>
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

          {/* Insights Panel */}
          <div className="mt-4 flex gap-1 h-28">
            <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 text-cyan-500 group-hover:scale-110 transition-transform"><Shield size={20} /></div>
              <div>
                <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">SYNERGY_OVERLAP_MATCH</h4>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Transmitting depth nodes to counter-party optimizes scheme rating balance.</p>
              </div>
            </div>
            <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
              <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-500 group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">CAP_LIABILITY_WARNING</h4>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Exchange of high-salary assets triggers immediate dead cap acceleration.</p>
              </div>
            </div>
            <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] p-5 flex items-start gap-5 hover:bg-[#0d121a] transition-colors group">
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform"><Info size={20} /></div>
              <div>
                <h4 className="text-white font-bold text-[10px] mb-2 uppercase tracking-[0.2em] mono-font italic">ALGORITHM_FEEDBACK</h4>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tight italic leading-relaxed">Rich Hill trade chart evaluates future draft picks with standard time discount values.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* TRADE HISTORY LOG TAB */
        <div className="flex-1 bg-[#0a0e14] border border-[#1a222e] flex flex-col p-6 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#1a222e]">
            <div className="flex items-center gap-3">
              <History size={20} className="text-cyan-400 animate-pulse" />
              <h3 className="text-lg font-bold text-white header-font tracking-tight uppercase italic">TRANSACTION_HISTORY_REGISTRY</h3>
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              TOTAL TRANSACTIONS LOGGED: <span className="text-cyan-400 font-bold">{activeHistory.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activeHistory.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[#1a222e] text-slate-600 font-mono uppercase tracking-widest text-xs">
                NO_PAST_TRANSACTIONS_LOGGED_YET
              </div>
            ) : (
              activeHistory.map(record => (
                <div key={record.id} className="bg-[#05070a] border border-[#1a222e] p-6 hover:border-cyan-500/40 transition-all duration-300 group">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1a222e]/60">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                        {record.date}
                      </span>
                      <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                        {record.myTeamName} <span className="text-cyan-400 font-bold mx-1">↔</span> {record.targetTeamName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest border ${
                        record.fairness === 'FAIR' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {record.fairness} VALUE
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        DELTA: <span className="text-white font-bold">{record.valueDelta > 0 ? `+${record.valueDelta}` : record.valueDelta} PTS</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Sent Assets */}
                    <div className="bg-[#0a0e14] p-4 border border-[#1a222e]">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500"></div>
                        ASSETS SENT BY {record.myTeamName.toUpperCase()}
                      </div>
                      <ul className="space-y-1.5">
                        {record.sentAssets.length === 0 ? (
                          <li className="text-[10px] font-mono text-slate-600 italic">None</li>
                        ) : (
                          record.sentAssets.map((item, idx) => (
                            <li key={idx} className="text-xs font-mono text-slate-200 uppercase tracking-tight flex items-center gap-2">
                              <span className="text-slate-600 text-[10px]">►</span> {item}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    {/* Received Assets */}
                    <div className="bg-[#0a0e14] p-4 border border-[#1a222e]">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                        ASSETS ACQUIRED FROM {record.targetTeamName.toUpperCase()}
                      </div>
                      <ul className="space-y-1.5">
                        {record.receivedAssets.length === 0 ? (
                          <li className="text-[10px] font-mono text-slate-600 italic">None</li>
                        ) : (
                          record.receivedAssets.map((item, idx) => (
                            <li key={idx} className="text-xs font-mono text-cyan-400 uppercase tracking-tight flex items-center gap-2">
                              <span className="text-cyan-600 text-[10px]">►</span> {item}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Asset Comparison Head-to-Head Modal */}
      {showComparisonModal && (() => {
        const pA = allPlayers.find(p => p.id === comparePlayerAId) || myTeamPlayers[0];
        const pB = allPlayers.find(p => p.id === comparePlayerBId) || targetTeamPlayers[0];

        if (!pA || !pB) {
          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0a0e14] border border-[#1a222e] p-8 max-w-md text-center">
                <p className="text-white font-mono text-sm mb-4">SELECT AT LEAST ONE ACTIVE PLAYER ON EACH TEAM TO COMPARE</p>
                <button onClick={() => setShowComparisonModal(false)} className="px-6 py-2 bg-cyan-500 text-black font-bold font-mono text-xs">CLOSE</button>
              </div>
            </div>
          );
        }

        const pAValue = Math.round(('overall' in pA) ? (pA.overall * pA.overall * Math.max(0.5, (35 - pA.age) / 10)) / 10 : 0);
        const pBValue = Math.round(('overall' in pB) ? (pB.overall * pB.overall * Math.max(0.5, (35 - pB.age) / 10)) / 10 : 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0a0e14] border border-[#1a222e] w-full max-w-4xl p-8 shadow-2xl relative my-8">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a222e]">
                <Scale className="text-amber-400" size={28} />
                <div>
                  <h3 className="text-2xl font-bold text-white header-font tracking-tight uppercase italic">
                    HEAD_TO_HEAD_ASSET_COMPARISON
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                    Side-By-Side Attribute & Contract Valuation Matrix
                  </p>
                </div>
              </div>

              {/* Player Selector Bar */}
              <div className="grid grid-cols-2 gap-6 mb-6 bg-[#05070a] p-4 border border-[#1a222e]">
                <div>
                  <label className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-2">
                    {myTeam.city} {myTeam.name} Asset:
                  </label>
                  <select
                    value={pA.id}
                    onChange={(e) => setComparePlayerAId(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-[#1a222e] text-cyan-400 font-mono text-xs font-bold p-2 focus:outline-none"
                  >
                    {myTeamPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.position} {p.name} ({p.overall} OVR)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">
                    {targetTeam.city} {targetTeam.name} Asset:
                  </label>
                  <select
                    value={pB.id}
                    onChange={(e) => setComparePlayerBId(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-[#1a222e] text-amber-400 font-mono text-xs font-bold p-2 focus:outline-none"
                  >
                    {targetTeamPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.position} {p.name} ({p.overall} OVR)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Player Cards Header */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Player A Card */}
                <div className="bg-[#05070a] border border-cyan-500/30 p-6 relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] font-bold">
                      {pA.position} // {pA.teamId}
                    </span>
                    <span className="text-2xl font-mono font-bold text-cyan-400">{pA.overall} <span className="text-xs text-slate-500 font-normal">OVR</span></span>
                  </div>
                  <h4 className="text-xl font-bold text-white header-font uppercase tracking-tight">{pA.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                    {pA.archetype} • {pA.developmentTrait} DEV
                  </div>
                </div>

                {/* Player B Card */}
                <div className="bg-[#05070a] border border-amber-500/30 p-6 relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold">
                      {pB.position} // {pB.teamId}
                    </span>
                    <span className="text-2xl font-mono font-bold text-amber-400">{pB.overall} <span className="text-xs text-slate-500 font-normal">OVR</span></span>
                  </div>
                  <h4 className="text-xl font-bold text-white header-font uppercase tracking-tight">{pB.name}</h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                    {pB.archetype} • {pB.developmentTrait} DEV
                  </div>
                </div>
              </div>

              {/* Head-to-Head Comparison Table */}
              <div className="bg-[#05070a] border border-[#1a222e] divide-y divide-[#1a222e] mb-6 font-mono text-xs">
                {/* Attribute Row: OVR Rating */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className={`font-bold ${pA.overall >= pB.overall ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pA.overall} OVR {pA.overall > pB.overall && <span className="text-[9px] text-emerald-400 font-bold ml-1">▲ (+{pA.overall - pB.overall})</span>}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OVERALL RATING</div>
                  <div className={`font-bold ${pB.overall >= pA.overall ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pB.overall} OVR {pB.overall > pA.overall && <span className="text-[9px] text-emerald-400 font-bold ml-1">▲ (+{pB.overall - pA.overall})</span>}
                  </div>
                </div>

                {/* Attribute Row: Scheme Fit */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className={`font-bold ${pA.schemeOvr >= pB.schemeOvr ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {pA.schemeOvr} OVR
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SCHEME FIT OVR</div>
                  <div className={`font-bold ${pB.schemeOvr >= pA.schemeOvr ? 'text-amber-400' : 'text-slate-400'}`}>
                    {pB.schemeOvr} OVR
                  </div>
                </div>

                {/* Attribute Row: Age */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className={`font-bold ${pA.age <= pB.age ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pA.age} YRS {pA.age < pB.age && <span className="text-[9px] text-emerald-400 font-bold ml-1">({pB.age - pA.age} yrs younger)</span>}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AGE / EXPERIENCE</div>
                  <div className={`font-bold ${pB.age <= pA.age ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pB.age} YRS {pB.age < pA.age && <span className="text-[9px] text-emerald-400 font-bold ml-1">({pA.age - pB.age} yrs younger)</span>}
                  </div>
                </div>

                {/* Attribute Row: Contract Cap Hit */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className={`font-bold ${(pA.contract?.capHit || pA.contract?.salary || 0) <= (pB.contract?.capHit || pB.contract?.salary || 0) ? 'text-emerald-400' : 'text-slate-400'}`}>
                    ${pA.contract?.capHit || pA.contract?.salary || 0}M / YR
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ANNUAL CAP HIT</div>
                  <div className={`font-bold ${(pB.contract?.capHit || pB.contract?.salary || 0) <= (pA.contract?.capHit || pA.contract?.salary || 0) ? 'text-emerald-400' : 'text-slate-400'}`}>
                    ${pB.contract?.capHit || pB.contract?.salary || 0}M / YR
                  </div>
                </div>

                {/* Attribute Row: Contract Term */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className="text-slate-300 font-bold">
                    {pA.contract?.yearsLeft || 1} YRS REMAINING
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CONTRACT TERM</div>
                  <div className="text-slate-300 font-bold">
                    {pB.contract?.yearsLeft || 1} YRS REMAINING
                  </div>
                </div>

                {/* Attribute Row: Trade Value Points */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className={`font-bold ${pAValue >= pBValue ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {pAValue} PTS
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RICH HILL TRADE VALUE</div>
                  <div className={`font-bold ${pBValue >= pAValue ? 'text-amber-400' : 'text-slate-400'}`}>
                    {pBValue} PTS
                  </div>
                </div>

                {/* Attribute Row: Fatigue & Morale */}
                <div className="p-3 grid grid-cols-3 items-center text-center">
                  <div className="text-slate-300">
                    M: {pA.morale}% | F: {pA.fatigue}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MORALE & FATIGUE</div>
                  <div className="text-slate-300">
                    M: {pB.morale}% | F: {pB.fatigue}%
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="px-6 py-2 bg-[#0d121a] hover:bg-cyan-500 hover:text-black border border-[#1a222e] text-slate-200 font-mono font-bold text-xs uppercase tracking-wider transition-all"
                >
                  CLOSE COMPARISON
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TradeCenter;
