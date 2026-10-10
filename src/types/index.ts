export type ActionType = 
  | 'improve'
  | 'grammar'
  | 'professional'
  | 'simplify'
  | 'concise';

export interface ActionConfig {
  id: ActionType;
  label: string;
  description: string;
  icon: string;
  keyboardShortcut?: string;
  promptTemplate: (userText: string) => string;
}

export interface ModelOption {
  id: string;
  name: string;
  family: string;
  sizeMB: number;
  vramMB: number;
  description: string;
  recommended?: boolean;
}

export interface NetworkInfo {
  speedMbps: number;
  tier: 'fast' | 'moderate' | 'slow';
  saveData: boolean;
  recommendationReason?: string;
  isTesting: boolean;
}

export type EngineStatus = 
  | 'unloaded'
  | 'checking-webgpu'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error'
  | 'fallback';

export interface LoadingProgress {
  progress: number; // 0 to 1
  text: string;
  timeElapsed?: number;
}

export interface GenerationStats {
  tokens: number;
  tokensPerSecond: number;
  totalTimeMs: number;
}

export interface TextMetrics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  readingTimeMinutes: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  text: string;
  actionLabel: string;
  words: number;
  characters: number;
}
