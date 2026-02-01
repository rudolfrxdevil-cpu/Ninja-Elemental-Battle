import { GoogleGenAI } from "@google/genai";
import { NinjaColor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSenseiWisdom = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, wise, and slightly cryptic proverb in the style of Sensei Wu from Ninjago. It should be about patience, balance, or element power. Maximum 2 sentences.",
    });
    return response.text || "Patience is the key to unlocking your true potential.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The path to victory is paved with practice.";
  }
};

export const getBattleCommentary = async (winnerName: string, loserName: string, playerHealth: number): Promise<string> => {
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
    return response.text || `${winnerName} has defeated ${loserName} in a spectacular duel!`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The battle is over. A new champion rises!";
  }
};