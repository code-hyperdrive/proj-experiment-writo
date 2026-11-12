export type ModelTier = 'low' | 'mid' | 'high';

export type ActionType = 'improve' | 'professional' | 'simplify' | 'grammar' | 'concise';

export type EngineStatus =
  | 'unloaded'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error'
  | 'fallback';

export interface ModelTierConfig {
  tier: ModelTier;
  id: string;
  name: string;
  family?: string;
  badge: string;
  sizeMB: number;
  vramMB: number;
  description: string;
  recommended?: boolean;
}

export interface LoadingProgress {
  progress: number;
  text: string;
  timeElapsed?: number;
}

export interface GenerationStats {
  tokens: number;
  tokensPerSecond: number;
  totalTimeMs: number;
}

export interface SelectionContext {
  targetElementId?: string;
  isContentEditable: boolean;
  selectedText: string;
  fullText: string;
  boundingRect: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
  };
  startOffset?: number;
  endOffset?: number;
  targetElement?: HTMLElement | null;
  range?: Range | null;
}

export interface ActionConfig {
  id: ActionType;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  promptTemplate: (text: string) => string;
}

export interface WritoExtensionSettings {
  selectedTier: ModelTier;
  inlineAssistantEnabled: boolean;
  sidePanelAutoOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export type ExtensionMessageType =
  | 'GET_STATUS'
  | 'STATUS_RESPONSE'
  | 'DOWNLOAD_MODEL'
  | 'PROGRESS_UPDATE'
  | 'EXECUTE_ACTION'
  | 'STREAM_TOKEN'
  | 'CANCEL_ACTION'
  | 'OPEN_SIDEPANEL'
  | 'GET_ACTIVE_SELECTION'
  | 'APPLY_TO_ACTIVE_PAGE'
  | 'PAGE_TEXT_CAPTURED';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
  requestId?: string;
}

