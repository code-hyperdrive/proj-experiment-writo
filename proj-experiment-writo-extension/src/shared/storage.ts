import { WritoExtensionSettings, ModelTier } from './types';
import { DEFAULT_TIER } from './models';

const DEFAULT_SETTINGS: WritoExtensionSettings = {
  selectedTier: DEFAULT_TIER,
  inlineAssistantEnabled: true,
  sidePanelAutoOpen: false,
  theme: 'system',
};

export async function getSettings(): Promise<WritoExtensionSettings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_SETTINGS);
      return;
    }
    chrome.storage.sync.get('writo_settings', (res) => {
      if (res && res.writo_settings) {
        resolve({ ...DEFAULT_SETTINGS, ...res.writo_settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

export async function saveSettings(settings: Partial<WritoExtensionSettings>): Promise<WritoExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(updated);
      return;
    }
    chrome.storage.sync.set({ writo_settings: updated }, () => {
      resolve(updated);
    });
  });
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(false);
      return;
    }
    chrome.storage.local.get(`writo_cached_${modelId}`, (res) => {
      resolve(Boolean(res && res[`writo_cached_${modelId}`]));
    });
  });
}

export async function markModelDownloaded(modelId: string, isDownloaded: boolean = true): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set({ [`writo_cached_${modelId}`]: isDownloaded }, () => {
      resolve();
    });
  });
}

