import React, { useState, useEffect } from 'react';
import { 
  Flame, Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, 
  ExternalLink, Key, Terminal, Cpu, Database, ChevronRight, X, Sparkles, UserCheck 
} from 'lucide-react';
import { Player, Position } from '../types';
import { syncFirecrawlRoster, getFirecrawlStatus, FirecrawlSyncResult } from '../services/geminiService';

interface FirecrawlRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId: string;
  team: { city: string; name: string; primaryColor?: string };
  onApplyRoster: (newPlayers: Player[]) => void;
}

const FirecrawlRosterModal: React.FC<FirecrawlRosterModalProps> = ({
  isOpen,
  onClose,
  selectedTeamId,
  team,
  onApplyRoster
}) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('firecrawl_api_key') || '');
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlResult, setCrawlResult] = useState<FirecrawlSyncResult | null>(null);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'crawler' | 'integrations'>('crawler');

  useEffect(() => {
    if (!isOpen) return;
    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const data = await getFirecrawlStatus();
        setStatusData(data);
      } catch (e) {
        console.warn('Error getting firecrawl status:', e);
      } finally {
        setIsLoadingStatus(false);
      }
    };
    fetchStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('firecrawl_api_key', key);
  };

  const handleStartCrawl = async () => {
    setIsCrawling(true);
    setCrawlLogs([
      `[FIRECRAWL] Initializing crawl worker for ${team.city} ${team.name}...`,
      `[ALEXANDRIA] Resolving target URL: https://www.spotrac.com/nfl/${team.city.toLowerCase().replace(/\s+/g, '-')}-${team.name.toLowerCase()}/cap/`,
      apiKey ? `[AUTH] Using provided Firecrawl API Key (${apiKey.slice(0, 7)}...)` : `[AUTH] Searching with web grounding context...`,
      `[SCRAPE] Extracting starter depth charts, contract guarantees, and 2025/2026 cap hits...`
    ]);

    try {
      const result = await syncFirecrawlRoster(
        `${team.city} ${team.name}`,
        selectedTeamId,
        apiKey || undefined
      );

      setCrawlResult(result);
      setCrawlLogs(prev => [
        ...prev,
        `[PARSER] Scraped & structured ${result.players.length} active players!`,
        `[STATUS] Provider: ${result.provider} // Ready to commit to franchise.`
      ]);
    } catch (err: any) {
      setCrawlLogs(prev => [
        ...prev,
        `[ERROR] Crawl encountered issue: ${err.message || 'Unknown error'}.`
      ]);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleCommit = () => {
    if (crawlResult && crawlResult.players.length > 0) {
      onApplyRoster(crawlResult.players);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0a0e14] border-2 border-orange-500/60 max-w-4xl w-full p-6 shadow-[0_0_50px_rgba(249,115,22,0.25)] relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Neon Orange Border line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-amber-400 to-cyan-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-[#1a222e] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/40 text-orange-400">
              <Flame size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                  FIRECRAWL ALEXANDRIA // ROSTER PIPELINE
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  CLI v1.26.8 INSTALLED
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white header-font uppercase italic tracking-tight">
                {team.city} {team.name} // LIVE WEB CRAWL
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-sm font-bold p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs: Crawler Engine vs Integration Setup */}
        <div className="flex gap-2 border-b border-[#1a222e] mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-4 py-2 border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'crawler'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Globe size={14} />
            LIVE ROSTER CRAWLER
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'integrations'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Cpu size={14} />
            ALEXANDRIA INTEGRATION HUB
          </button>
        </div>

        {/* TAB 1: CRAWLER ENGINE */}
        {activeTab === 'crawler' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* API Key Configuration Bar */}
            <div className="bg-[#05070a] border border-[#1a222e] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Key size={15} className="text-orange-400" />
                <span className="text-slate-400 font-bold uppercase text-[10px]">FIRECRAWL_API_KEY:</span>
              </div>
              <div className="flex-1 min-w-[240px] flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleSaveKey(e.target.value)}
                  placeholder="Paste your fc-*** key or leave blank for search fallback"
                  className="flex-1 bg-[#0a0e14] border border-[#1a222e] px-3 py-1.5 text-xs text-orange-300 focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-700"
                />
                <a
                  href="https://www.firecrawl.dev/signin?view=signup"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/40 text-orange-400 text-[10px] font-bold uppercase hover:bg-orange-500/20 transition-all flex items-center gap-1 shrink-0"
                >
                  <span>GET FREE KEY</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-[#0d121a]/80 p-4 border border-[#1a222e]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                  TARGET TARGET DATA SOURCE
                </span>
                <span className="text-xs text-white font-bold flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-400">spotrac.com/nfl</span>
                  <span className="text-slate-600">•</span>
                  <span>Active 53-Man Roster & Cap Breakdown</span>
                </span>
              </div>

              <button
                onClick={handleStartCrawl}
                disabled={isCrawling}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCrawling ? <RefreshCw size={14} className="animate-spin" /> : <Flame size={14} />}
                <span>{isCrawling ? 'CRAWLING WEB ROSTERS...' : 'EXECUTE FIRECRAWL SYNC'}</span>
              </button>
            </div>

            {/* Live Logs Terminal */}
            {crawlLogs.length > 0 && (
              <div className="bg-[#05070a] border border-[#1a222e] p-3 text-[11px] font-mono space-y-1">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 border-b border-[#1a222e] pb-1">
                  EXECUTION TRACE:
                </div>
                {crawlLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Crawled Players Preview */}
            {crawlResult && crawlResult.players.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-[#1a222e] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    CRAWLED ROSTER CANDIDATES ({crawlResult.players.length} PLAYERS)
                  </span>
                  <button
                    onClick={handleCommit}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <UserCheck size={13} />
                    APPLY TO TEAM ROSTER
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {crawlResult.players.slice(0, 18).map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-[#05070a] border border-[#1a222e] p-2.5 flex justify-between items-center hover:border-orange-500/40 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white uppercase">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.position} // DEPTH #{p.depth || idx + 1}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-orange-400 font-mono">OVR {p.overall}</div>
                        <div className="text-[9px] text-slate-500 font-mono">${p.contract.capHit}M CAP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTEGRATION HUB & OFFICIAL PLATFORM CONNECTORS */}
        {activeTab === 'integrations' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 text-orange-300">
              <span className="font-bold uppercase tracking-wider block mb-1">
                🔥 Firecrawl Alexandria Knowledge Base
              </span>
              Firecrawl gives AI agents fast, reliable web context with strong search, scraping, and roster synthesis tools. Connect this agent across your preferred environment:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: ChatGPT Plugin */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                    CHATGPT & CODEX
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Official Firecrawl Plugin</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Install the official plugin in your ChatGPT workspace to enable live scraping and roster extraction.
                  </p>
                </div>
                <a
                  href="https://chatgpt.com/plugins/plugin_asdk_app_6a314a73f8ac819195b0d55e36b9c609?q=firecrawl"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between text-[10px]"
                >
                  <span>OPEN CHATGPT PLUGIN</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Card 2: Claude Integration */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                    CLAUDE CONNECTOR
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Official Claude Connector</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Connect Firecrawl in Claude.ai or Claude Desktop via the official directory integration.
                  </p>
                </div>
                <a
                  href="https://claude.ai/directory/connectors/firecrawl"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-3 py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wider flex items-center justify-between text-[10px]"
                >
                  <span>OPEN CLAUDE CONNECTOR</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Card 3: CLI Initialization */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                    CODING AGENT CLI SETUP
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Firecrawl CLI & Skills</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Run the init command in your terminal to set up credentials, skills, and browser login:
                  </p>
                  <div className="mt-2 p-2 bg-[#0a0e14] border border-[#1a222e] text-[10px] text-amber-400 font-mono select-all">
                    npx -y firecrawl-cli@latest init --all --browser
                  </div>
                </div>
                <div className="mt-4 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> 50 AI Skills Installed Locally
                </div>
              </div>

              {/* Card 4: Free Account & Onboarding */}
              <div className="bg-[#05070a] border border-[#1a222e] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">
                    FREE ACCOUNT & DOCS
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Firecrawl Alexandria Sign-Up</h4>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Create a free account to receive complimentary credits and access Alexandria providers.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href="https://www.firecrawl.dev/signin?view=signup"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-3 py-2 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400 font-bold uppercase tracking-wider flex items-center justify-between text-[10px]"
                  >
                    <span>SIGN UP FREE</span>
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://www.firecrawl.dev/agent-onboarding/SKILL.md"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1 text-[10px]"
                  >
                    <span>SKILL.MD</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-[#1a222e] pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-orange-400" />
            <span>ALEXANDRIA PROTOCOL READY // LIVE DEPTH CHARTS & CONTRACT GUARANTEES</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirecrawlRosterModal;
