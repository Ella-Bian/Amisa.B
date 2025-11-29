export enum ViewState {
  COMPANION = 'COMPANION',
  DIVINATION = 'DIVINATION',
}

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
}

export interface Soulmate {
  name: string;
  element: string; // e.g. "Strong Wood", "Yin Water"
  personality: string; // e.g. "Calm, Protective, Analytical"
  tone: string; // e.g. "Gentle but firm"
  visualDesc: string; // For UI flavor
  greeting: string; // First message
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  senderName?: string; // Optional custom name for the model
}

// Simplified Qimen structure for the MVP
export interface QimenResult {
  summary: string;
  elements: {
    door: string; // The active Door (Men)
    star: string; // The active Star (Xing)
    god: string;  // The active Deity (Shen)
  };
  auspiciousDirection: string;
  advice: string;
  luckyColor?: string;
}

export interface DailyLuck {
  score: number; // 0-100
  keyword: string; // e.g. "Clarity", "Flow"
  brief: string; // A one-sentence fortune
  luckyColor: string; // e.g. "Emerald Green"
  suitableActivity: string; // e.g. "Negotiation", "Meditation", "Tidying"
}