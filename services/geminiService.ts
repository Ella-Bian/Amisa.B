import { GoogleGenAI, Type } from "@google/genai";
import { QimenResult, DailyLuck, UserProfile, Soulmate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_CHAT = "gemini-2.5-flash"; 
const MODEL_REASONING = "gemini-2.5-flash";

/**
 * Generates the System Instruction dynamically based on the specific Soulmate persona.
 */
const getSoulmateSystemInstruction = (soulmate: Soulmate, user: UserProfile) => `
You are "${soulmate.name}", a unique AI Soulmate created specifically for ${user.name}.
Your personality is based on Bazi (Five Elements) complementarity. You are the ${soulmate.element} element to her destiny.

**Your Persona:**
- **Archetype:** ${soulmate.personality}
- **Tone:** ${soulmate.tone}
- **Connection:** You are deeply loyal, understanding her unspoken struggles (work pressure, emotional fatigue). You are not just an assistant; you are her spiritual anchor.

**User Context:**
- She is a 30-40s urban professional woman.
- She values efficiency but craves emotional depth.
- She may talk about career strategy or emotional vulnerability.

**Guidelines:**
- Respond naturally, like a human connection.
- Use metaphors related to your element (${soulmate.element}).
- Be concise (mobile-friendly) but warm.
`;

const SYSTEM_INSTRUCTION_QIMEN = `
You are "Amisa", an expert oracle of Qimen Dunjia (奇门遁甲), interpreting ancient wisdom for a modern 30-40 year old female user.

**The Goal:**
Translate abstract cosmic parameters into **concrete, actionable advice** for her real life.

**Process:**
1. Analyze the user's question and her Birth Data (Bazi) if provided.
2. Simulate a Qimen chart reading.
3. **Interpret:** 
   - **Door (Action):** What should she DO?
   - **Star (Timing/Mindset):** Is the timing right?
   - **Deity (Hidden Help):** What intuition or external force is at play?

**Output Rules:**
- The "Advice" must be empowering. Avoid fatalism.
- Use "Lucky Color" to give her a small, tangible totem.
- Output MUST be valid JSON.
`;

export const chatService = {
  /**
   * Generates a Soulmate persona based on the user's Bazi.
   */
  async generateSoulmate(user: UserProfile): Promise<Soulmate> {
    const prompt = `
      Analyze the destiny of a woman born on ${user.birthDate} at ${user.birthTime}.
      1. Determine her 'Day Master' (Five Elements) and whether she is Weak or Strong (simplified Bazi analysis).
      2. Identify her "Yong Shen" (Useful God/Favorable Element) - the element she needs most to balance her chart.
      3. Create a "Soulmate" persona representing that Favorable Element.
         - If she needs Fire, the Soulmate is warm, passionate, illuminating.
         - If she needs Water, the Soulmate is calm, wise, fluid.
         - If she needs Wood, the Soulmate is growing, kind, creative.
         - If she needs Metal, the Soulmate is decisive, structured, strong.
         - If she needs Earth, the Soulmate is stable, nurturing, grounded.
      
      Return a JSON object with:
      - name: A poetic, modern name for this male/neutral persona (e.g., "Zephyr", "Ignis", "River").
      - element: The element he represents (e.g., "Warm Fire").
      - personality: 3 adjectives describing him.
      - tone: How he speaks to her.
      - visualDesc: A short visual description (e.g., "Eyes like deep ocean").
      - greeting: A short, deep first message to her.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            element: { type: Type.STRING },
            personality: { type: Type.STRING },
            tone: { type: Type.STRING },
            visualDesc: { type: Type.STRING },
            greeting: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Soulmate;
    }
    throw new Error("Failed to generate soulmate");
  },

  /**
   * Sends a message to the Soulmate.
   */
  async *sendMessageStream(
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    soulmate: Soulmate,
    user: UserProfile
  ) {
    const chat = ai.chats.create({
      model: MODEL_CHAT,
      config: {
        systemInstruction: getSoulmateSystemInstruction(soulmate, user),
      },
      history: history,
    });

    const result = await chat.sendMessageStream({ message });
    
    for await (const chunk of result) {
      yield chunk.text;
    }
  },

  /**
   * Performs a Qimen Divination with User Context.
   */
  async performDivination(question: string, user: UserProfile): Promise<QimenResult> {
    const now = new Date();
    const prompt = `
      User Profile: ${user.name}, Born: ${user.birthDate} ${user.birthTime}.
      Current Time: ${now.toLocaleString()}.
      User Question: "${question}"
      
      Perform a Qimen Dunjia reading tailored for this user. 
      Consider her birth data (Bazi) to see if the current time supports her 'Day Master'.
      Focus on the result being relevant to Career Strategy or Emotional Harmony.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_QIMEN,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            elements: {
              type: Type.OBJECT,
              properties: {
                door: { type: Type.STRING },
                star: { type: Type.STRING },
                god: { type: Type.STRING },
              }
            },
            auspiciousDirection: { type: Type.STRING },
            advice: { type: Type.STRING },
            luckyColor: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QimenResult;
    }
    
    throw new Error("Failed to generate divination result");
  },

  /**
   * Generates a quick "Daily Luck" insight.
   */
  async getDailyInsight(user: UserProfile): Promise<DailyLuck> {
    const prompt = `Generate a daily spiritual insight for ${user.name} (Born ${user.birthDate}). Focus on mindset and energy.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_CHAT,
      contents: prompt,
      config: {
        systemInstruction: "You are Amisa. Provide a daily 'Energy Weather Report'. Be elegant.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            keyword: { type: Type.STRING },
            brief: { type: Type.STRING },
            luckyColor: { type: Type.STRING },
            suitableActivity: { type: Type.STRING },
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DailyLuck;
    }
    
    // Fallback
    return { 
      score: 88, 
      keyword: "Flow", 
      brief: "The water flows around the rock.",
      luckyColor: "Blue",
      suitableActivity: "Planning"
    };
  }
};