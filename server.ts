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

app.post('/api/rosters/live-search', async (req, res) => {
  try {
    const { teamName, query } = req.body;
    const ai = getGenAI();
    
    const prompt = `Perform a search to find the latest active NFL roster and key depth chart for ${teamName ? `the ${teamName}` : 'top NFL teams'}. ${query ? `Query context: ${query}` : ''}

Output MUST be a JSON array containing top key starters/players in this format:
[
  {
    "name": "Player Name",
    "position": "QB",
    "teamAbbr": "KC",
    "age": 29,
    "overall": 98,
    "depth": 1,
    "notes": "Starter, 2025/2026 roster"
  }
]
Valid positions: QB, RB, WR, TE, OL, DL, LB, CB, S, K.
Ensure high accuracy using latest search results. Respond ONLY with the JSON array inside a json block.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
      model: 'gemini-3.5-flash',
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
      model: 'gemini-3.5-flash',
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
          model: 'veo-3.1-fast-generate-preview',
          prompt: scriptData.videoPrompt || 'Cinematic 16:9 slow motion video of an NFL football player scoring a touchdown',
          config: {
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
