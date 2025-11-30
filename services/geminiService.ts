import { QimenResult, DailyLuck, UserProfile, Soulmate } from "../types";
import { siliconFlowService } from "./siliconFlowService";

/**
 * 辅助函数：根据五行元素返回视觉风格描述
 */
function getElementVisualStyle(element: string): string {
  const elementLower = element.toLowerCase();
  if (elementLower.includes('fire') || elementLower.includes('火')) {
    return 'warm colors, passionate energy, golden and red tones, bright and illuminating';
  } else if (elementLower.includes('water') || elementLower.includes('水')) {
    return 'cool colors, flowing energy, blue and silver tones, calm and serene';
  } else if (elementLower.includes('wood') || elementLower.includes('木')) {
    return 'nature colors, growing energy, green and brown tones, fresh and vibrant';
  } else if (elementLower.includes('metal') || elementLower.includes('金')) {
    return 'metallic colors, structured energy, silver and white tones, sharp and precise';
  } else if (elementLower.includes('earth') || elementLower.includes('土')) {
    return 'earth tones, stable energy, brown and yellow tones, grounded and nurturing';
  }
  return 'mystical and balanced colors';
}

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
  async generateSoulmate(user: UserProfile, token: string): Promise<Soulmate> {
    console.log('[chatService] generateSoulmate called', { userName: user.name, hasToken: !!token });
    
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
      
      IMPORTANT: You must return ONLY valid JSON, no other text.
    `;

    const systemInstruction = `You are an expert in Bazi (Chinese astrology) analysis. You must respond with valid JSON only, no additional text or markdown formatting.`;

    console.log('[chatService] Calling SiliconFlow API...');
    const response = await siliconFlowService.chatCompletion(
      [{ role: 'user', content: prompt }],
      token,
      systemInstruction
    );
    console.log('[chatService] Received response from API, length:', response.length);

    // Try to extract JSON from response (in case it's wrapped in markdown)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    console.log('[chatService] Parsing JSON response...');
    try {
      const soulmate = JSON.parse(jsonText) as Soulmate;
      console.log('[chatService] Successfully parsed soulmate:', soulmate);

      // 生成图像
      try {
        console.log('[chatService] Generating soulmate image...');
        
        // 根据五行元素和描述构建图像提示词
        const imagePrompt = `
          A mystical and elegant portrait avatar of ${soulmate.name}, 
          representing the ${soulmate.element} element in Chinese Five Elements philosophy.
          ${soulmate.visualDesc}
          Personality traits: ${soulmate.personality}
          Style: Modern anime-inspired character portrait, ethereal atmosphere, 
          soft cinematic lighting, mystical aura, centered composition, close-up portrait.
          The artwork should embody the essence of ${soulmate.element} element - 
          ${getElementVisualStyle(soulmate.element)}.
          Square format, high quality, detailed.
        `;
        
        const imageUrl = await siliconFlowService.generateImage(imagePrompt, token);
        soulmate.imageUrl = imageUrl;
        console.log('[chatService] Soulmate image generated successfully');
      } catch (error) {
        console.error('[chatService] Failed to generate soulmate image:', error);
        // 图像生成失败不影响整体流程，可以设置一个默认头像或留空
        soulmate.imageUrl = undefined;
      }

      return soulmate;
    } catch (e) {
      console.error("[chatService] Failed to parse soulmate JSON:", jsonText);
      console.error("[chatService] Parse error:", e);
      throw new Error("Failed to generate soulmate: Invalid JSON response");
    }
  },

  /**
   * Sends a message to the Soulmate.
   */
  async *sendMessageStream(
    history: {role: string, parts: {text: string}[]}[], 
    message: string, 
    soulmate: Soulmate,
    user: UserProfile,
    token: string
  ) {
    // Convert history format to SiliconFlow format
    const messages = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant' as const,
      content: h.parts[0]?.text || ''
    }));

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    const systemInstruction = getSoulmateSystemInstruction(soulmate, user);

    const stream = siliconFlowService.chatCompletionStream(
      messages,
      token,
      systemInstruction
    );
    
    for await (const chunk of stream) {
      yield chunk;
    }
  },

  /**
   * Performs a Qimen Divination with User Context.
   */
  async performDivination(question: string, user: UserProfile, token: string): Promise<QimenResult> {
    const now = new Date();
    const prompt = `
      User Profile: ${user.name}, Born: ${user.birthDate} ${user.birthTime}.
      Current Time: ${now.toLocaleString()}.
      User Question: "${question}"
      
      Perform a Qimen Dunjia reading tailored for this user. 
      Consider her birth data (Bazi) to see if the current time supports her 'Day Master'.
      Focus on the result being relevant to Career Strategy or Emotional Harmony.
      
      Return a JSON object with:
      - summary: A brief summary of the reading
      - elements: An object with door (string), star (string), god (string)
      - auspiciousDirection: A direction (e.g., "North", "East")
      - advice: Strategic advice for the user
      - luckyColor: A lucky color (e.g., "Emerald Green")
      
      IMPORTANT: You must return ONLY valid JSON, no other text.
    `;

    const response = await siliconFlowService.chatCompletion(
      [{ role: 'user', content: prompt }],
      token,
      SYSTEM_INSTRUCTION_QIMEN + "\n\nYou must respond with valid JSON only, no additional text or markdown formatting."
    );

    // Try to extract JSON from response (in case it's wrapped in markdown)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    try {
      return JSON.parse(jsonText) as QimenResult;
    } catch (e) {
      console.error("Failed to parse divination JSON:", jsonText);
      throw new Error("Failed to generate divination result: Invalid JSON response");
    }
  },

  /**
   * Generates a quick "Daily Luck" insight.
   */
  async getDailyInsight(user: UserProfile, token: string): Promise<DailyLuck> {
    const prompt = `Generate a daily spiritual insight for ${user.name} (Born ${user.birthDate}). Focus on mindset and energy.
    
    Return a JSON object with:
    - score: A number between 0-100 representing daily fortune
    - keyword: A single word or short phrase (e.g., "Clarity", "Flow")
    - brief: A one-sentence fortune or insight
    - luckyColor: A color name (e.g., "Emerald Green", "Blue")
    - suitableActivity: An activity recommendation (e.g., "Negotiation", "Meditation", "Tidying")
    
    IMPORTANT: You must return ONLY valid JSON, no other text.`;
    
    const systemInstruction = "You are Amisa. Provide a daily 'Energy Weather Report'. Be elegant. You must respond with valid JSON only, no additional text or markdown formatting.";

    try {
      const response = await siliconFlowService.chatCompletion(
        [{ role: 'user', content: prompt }],
        token,
        systemInstruction
      );

      // Try to extract JSON from response (in case it's wrapped in markdown)
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }

      return JSON.parse(jsonText) as DailyLuck;
    } catch (e) {
      console.error("Failed to generate daily insight:", e);
      // Fallback
      return { 
        score: 88, 
        keyword: "Flow", 
        brief: "The water flows around the rock.",
        luckyColor: "Blue",
        suitableActivity: "Planning"
      };
    }
  }
};