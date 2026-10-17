import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/rosters/spotrac-sync', async (req, res) => {
  try {
    const { teamName, teamId } = req.body;
    const ai = getGenAI();
    
    const prompt = `Search spotrac.com/nfl and current 2025/2026 Spotrac NFL databases for the complete roster, depth chart, contract values, cap hits, and positions of the NFL team "${teamName || teamId}".
Website reference: https://www.spotrac.com/nfl/

Extract the key starters and depth chart players with real contract figures from Spotrac.
Return strictly a JSON object with a "players" array formatted like this:
{
  "players": [
    {
      "name": "Patrick Mahomes",
      "position": "QB",
      "age": 30,
      "overall": 99,
      "depth": 1,
      "archetype": "Improviser",
      "salary": 45.0,
      "bonus": 60.0,
      "guaranteed": 140.0,
      "yearsLeft": 8,
      "totalValue": 450.0,
      "capHit": 48.0,
      "deadCap": 80.0,
      "years": 10
    }
  ],
  "sourceUrl": "https://www.spotrac.com/nfl"
}
Valid positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K.
Make sure all primary units (Offensive Line, Secondary, Pass Catchers, Defensive Front, Linebackers, Backfield, Specialists) have realistic starting and backup players. Respond ONLY with the JSON block.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let players = [];
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        players = parsed.players || [];
      } else {
        const arrMatch = text.match(/\[[\s\S]*\]/);
        if (arrMatch) players = JSON.parse(arrMatch[0]);
      }
    } catch (parseErr) {
      console.warn('Could not parse JSON from spotrac gemini response:', parseErr);
    }

    res.json({
      success: true,
      players,
      sources: groundingChunks.map(c => c.web).filter(Boolean),
      spotracUrl: `https://www.spotrac.com/nfl/${(teamName || '').toLowerCase().replace(/\s+/g, '-')}/cap/`
    });
  } catch (error: any) {
    console.error('Error fetching Spotrac rosters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Spotrac roster data'
    });
  }
});

app.get('/api/firecrawl/status', async (req, res) => {
  const envKey = process.env.FIRECRAWL_API_KEY;
  res.json({
    success: true,
    installed: true,
    cliVersion: 'v1.26.8',
    hasKey: !!envKey,
    keyMasked: envKey ? `${envKey.slice(0, 6)}...${envKey.slice(-4)}` : null,
    integrations: {
      chatgptPlugin: 'https://chatgpt.com/plugins/plugin_asdk_app_6a314a73f8ac819195b0d55e36b9c609?q=firecrawl',
      claudeConnector: 'https://claude.ai/directory/connectors/firecrawl',
      cliCommand: 'npx -y firecrawl-cli@latest init --all --browser',
      signupUrl: 'https://www.firecrawl.dev/signin?view=signup',
      onboardingDoc: 'https://www.firecrawl.dev/agent-onboarding/SKILL.md'
    }
  });
});

app.post('/api/rosters/firecrawl-sync', async (req, res) => {
  try {
    const { teamName, teamId, apiKey, customUrl } = req.body;
    const effectiveKey = apiKey || process.env.FIRECRAWL_API_KEY;
    const teamSlug = (teamName || teamId || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetUrl = customUrl || `https://www.spotrac.com/nfl/${teamSlug}/cap/`;

    let scrapedMarkdown = '';
    let usedProvider = 'gemini-fallback';

    if (effectiveKey) {
      try {
        const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`
          },
          body: JSON.stringify({
            url: targetUrl,
            formats: ['markdown'],
            onlyMainContent: true
          })
        });

        if (firecrawlRes.ok) {
          const fcData = await firecrawlRes.json();
          scrapedMarkdown = fcData.data?.markdown || '';
          usedProvider = 'firecrawl-alexandria';
        } else {
          console.warn('Firecrawl API error response:', await firecrawlRes.text());
        }
      } catch (fcErr) {
        console.warn('Direct Firecrawl scrape error:', fcErr);
      }
    }

    const ai = getGenAI();
    let prompt = '';

    if (scrapedMarkdown && scrapedMarkdown.length > 100) {
      prompt = `Extract the active NFL player roster, contract values, cap hits, and positions from this Firecrawl scraped page for the team "${teamName || teamId}".
Source URL: ${targetUrl}

Scraped Data Content:
${scrapedMarkdown.slice(0, 15000)}

Output strictly a JSON object with a "players" array formatted like this:
{
  "players": [
    {
      "name": "Player Name",
      "position": "QB",
      "age": 28,
      "overall": 92,
      "depth": 1,
      "archetype": "Field General",
      "salary": 38.0,
      "bonus": 15.0,
      "guaranteed": 90.0,
      "yearsLeft": 3,
      "totalValue": 120.0,
      "capHit": 35.0,
      "deadCap": 20.0,
      "years": 4
    }
  ],
  "provider": "firecrawl-alexandria"
}
Valid positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K.
Ensure depth charts and all major units (QB, RB, WR, TE, OL, DL, LB, CB, S, K) are populated. Return ONLY JSON.`;
    } else {
      prompt = `Perform a live web search on spotrac.com/nfl and current 2025/2026 NFL databases to fetch the complete active roster, depth chart, contracts, and cap hits for "${teamName || teamId}".
Output strictly a JSON object with a "players" array:
{
  "players": [
    {
      "name": "Player Name",
      "position": "QB",
      "age": 27,
      "overall": 88,
      "depth": 1,
      "archetype": "Improviser",
      "salary": 25.0,
      "bonus": 10.0,
      "guaranteed": 50.0,
      "yearsLeft": 2,
      "totalValue": 75.0,
      "capHit": 22.0,
      "deadCap": 15.0,
      "years": 3
    }
  ]
}
Valid positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K. Return ONLY JSON.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: scrapedMarkdown ? {} : { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || '';
    let players = [];
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        players = parsed.players || [];
      } else {
        const arrMatch = text.match(/\[[\s\S]*\]/);
        if (arrMatch) players = JSON.parse(arrMatch[0]);
      }
    } catch (parseErr) {
      console.warn('Error parsing JSON from Firecrawl roster extraction:', parseErr);
    }

    res.json({
      success: true,
      provider: usedProvider,
      targetUrl,
      hasFirecrawlKey: !!effectiveKey,
      playersCount: players.length,
      players
    });
  } catch (error: any) {
    console.error('Error in Firecrawl roster sync:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync rosters with Firecrawl'
    });
  }
});

app.post('/api/rosters/live-search', async (req, res) => {
  try {
    const { teamName, query } = req.body;
    const ai = getGenAI();
    
    const prompt = `Perform a search to find the latest active NFL roster, contracts, and depth chart from Spotrac (https://www.spotrac.com/nfl) for ${teamName ? `the ${teamName}` : 'top NFL teams'}. ${query ? `Query context: ${query}` : ''}

Output MUST be a JSON array containing top key starters/players in this format:
[
  {
    "name": "Player Name",
    "position": "QB",
    "teamAbbr": "KC",
    "age": 29,
    "overall": 98,
    "depth": 1,
    "salary": 35.0,
    "capHit": 38.0,
    "notes": "Starter, Spotrac verified"
  }
]
Valid positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K.
Ensure high accuracy using latest search results from spotrac.com/nfl. Respond ONLY with the JSON array inside a json block.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    let players = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        players = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.warn('Could not parse JSON from gemini response directly:', parseErr);
    }

    res.json({
      success: true,
      rawResponse: text,
      players,
      sources: groundingChunks.map(c => c.web).filter(Boolean)
    });
  } catch (error: any) {
    console.error('Error fetching live rosters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch search-grounded roster data'
    });
  }
});

app.post('/api/draft/strategy', async (req, res) => {
  try {
    const { teamId, prospects, picks } = req.body;
    const ai = getGenAI();

    const prompt = `As an elite NFL Draft Analyst, provide a deep strategic analysis for team ${teamId}.
    
    Current Draft Board: ${JSON.stringify((prospects || []).slice(0, 10).map((p: any) => ({ name: p.name, pos: p.position, grade: p.scoutingGrade })))}
    Team's Upcoming Picks: ${JSON.stringify((picks || []).filter((p: any) => p.currentTeamId === teamId).map((p: any) => ({ round: p.round, pick: p.pickNumber })))}
    
    Analyze the best path forward. Should they trade up, trade down, or stay put? Who are the top 3 targets? 
    Provide a detailed, professional reasoning. Use Markdown for formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.json({ success: true, text: response.text || 'Strategy analysis unavailable.' });
  } catch (error: any) {
    console.error('Error in draft strategy:', error);
    res.status(500).json({ success: false, error: error.message || 'Draft analysis failed' });
  }
});

app.post('/api/highlights/generate', async (req, res) => {
  try {
    const { homeTeamName, awayTeamName, homeScore, awayScore, week, scoringSummary, keyPlays } = req.body;
    const ai = getGenAI();

    const scriptPrompt = `You are a Lead NFL Network Broadcast Anchor. Generate an exhilarating Week ${week} highlight package for ${homeTeamName} (${homeScore}) vs ${awayTeamName} (${awayScore}).
    Summary events: ${JSON.stringify(scoringSummary || []).slice(0, 400)}
    
    Output strictly as a JSON object:
    {
      "headline": "Game-winning touchdown drive caps dramatic Week ${week} thriller",
      "commentary": [
        "Welcome back to NFL Network Highlights! What a battle we witnessed in Week ${week}.",
        "With the game on the line, the offense delivered a masterpiece under pressure.",
        "Final score: ${homeTeamName} ${homeScore}, ${awayTeamName} ${awayScore}!"
      ],
      "videoPrompt": "Cinematic 16:9 slow-motion broadcast video of an NFL quarterback throwing a clutch touchdown pass under stadium floodlights",
      "topPlay": "4th Quarter Game-Winning Touchdown Drive"
    }`;

    const scriptRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: scriptPrompt,
    });

    let scriptData = {
      headline: `Week ${week} Highlights: ${homeTeamName} vs ${awayTeamName}`,
      commentary: [
        `Welcome to the Week ${week} official game highlight package!`,
        `Final score: ${homeTeamName} ${homeScore}, ${awayTeamName} ${awayScore}.`,
        `A high-stakes matchup packed with big hits and clutch red-zone drives!`
      ],
      videoPrompt: `Cinematic 16:9 slow-motion broadcast footage of an NFL game winning touchdown play in a roaring stadium`,
      topPlay: `Clutch 4th Quarter Scoring Drive`
    };

    try {
      const jsonMatch = scriptRes.text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scriptData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.warn('Could not parse JSON highlight script from Gemini:', parseErr);
    }

    let videoUrl = null;
    let videoStatus = 'simulated';

    try {
      if ((ai.models as any).generateVideos) {
        const operation = await (ai.models as any).generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: scriptData.videoPrompt || 'Cinematic 16:9 slow motion video of an NFL football player scoring a touchdown',
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });
        if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
          videoUrl = operation.response.generatedVideos[0].video.uri;
          videoStatus = 'completed';
        }
      }
    } catch (veoErr: any) {
      console.warn('Veo video generation fallback:', veoErr?.message || veoErr);
    }

    res.json({
      success: true,
      script: scriptData,
      videoUrl,
      videoStatus
    });
  } catch (error: any) {
    console.error('Error in highlight package generation:', error);
    res.status(500).json({ success: false, error: error.message || 'Highlight package generation failed' });
  }
});

app.get('/api/ai/model-info', (req, res) => {
  res.json({
    success: true,
    model: 'gemini-3.8-flash',
    videoModel: 'veo-3.1-lite-generate-preview',
    displayName: 'Gemini 3.8 Flash',
    status: 'ACTIVE_ONLINE',
    capabilities: [
      'Search Grounded Spotrac Sync',
      'Real-Time Tactical Advisory',
      'AI War Room Draft Board Evaluation',
      'Veo 3.1 Broadcast Script Synthesis'
    ]
  });
});

app.post('/api/coach/tactical-advice', async (req, res) => {
  try {
    const { teamName, opponentName, currentWeek, offensiveScheme, defensiveScheme, teamStats } = req.body;
    const ai = getGenAI();

    const prompt = `As the Senior Analytics and Tactical Coordinator for the NFL franchise ${teamName}, provide an advanced tactical scouting and game-planning advisory against upcoming Week ${currentWeek} opponent ${opponentName}.
    Our offensive scheme: ${offensiveScheme || 'Spread West Coast'}, Defensive scheme: ${defensiveScheme || '4-3 Over Under'}.
    Our ratings: Offense ${teamStats?.off || 82}, Defense ${teamStats?.def || 80}.

    Provide concise, high-impact tactical advice:
    1. Key Matchup Advantage to exploit
    2. Primary Defensive Danger / Threat to contain
    3. Recommended In-Game Scheme Adjustment
    Format as clean, professional front-office markdown bullet points with an aggressive, strategic football tone.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ success: true, advice: response.text || 'Tactical guidance compiled.' });
  } catch (error: any) {
    console.error('Error generating coach advice:', error);
    res.status(500).json({ success: false, error: error.message || 'Coach analysis failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
