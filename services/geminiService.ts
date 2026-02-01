import { GoogleGenAI } from "@google/genai";
import { NinjaColor } from "../types";

// Static fallbacks in case API Key is missing or request fails
const WISDOM_FALLBACKS = [
  "Patience is the key to unlocking your true potential.",
  "The path to victory is paved with practice.",
  "A ninja never quits, and quitters never win.",
  "Iron sharpens iron, and brother sharpens brother.",
  "The best way to defeat an enemy is to make them your friend.",
  "Even in the dark, there is light.",
  "Balance is not something you find, it is something you create."
];

const COMMENTARY_TEMPLATES = [
  "{winner} has defeated {loser} in a spectacular duel!",
  "A crushing victory for {winner}!",
  "{winner} proves to be the ultimate master of Spinjitzu.",
  "What an incredible match! {winner} stands victorious.",
  "{loser} fought bravely, but {winner} was too strong today.",
  "Flawless technique from {winner} secures the win."
];

// Initialize AI only if key is present to avoid immediate crash
let ai: GoogleGenAI | null = null;

// Safely check for API key
const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY ? process.env.API_KEY : null;

if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey: apiKey });
    } catch (e) {
        console.warn("Failed to initialize GoogleGenAI, falling back to offline mode.");
    }
}

export const getSenseiWisdom = async (): Promise<string> => {
  if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Generate a short, wise, and slightly cryptic proverb in the style of Sensei Wu from Ninjago. It should be about patience, balance, or element power. Maximum 2 sentences.",
        });
        return response.text || getRandomWisdom();
      } catch (error) {
        console.warn("Gemini API Error (Wisdom):", error);
        return getRandomWisdom();
      }
  }
  // Simulate network delay for effect if offline
  await new Promise(r => setTimeout(r, 500));
  return getRandomWisdom();
};

export const getBattleCommentary = async (winnerName: string, loserName: string, playerHealth: number): Promise<string> => {
  if (ai) {
      try {
        const prompt = `
          Write a short, exciting battle summary (max 3 sentences) for a fighting game.
          The winner is ${winnerName} and the loser is ${loserName}.
          The winner had ${Math.round(playerHealth)}% health remaining.
          If health is high (>80%), call it a flawless victory.
          If health is low (<20%), call it a close call.
          Mention their elements if known.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        return response.text || getFallbackCommentary(winnerName, loserName);
      } catch (error) {
        console.warn("Gemini API Error (Commentary):", error);
        return getFallbackCommentary(winnerName, loserName);
      }
  }
  // Simulate network delay for effect if offline
  await new Promise(r => setTimeout(r, 500));
  return getFallbackCommentary(winnerName, loserName);
};

const getRandomWisdom = () => {
    return WISDOM_FALLBACKS[Math.floor(Math.random() * WISDOM_FALLBACKS.length)];
}

const getFallbackCommentary = (winner: string, loser: string) => {
    const template = COMMENTARY_TEMPLATES[Math.floor(Math.random() * COMMENTARY_TEMPLATES.length)];
    return template.replace(/{winner}/g, winner).replace(/{loser}/g, loser);
}