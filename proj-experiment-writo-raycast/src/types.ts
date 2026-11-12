export type ActionType = 'improve' | 'professional' | 'simplify' | 'grammar' | 'concise';

export interface ActionConfig {
  id: ActionType;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  promptTemplate: (text: string) => string;
}

export interface ExtensionPreferences {
  provider?: 'ollama' | 'openai' | 'gemini';
  ollamaHost?: string;
  ollamaModel?: string;
  apiKey?: string;
  apiEndpoint?: string;
  cloudModel?: string;
}

export interface RewriteResult {
  original: string;
  rewritten: string;
  actionId: ActionType | 'custom';
  actionLabel: string;
  tokens?: number;
  durationMs?: number;
}
