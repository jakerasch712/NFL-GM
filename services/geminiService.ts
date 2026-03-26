import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Player, Position, DraftProspect, DraftPick } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. AI features require an API key.");
  return new GoogleGenAI({ apiKey });
};

export const syncTeamRoster = async (teamName: string): Promise<Player[]> => {
  const prompt = `Fetch the current 2024/2025/2026 active roster for the ${teamName}. 
  Return a JSON array of players with the following fields: 
  name, position (QB, RB, WR, TE, OL, DL, LB, CB, S, K), age, overall (estimate based on current status), archetype, scheme.
  
  Only include key starters and notable players (around 10-15 players).`;

  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            position: { type: Type.STRING, enum: Object.values(Position) },
            age: { type: Type.NUMBER },
            overall: { type: Type.NUMBER },
            archetype: { type: Type.STRING },
            scheme: { type: Type.STRING },
          },
          required: ["name", "position", "age", "overall", "archetype", "scheme"],
        },
      },
    },
  });

  try {
    const playersData = JSON.parse(response.text || "[]");
    return playersData.map((p: any, index: number) => ({
      ...p,
      id: `sync-${Date.now()}-${index}`,
      morale: 85,
      fatigue: 100,
      developmentTrait: p.overall > 90 ? 'X-Factor' : p.overall > 85 ? 'Superstar' : 'Star',
      potential: p.overall > 85 ? 'Superstar' : 'Star',
      stats: { gamesPlayed: 0 },
      schemeOvr: p.overall + (Math.random() > 0.5 ? 2 : -1),
      contract: {
        years: 3,
        salary: 5,
        bonus: 10,
        guaranteed: 15,
        yearsLeft: 2,
        totalValue: 25,
        capHit: 8,
        deadCap: 5,
        voidYears: 0,
        startYear: 2024,
        totalLength: 3
      },
      teamId: '' // To be filled by caller
    }));
  } catch (e) {
    console.error("Failed to parse roster sync data", e);
    return [];
  }
};

export const getDraftStrategy = async (
  teamId: string, 
  prospects: DraftProspect[], 
  picks: DraftPick[]
): Promise<string> => {
  const prompt = `As an elite NFL Draft Analyst, provide a deep strategic analysis for the ${teamId}.
  
  Current Draft Board: ${JSON.stringify(prospects.slice(0, 10).map(p => ({ name: p.name, pos: p.position, grade: p.scoutingGrade })))}
  Team's Upcoming Picks: ${JSON.stringify(picks.filter(p => p.currentTeamId === teamId).map(p => ({ round: p.round, pick: p.pickNumber })))}
  
  Analyze the best path forward. Should they trade up, trade down, or stay put? Who are the top 3 targets? 
  Provide a detailed, professional reasoning. Use Markdown for formatting.`;

  const response = await getAI().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    },
  });

  return response.text || "Strategy analysis unavailable.";
};
