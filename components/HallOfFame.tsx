import React, { useState } from 'react';
import { Award, Trophy, Star, Shield, Search, Flame, Crown, Plus, CheckCircle2, User, ChevronRight, Zap, Sparkles } from 'lucide-react';
import { HallOfFamer, Position, Player } from '../types';
import { TEAMS_DB } from '../constants';

interface HallOfFameProps {
  selectedTeamId: string;
  allPlayers: Player[];
  teams: Record<string, any>;
  inductees: HallOfFamer[];
  setInductees: React.Dispatch<React.SetStateAction<HallOfFamer[]>>;
}

export const INITIAL_HALL_OF_FAMERS: HallOfFamer[] = [
  {
    id: 'hof-brady',
    name: 'Tom Brady',
    position: Position.QB,
    inductionYear: 2028,
    primaryTeam: 'NE',
    seasonsPlayed: 23,
    superBowlRings: 7,
    proBowls: 15,
    allProSelections: 3,
    mvpAwards: 3,
    careerStats: [
      { label: 'PASSING YARDS', value: '89,214 YDS' },
      { label: 'PASSING TOUCHDOWNS', value: '649 TD' },
      { label: 'PASSER RATING', value: '97.2' },
      { label: 'PLAYOFF WINS', value: '35 WINS' }
    ],
    legacyScore: 999,
    keyHighlights: [
      '7x Super Bowl Champion (5x Super Bowl MVP)',
      '3x NFL Most Valuable Player (2007, 2010, 2017)',
      'All-Time Leader in Career Passing Yards and Touchdowns'
    ],
    quote: "I didn't come this far to only come this far.",
    avatarUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'hof-rice',
    name: 'Jerry Rice',
    position: Position.WR,
    inductionYear: 2010,
    primaryTeam: 'SF',
    seasonsPlayed: 20,
    superBowlRings: 3,
    proBowls: 13,
    allProSelections: 10,
    mvpAwards: 0,
    careerStats: [
      { label: 'RECEIVING YARDS', value: '22,895 YDS' },
      { label: 'RECEPTIONS', value: '1,549 REC' },
      { label: 'TOTAL TOUCHDOWNS', value: '208 TD' },
      { label: 'ALL-PURPOSE YDS', value: '23,546 YDS' }
    ],
    legacyScore: 995,
    keyHighlights: [
      '3x Super Bowl Champion (Super Bowl XXIII MVP)',
      'NFL 100th Anniversary All-Time Team Unanimous Selection',
      'All-Time NFL Record Holder in Receptions, Receiving Yards & TDs'
    ],
    quote: "Today I will do what others won't, so tomorrow I can accomplish what others can't.",
    avatarUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'hof-lt',
    name: 'Lawrence Taylor',
    position: Position.LB,
    inductionYear: 1999,
    primaryTeam: 'NYG',
    seasonsPlayed: 13,
    superBowlRings: 2,
    proBowls: 10,
    allProSelections: 8,
    mvpAwards: 1,
    careerStats: [
      { label: 'CAREER SACKS', value: '142.0 SACKS' },
      { label: 'FORCED FUMBLES', value: '33 FF' },
      { label: 'DEF. PLAYER OF YEAR', value: '3x DPOY' },
      { label: 'TOTAL TACKLES', value: '1,088 TKL' }
    ],
    legacyScore: 988,
    keyHighlights: [
      '2x Super Bowl Champion (Super Bowl XXI, XXV)',
      '1986 NFL Most Valuable Player (Only modern defensive MVP)',
      '3x NFL Defensive Player of the Year (1981, 1982, 1986)'
    ],
    quote: "I like to hit people. It relieves stress.",
    avatarUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'hof-sanders',
    name: 'Barry Sanders',
    position: Position.RB,
    inductionYear: 2004,
    primaryTeam: 'DET',
    seasonsPlayed: 10,
    superBowlRings: 0,
    proBowls: 10,
    allProSelections: 6,
    mvpAwards: 1,
    careerStats: [
      { label: 'RUSHING YARDS', value: '15,269 YDS' },
      { label: 'RUSHING TDS', value: '99 TD' },
      { label: 'YARDS PER CARRY', value: '5.0 YPC' },
      { label: '2,000-YD SEASONS', value: '1 SEASON (1997)' }
    ],
    legacyScore: 980,
    keyHighlights: [
      '1997 NFL Co-MVP (2,053 Rushing Yards)',
      'Selected to Pro Bowl in All 10 Seasons Played',
      '4x NFL Rushing Champion'
    ],
    quote: "I just hand the ball to the referee and run back to the huddle.",
    avatarUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'hof-manning',
    name: 'Peyton Manning',
    position: Position.QB,
    inductionYear: 2021,
    primaryTeam: 'IND',
    seasonsPlayed: 18,
    superBowlRings: 2,
    proBowls: 14,
    allProSelections: 7,
    mvpAwards: 5,
    careerStats: [
      { label: 'PASSING YARDS', value: '71,940 YDS' },
      { label: 'PASSING TOUCHDOWNS', value: '539 TD' },
      { label: 'SINGLE-SEASON TDS', value: '55 TD (2013)' },
      { label: 'SINGLE-SEASON YDS', value: '5,477 YDS' }
    ],
    legacyScore: 990,
    keyHighlights: [
      '5x NFL Most Valuable Player (NFL All-Time Record)',
      '2x Super Bowl Champion (Indy & Denver)',
      'Single-Season Passing Records for Yards (5,477) and TDs (55)'
    ],
    quote: "Omaha! Omaha!",
    avatarUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80'
  }
];

const HallOfFame: React.FC<HallOfFameProps> = ({ selectedTeamId, allPlayers, teams, inductees, setInductees }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'franchise' | 'induct'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [selectedInductee, setSelectedInductee] = useState<HallOfFamer | null>(null);

  // Custom induction modal state
  const [selectedRosterPlayerId, setSelectedRosterPlayerId] = useState<string>('');
  const [customQuote, setCustomQuote] = useState('');
  const [inductionSuccessMsg, setInductionSuccessMsg] = useState<string | null>(null);

  const team = teams[selectedTeamId] || TEAMS_DB[selectedTeamId];

  // Candidates for custom franchise induction (older veterans >= 31 OVR >= 85)
  const veteranCandidates = allPlayers.filter(p => p.teamId === selectedTeamId && p.age >= 30);

  const handleInductPlayer = () => {
    const candidate = allPlayers.find(p => p.id === selectedRosterPlayerId);
    if (!candidate) return;

    const newInductee: HallOfFamer = {
      id: `hof-custom-${Date.now()}`,
      name: candidate.name,
      position: candidate.position,
      inductionYear: 2027,
      primaryTeam: selectedTeamId,
      seasonsPlayed: Math.max(10, candidate.age - 21),
      superBowlRings: candidate.overall >= 90 ? 2 : 1,
      proBowls: candidate.overall >= 88 ? 6 : 3,
      allProSelections: candidate.overall >= 90 ? 3 : 1,
      mvpAwards: candidate.position === Position.QB && candidate.overall >= 92 ? 1 : 0,
      careerStats: [
        { label: 'OVERALL RATING AT RETIREMENT', value: `${candidate.overall} OVR` },
        { label: 'SCHEME FIT IMPACT', value: `${candidate.schemeOvr} OVR` },
        { label: 'DEVELOPMENT TRAIT', value: candidate.developmentTrait },
        { label: 'FRANCHISE SEASONS', value: `${Math.max(6, candidate.age - 23)} YRS` }
      ],
      legacyScore: candidate.overall * 10 + (candidate.age * 2),
      keyHighlights: [
        `Inducted as Franchise Legend for ${team.city} ${team.name}`,
        `${candidate.developmentTrait} Tier Development Trait Career Excellence`,
        `Led Franchise through key playoff campaigns`
      ],
      quote: customQuote || `It was an honor representing ${team.city} and putting everything on the field every Sunday.`,
      avatarUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80'
    };

    setInductees(prev => [newInductee, ...prev]);
    setInductionSuccessMsg(`🎉 ${candidate.name} has been officially inducted into the Canton Pro Football Hall of Fame & ${team.name} Ring of Honor!`);
    setSelectedRosterPlayerId('');
    setCustomQuote('');
    setTimeout(() => setInductionSuccessMsg(null), 5000);
  };

  const filteredInductees = inductees.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.primaryTeam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || h.position === positionFilter;
    const matchesTab = activeTab === 'all' || (activeTab === 'franchise' && h.primaryTeam === selectedTeamId);
    return matchesSearch && matchesPos && matchesTab;
  });

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen text-slate-100">
      {/* Header Banner */}
      <div className="bg-[#0a0e14] border border-[#1a222e] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <Crown size={36} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white header-font tracking-wider uppercase italic">
                  PRO_FOOTBALL_HALL_OF_FAME
                </h1>
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                  CANTON, OH // LEGACY ARCHIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                IMMORTALIZING ALL-TIME FOOTBALL LEGENDS, CAREER RECORDS, AND {team.name.toUpperCase()} RING OF HONOR ICON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#05070a] border border-[#1a222e] px-4 py-2 font-mono text-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">TOTAL INDUCTEES</span>
              <span className="text-xl font-bold text-amber-400">{inductees.length}</span>
            </div>
            <div className="bg-[#05070a] border border-[#1a222e] px-4 py-2 font-mono text-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">{team.name} ICONS</span>
              <span className="text-xl font-bold text-cyan-400">{inductees.filter(i => i.primaryTeam === selectedTeamId).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Induction Success Banner */}
      {inductionSuccessMsg && (
        <div className="bg-amber-500/10 border border-amber-500/60 p-4 text-amber-200 font-mono text-xs font-bold flex items-center gap-3 animate-pulse">
          <Sparkles className="text-amber-400" size={20} />
          <span>{inductionSuccessMsg}</span>
        </div>
      )}

      {/* Filter and Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#0a0e14] border border-[#1a222e] p-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                : 'bg-[#05070a] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            ALL-TIME CANTON LEGENDS ({inductees.length})
          </button>
          <button
            onClick={() => setActiveTab('franchise')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
              activeTab === 'franchise'
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                : 'bg-[#05070a] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
            {team.name} RING OF HONOR
          </button>
          <button
            onClick={() => setActiveTab('induct')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
              activeTab === 'induct'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                : 'bg-[#05070a] border-[#1a222e] text-slate-400 hover:text-white'
            }`}
          >
            <Plus size={14} />
            INDUCT RETIRED ICON
          </button>
        </div>

        {/* Search & Position Filters */}
        {activeTab !== 'induct' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="SEARCH LEGEND OR TEAM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#05070a] border border-[#1a222e] pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 w-52"
              />
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-[#05070a] border border-[#1a222e] text-slate-300 font-mono text-xs px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">ALL POSITIONS</option>
              {Object.values(Position).map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'induct' ? (
        /* Custom Franchise Player Induction Panel */
        <div className="bg-[#0a0e14] border border-[#1a222e] p-8 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a222e]">
            <Trophy className="text-amber-400" size={28} />
            <div>
              <h3 className="text-xl font-bold text-white header-font tracking-wide uppercase italic">
                INDUCT FRANCHISE ICON INTO HALL OF FAME
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                SELECT AN ELIGIBLE VETERAN PLAYER FROM {team.name.toUpperCase()} TO IMMORTALIZE THEIR CAREER ACHIEVEMENTS
              </p>
            </div>
          </div>

          <div className="space-y-6 font-mono text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-2 uppercase">SELECT RETIRING VETERAN / STAR:</label>
              {veteranCandidates.length === 0 ? (
                <div className="p-4 bg-[#05070a] border border-[#1a222e] text-amber-400">
                  No veterans (age 30+) found on current roster. Select older players on roster or wait until end of season retirement phase.
                </div>
              ) : (
                <select
                  value={selectedRosterPlayerId}
                  onChange={(e) => setSelectedRosterPlayerId(e.target.value)}
                  className="w-full bg-[#05070a] border border-[#1a222e] text-white p-3 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- SELECT CANDIDATE --</option>
                  {veteranCandidates.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.position} {p.name} - {p.age} yrs old ({p.overall} OVR, {p.developmentTrait} DEV)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-2 uppercase">INDUCTION ACCEPTANCE SPEECH / QUOTE:</label>
              <textarea
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                placeholder={`"Giving my heart and soul to ${team.city} was the greatest privilege of my life..."`}
                className="w-full bg-[#05070a] border border-[#1a222e] text-slate-200 p-3 h-24 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleInductPlayer}
              disabled={!selectedRosterPlayerId}
              className={`w-full py-3.5 font-bold font-mono text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                selectedRosterPlayerId
                  ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-lg'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Crown size={16} />
              OFFICIALLY INDUCT INTO HALL OF FAME
            </button>
          </div>
        </div>
      ) : (
        /* Hall of Fame Inductees Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInductees.map(inductee => (
            <div
              key={inductee.id}
              onClick={() => setSelectedInductee(inductee)}
              className="bg-[#0a0e14] border border-[#1a222e] hover:border-amber-500/60 p-6 transition-all duration-300 group cursor-pointer relative shadow-lg hover:shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#05070a] border border-amber-500/40 p-1 flex items-center justify-center relative overflow-hidden">
                    <img src={inductee.avatarUrl} alt={inductee.name} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold">
                      {inductee.position} // CLASS OF {inductee.inductionYear}
                    </span>
                    <h3 className="text-xl font-bold text-white header-font tracking-tight uppercase group-hover:text-amber-400 transition-colors mt-0.5">
                      {inductee.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-500 block uppercase">LEGACY</span>
                  <span className="text-lg font-bold text-amber-400">{inductee.legacyScore}</span>
                </div>
              </div>

              {/* Achievements Badges */}
              <div className="flex flex-wrap gap-2 mb-4 font-mono text-[9px]">
                {inductee.superBowlRings > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                    <Trophy size={10} /> {inductee.superBowlRings}x SB CHAMP
                  </span>
                )}
                {inductee.mvpAwards > 0 && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold flex items-center gap-1">
                    <Crown size={10} /> {inductee.mvpAwards}x MVP
                  </span>
                )}
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  {inductee.proBowls}x PRO BOWL
                </span>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                  {inductee.allProSelections}x ALL-PRO
                </span>
              </div>

              {/* Career Highlights Preview */}
              <div className="bg-[#05070a] border border-[#1a222e] p-3 space-y-1.5 mb-4">
                {inductee.careerStats.slice(0, 2).map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">{st.label}</span>
                    <span className="text-white font-bold">{st.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest pt-2 border-t border-[#1a222e]">
                <span>VIEW FULL CAREER ARCHIVE</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Inductee Detailed Modal */}
      {selectedInductee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0e14] border border-amber-500/50 w-full max-w-2xl p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedInductee(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#1a222e]">
              <div className="w-16 h-16 bg-[#05070a] border-2 border-amber-400 overflow-hidden">
                <img src={selectedInductee.avatarUrl} alt={selectedInductee.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  CANTON HALL OF FAME CLASS OF {selectedInductee.inductionYear}
                </span>
                <h2 className="text-3xl font-bold text-white header-font uppercase italic">{selectedInductee.name}</h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase">
                  {selectedInductee.position} • PRIMARY TEAM: {selectedInductee.primaryTeam} • {selectedInductee.seasonsPlayed} SEASONS PLAYED
                </p>
              </div>
            </div>

            {/* Career Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {selectedInductee.careerStats.map((st, i) => (
                <div key={i} className="bg-[#05070a] border border-[#1a222e] p-3 font-mono">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">{st.label}</span>
                  <span className="text-sm font-bold text-amber-400">{st.value}</span>
                </div>
              ))}
            </div>

            {/* Key Accomplishments List */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">CAREER HIGHLIGHTS & HONORS:</h4>
              <ul className="space-y-1.5 font-mono text-xs text-slate-300">
                {selectedInductee.keyHighlights.map((hl, i) => (
                  <li key={i} className="flex items-center gap-2 bg-[#05070a] p-2 border border-[#1a222e]">
                    <Star className="text-amber-400 shrink-0" size={12} />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Famous Quote */}
            {selectedInductee.quote && (
              <div className="p-4 bg-[#05070a] border-l-2 border-amber-500 font-mono italic text-xs text-slate-300 mb-6">
                "{selectedInductee.quote}"
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => setSelectedInductee(null)}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all"
              >
                CLOSE ARCHIVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
