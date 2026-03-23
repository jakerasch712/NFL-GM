import React, { useState } from 'react';
import { Search, Target, Microscope, BarChart3, UserPlus, MapPin, Briefcase, Play, Sparkles, X } from 'lucide-react';
import { DraftProspect, Scout, Region, Position } from '../types';

interface ScoutingViewProps {
  selectedTeamId: string;
  prospects: DraftProspect[];
  setProspects: React.Dispatch<React.SetStateAction<DraftProspect[]>>;
  scouts: Scout[];
  setScouts: React.Dispatch<React.SetStateAction<Scout[]>>;
}

const POSITIONS_WITH_GENERAL: (Position | 'General')[] = [
  'General', Position.QB, Position.RB, Position.WR, Position.TE,
  Position.OL, Position.DL, Position.LB, Position.CB, Position.S, Position.K
];

const ScoutingView: React.FC<ScoutingViewProps> = ({ selectedTeamId, prospects, setProspects, scouts, setScouts }) => {
  const [activeTab, setActiveTab] = useState<'prospects' | 'scouts' | 'assignments'>('prospects');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isHiringScout, setIsHiringScout] = useState(false);
  const [newScoutName, setNewScoutName] = useState('');
  const [newScoutSpecialty, setNewScoutSpecialty] = useState<Position | 'General'>('General');
  const [newScoutRegion, setNewScoutRegion] = useState<Region>(Region.SOUTH);

  const selectedProspect = prospects.find(p => p.id === selectedProspectId);

  const handleSimulateWeek = () => {
    setScouts(prevScouts => prevScouts.map(scout => {
      if (scout.assignment) {
        const newProgress = Math.min(100, scout.assignment.progress + 25);
        return { ...scout, assignment: { ...scout.assignment, progress: newProgress } };
      }
      return scout;
    }));

    setProspects(prevProspects => prevProspects.map(prospect => {
      const assignedScout = scouts.find(s => s.assignment?.region === prospect.region);
      if (assignedScout) {
        const bonus = assignedScout.specialty === prospect.position ? 15 : 10;
        const newProgress = Math.min(100, prospect.scoutingProgress + bonus);
        return { ...prospect, scoutingProgress: newProgress };
      }
      return prospect;
    }));
  };

  const handleAssignScout = (scoutId: string, region: Region, focus: Position | 'General') => {
    setScouts(prev => prev.map(s =>
      s.id === scoutId ? { ...s, assignment: { region, focus, progress: 0 } } : s
    ));
  };

  const handleHireScout = () => {
    if (!newScoutName.trim()) return;
    const newScout: Scout = {
      id: `s${Date.now()}`,
      name: newScoutName.trim(),
      level: 1,
      specialty: newScoutSpecialty,
      regionExpertise: newScoutRegion,
      salary: 0.2,
    };
    setScouts(prev => [...prev, newScout]);
    setNewScoutName('');
    setNewScoutSpecialty('General');
    setNewScoutRegion(Region.SOUTH);
    setIsHiringScout(false);
  };

  return (
    <div className="p-8 h-full overflow-hidden flex flex-col bg-slate-950">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white header-font tracking-tight uppercase">Scouting Operations</h2>
          <div className="flex gap-4 mt-2">
            {['prospects', 'scouts', 'assignments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${
                  activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSimulateWeek}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
        >
          <Play size={16} fill="currentColor" />
          Simulate Week
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="col-span-8 flex flex-col overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          {activeTab === 'prospects' && (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search prospects..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors w-64"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
                      <th className="p-4">Prospect</th>
                      <th className="p-4">Region</th>
                      <th className="p-4">Proj. Rd</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4">Potential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {prospects.map(prospect => (
                      <tr
                        key={prospect.id}
                        onClick={() => setSelectedProspectId(prospect.id)}
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedProspectId === prospect.id ? 'bg-cyan-900/10 border-l-4 border-cyan-500' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-white">{prospect.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{prospect.position} • {prospect.school}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-400">{prospect.region}</td>
                        <td className="p-4 text-xs text-slate-300 font-mono">Rd {prospect.projectedRound}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full" style={{width: `${prospect.scoutingProgress}%`}}></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{prospect.scoutingProgress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {prospect.scoutingProgress >= 50 ? (
                            <span className={`text-lg font-bold ${
                              prospect.potential === 'S' ? 'text-yellow-400' :
                              prospect.potential === 'A' ? 'text-emerald-400' : 'text-slate-300'
                            }`}>{prospect.potential}</span>
                          ) : (
                            <span className="text-slate-700 font-bold">?</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'scouts' && (
            <div className="p-6 grid grid-cols-2 gap-6 overflow-y-auto">
              {scouts.map(scout => (
                <div key={scout.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">{scout.name}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Level {scout.level} Scout</p>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded text-[10px] font-bold uppercase">
                      {scout.specialty}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin size={14} className="text-slate-600" />
                      Expertise: <span className="text-slate-200">{scout.regionExpertise}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Briefcase size={14} className="text-slate-600" />
                      Status: {scout.assignment ? (
                        <span className="text-emerald-400">Assigned to {scout.assignment.region}</span>
                      ) : (
                        <span className="text-yellow-500">Idle</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setIsHiringScout(true)}
                className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 text-slate-500 hover:text-cyan-400 hover:border-cyan-400 transition-all group"
              >
                <UserPlus size={32} className="mb-2 opacity-20 group-hover:opacity-100" />
                <span className="text-xs font-bold uppercase tracking-widest">Hire New Scout</span>
              </button>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {scouts.map(scout => (
                  <div key={scout.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">
                        {scout.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold">{scout.name}</div>
                        <div className="text-xs text-slate-500">{scout.specialty} Specialist</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {Object.values(Region).map(region => (
                        <button
                          key={region}
                          onClick={() => handleAssignScout(scout.id, region, 'General')}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                            scout.assignment?.region === region
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="col-span-4 space-y-6 overflow-y-auto pr-2">
          {selectedProspect ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white header-font">{selectedProspect.name}</h3>
                  <p className="text-cyan-400 font-bold text-sm uppercase">{selectedProspect.position} • {selectedProspect.school}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Scout Grade</div>
                  <div className="text-3xl font-mono font-bold text-white">{selectedProspect.scoutingGrade}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">Combine Metrics</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase">40-Yard Dash</div>
                      <div className="text-white font-mono font-bold">{selectedProspect.combineStats.fortyYard}s</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800">
                      <div className="text-[9px] text-slate-500 uppercase">Bench Press</div>
                      <div className="text-white font-mono font-bold">{selectedProspect.combineStats.bench} reps</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-3">Revealed Traits</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProspect.traits.map(trait => (
                      <span key={trait} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-bold uppercase">
                        {trait}
                      </span>
                    ))}
                    {selectedProspect.scoutingProgress >= 90 ? (
                      selectedProspect.hiddenTraits.map(trait => (
                        <span key={trait} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                          <Sparkles size={10} /> {trait}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-slate-950 border border-dashed border-slate-800 text-slate-600 rounded text-[10px] font-bold uppercase">
                        ???
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Microscope size={14} className="text-cyan-400" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Scout Analysis</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedProspect.scoutingProgress < 30
                      ? "Initial reports are limited. Assign a scout to the " + selectedProspect.region + " region to learn more."
                      : selectedProspect.scoutingProgress < 70
                      ? "Showing flashes of " + selectedProspect.potential + " potential. Combine numbers are solid, but need more tape study."
                      : "Complete profile established. " + selectedProspect.name + " is a " + selectedProspect.potential + "-tier prospect with high floor."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 shadow-xl flex flex-col items-center justify-center text-center">
              <Target size={48} className="text-slate-800 mb-4" />
              <h3 className="text-white font-bold mb-2">No Prospect Selected</h3>
              <p className="text-xs text-slate-500 max-w-[200px]">Select a prospect from the list to view detailed scouting reports and metrics.</p>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <BarChart3 size={16} className="text-purple-400" />
              Regional Coverage
            </h3>
            <div className="space-y-3">
              {Object.values(Region).map(region => {
                const assigned = scouts.some(s => s.assignment?.region === region);
                return (
                  <div key={region} className="flex items-center justify-between text-[10px] uppercase font-bold">
                    <span className="text-slate-500">{region}</span>
                    <span className={assigned ? 'text-emerald-400' : 'text-red-500'}>
                      {assigned ? 'Covered' : 'Uncovered'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hire Scout Modal */}
      {isHiringScout && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white header-font uppercase">Hire New Scout</h3>
              <button onClick={() => setIsHiringScout(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Scout Name</label>
                <input
                  type="text"
                  value={newScoutName}
                  onChange={(e) => setNewScoutName(e.target.value)}
                  placeholder="Enter scout name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Specialty</label>
                <select
                  value={newScoutSpecialty}
                  onChange={(e) => setNewScoutSpecialty(e.target.value as Position | 'General')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {POSITIONS_WITH_GENERAL.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Region Expertise</label>
                <select
                  value={newScoutRegion}
                  onChange={(e) => setNewScoutRegion(e.target.value as Region)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {Object.values(Region).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-xs text-slate-500">
                Level 1 scout • Salary: $0.2M/yr
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsHiringScout(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHireScout}
                disabled={!newScoutName.trim()}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hire Scout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoutingView;
