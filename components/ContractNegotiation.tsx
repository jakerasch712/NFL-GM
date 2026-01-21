import React, { useState } from 'react';
import { Player } from '../types';
import { X, Check, DollarSign, Briefcase, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  calculateAPY,
  calculateTotalValue,
  getInterestScore as getInterestScoreUtil,
  evaluateContractOffer,
  createContractFromOffer,
  ContractOffer
} from '../utils/contractLogic';

interface ContractNegotiationProps {
  player: Player;
  onClose: () => void;
  onSign: (playerId: string, newContract: any) => void;
  capSpace: number;
}

const ContractNegotiation: React.FC<ContractNegotiationProps> = ({ player, onClose, onSign, capSpace }) => {
  // Initial offer state based on 80% of demand or current value
  const [offerYear, setOfferYear] = useState(player.contractDemand?.years || 1);
  const [offerSalary, setOfferSalary] = useState(player.contractDemand ? player.contractDemand.salary * 0.9 : 1);
  const [offerBonus, setOfferBonus] = useState(player.contractDemand ? player.contractDemand.bonus * 0.8 : 0);
  
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dealStatus, setDealStatus] = useState<'OPEN' | 'ACCEPTED' | 'REJECTED'>('OPEN');

  const totalValue = calculateTotalValue(offerSalary, offerYear, offerBonus);
  const apy = calculateAPY(offerSalary, offerYear, offerBonus);

  const getInterestScore = () => {
    if (!player.contractDemand) return 0;

    const offer: ContractOffer = {
      years: offerYear,
      salary: offerSalary,
      bonus: offerBonus
    };

    return getInterestScoreUtil(offer, player.contractDemand);
  };

  const handleOffer = () => {
    const score = getInterestScore();
    const evaluation = evaluateContractOffer(score);

    setDealStatus(evaluation.status);
    setFeedback(evaluation.feedback);

    if (evaluation.status === 'ACCEPTED') {
      setTimeout(() => {
        const offer: ContractOffer = {
          years: offerYear,
          salary: offerSalary,
          bonus: offerBonus
        };
        const contract = createContractFromOffer(offer);
        onSign(player.id, contract);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-6 flex justify-between items-start border-b border-slate-800">
            <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-2xl text-slate-500">
                    {player.position}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white header-font">{player.name}</h2>
                    <div className="flex gap-4 text-sm text-slate-400 font-mono mt-1">
                        <span>OVR: <span className="text-white">{player.overall}</span></span>
                        <span>AGE: <span className="text-white">{player.age}</span></span>
                        <span>ARCH: <span className="text-white">{player.archetype}</span></span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Left: Agent & Status */}
            <div className="w-1/3 bg-slate-950/50 p-6 border-r border-slate-800 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Agent Notes</h3>
                    <div className="bg-slate-800 p-4 rounded-tl-xl rounded-tr-xl rounded-br-xl text-sm text-slate-300 leading-relaxed relative">
                        <div className="absolute top-0 left-0 -ml-2 -mt-2 w-4 h-4 bg-cyan-500 rounded-full border-2 border-slate-950"></div>
                        {feedback ? (
                            <span className={dealStatus === 'ACCEPTED' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{feedback}</span>
                        ) : (
                            <span>
                                "{player.name} is looking for <span className="text-white font-bold">{player.contractDemand?.interest}</span>. 
                                We are seeking a <span className="text-white font-bold">{player.contractDemand?.years} year</span> commitment around 
                                <span className="text-white font-bold"> ${(player.contractDemand!.salary * player.contractDemand!.years + player.contractDemand!.bonus).toFixed(1)}M</span> total value."
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Deal Interest</h3>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                            className={`h-full transition-all duration-500 ${getInterestScore() > 80 ? 'bg-emerald-500' : getInterestScore() > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{width: `${getInterestScore()}%`}}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Right: Contract Builder */}
            <div className="w-2/3 p-6 flex flex-col">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs uppercase font-bold">Cap Space</span>
                            <span className="text-emerald-400 font-mono font-bold">${capSpace}M</span>
                        </div>
                        <div className="text-xs text-slate-500">Current Available</div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs uppercase font-bold">Proj. Cap Hit</span>
                            <span className={`font-mono font-bold ${apy > capSpace ? 'text-red-500' : 'text-white'}`}>${apy.toFixed(2)}M</span>
                        </div>
                        <div className="text-xs text-slate-500">Year 1 Impact</div>
                    </div>
                </div>

                {dealStatus !== 'ACCEPTED' && (
                    <div className="space-y-6">
                        {/* Years Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-white flex items-center gap-2">
                                    <Briefcase size={16} className="text-cyan-500" /> Contract Length
                                </label>
                                <span className="text-cyan-400 font-mono font-bold text-lg">{offerYear} Years</span>
                            </div>
                            <input 
                                type="range" min="1" max="7" step="1" 
                                value={offerYear} 
                                onChange={(e) => setOfferYear(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                                <span>1 Yr</span>
                                <span>7 Yrs</span>
                            </div>
                        </div>

                        {/* Salary Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-white flex items-center gap-2">
                                    <DollarSign size={16} className="text-emerald-500" /> Salary / Year
                                </label>
                                <span className="text-emerald-400 font-mono font-bold text-lg">${offerSalary.toFixed(1)}M</span>
                            </div>
                            <input 
                                type="range" min="0.5" max="60" step="0.5" 
                                value={offerSalary} 
                                onChange={(e) => setOfferSalary(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                            />
                        </div>

                        {/* Bonus Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={16} className="text-purple-500" /> Signing Bonus
                                </label>
                                <span className="text-purple-400 font-mono font-bold text-lg">${offerBonus.toFixed(1)}M</span>
                            </div>
                            <input 
                                type="range" min="0" max="50" step="0.5" 
                                value={offerBonus} 
                                onChange={(e) => setOfferBonus(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                            />
                        </div>
                    </div>
                )}
                
                {/* Total Value Summary */}
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Contract Value</div>
                            <div className="text-4xl font-bold text-white header-font">${totalValue.toFixed(1)}M</div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-slate-500 uppercase font-bold mb-1">Guaranteed</div>
                             <div className="text-xl font-bold text-purple-400 font-mono">${offerBonus.toFixed(1)}M</div>
                        </div>
                    </div>

                    {dealStatus === 'ACCEPTED' ? (
                        <button 
                            onClick={onClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
                        >
                            <Check size={20} /> Contract Signed
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={onClose}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-lg uppercase tracking-wider transition-colors"
                            >
                                Withdraw
                            </button>
                            <button 
                                onClick={handleOffer}
                                disabled={apy > capSpace}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg uppercase tracking-wider shadow-lg shadow-cyan-900/20 transition-all"
                            >
                                Submit Offer
                            </button>
                        </div>
                    )}
                    {apy > capSpace && (
                        <div className="flex items-center gap-2 text-red-500 text-xs mt-3 justify-center">
                            <AlertTriangle size={14} />
                            <span>This offer exceeds available cap space.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContractNegotiation;