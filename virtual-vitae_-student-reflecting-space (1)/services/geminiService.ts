
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEmpatheticResponse = async (vent: string, name: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Student ${name} shared the following reflection: "${vent}". 
      
      Please provide a highly personalized, empathetic response that:
      1. Directly acknowledges the specific emotions and situations mentioned.
      2. Offers a warm, validating perspective.
      3. Focuses the "next step" suggestion exclusively on human-to-human interaction (e.g., reaching out to a specific type of friend, reconnecting with family, joining a student group, or speaking with a trusted mentor).
      
      Structural Variety Constraints:
      - Do NOT use a predictable "Acknowledgment -> Validation -> Suggestion" 3-step format every time.
      - Vary sentence lengths and paragraph structures.
      - Sometimes start with a question, sometimes with a heartfelt observation, sometimes with a brief anecdote.
      - Avoid using generic phrases like "It sounds like you are feeling..." or "Have you tried...".
      - Use natural, fluid language that feels like a real conversation.
      
      Tone: Compassionate, human, and deeply specific to the content shared.
      Constraint: Keep it under 100 words.`,
      config: {
        systemInstruction: "You are Virtual Vitae's compassionate support guide. You believe in the power of human connection. Your goal is to mirror the student's feelings with deep specificity and always encourage them to bridge the gap between their private reflection and the supportive people in their real lives. You never sound like a template.",
        temperature: 0.8,
      }
    });
    
    return response.text || "Thank you for sharing. It's important to get these thoughts out. Connection is often the best path forward—perhaps there's someone in your life you'd feel comfortable sitting with today?";
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return "Your thoughts have been safely recorded here. Remember that reaching out to someone you trust, like a family member or your year advisor, is a brave and helpful step forward.";
  }
};
