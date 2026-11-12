import { ActionType, ModelTier } from '../shared/types';
import { getSettings } from '../shared/storage';

const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/index.html';

// Ensure the offscreen document is alive to execute WebGPU inference
async function ensureOffscreenDocument(): Promise<void> {
  if (typeof chrome.offscreen === 'undefined') return;

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existingContexts.length > 0) {
    return;
  }

  const reason = (chrome.offscreen?.Reason?.WORKERS || chrome.offscreen?.Reason?.BLOBS || 'BLOBS') as chrome.offscreen.Reason;

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
    reasons: [reason],
    justification: 'Execute WebGPU in-browser local LLM inference for Writo',
  });
}

// Setup context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'writo-parent',
      title: 'Writo AI Assistant',
      contexts: ['selection', 'editable'],
    });

    chrome.contextMenus.create({
      id: 'writo-improve',
      parentId: 'writo-parent',
      title: '✨ Improve Writing',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'writo-grammar',
      parentId: 'writo-parent',
      title: '✓ Fix Grammar & Spelling',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'writo-professional',
      parentId: 'writo-parent',
      title: '💼 Professional Tone',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'writo-concise',
      parentId: 'writo-parent',
      title: '✂ Make Concise',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'writo-sidepanel',
      parentId: 'writo-parent',
      title: '📖 Open in Side Panel (Full Editor)',
      contexts: ['selection', 'editable', 'page'],
    });
  });
});

// Context menu click dispatcher
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'writo-sidepanel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
    if (info.selectionText) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'PAGE_TEXT_CAPTURED',
        payload: { text: info.selectionText },
      }).catch(() => {});
    }
    return;
  }

  const actionMap: Record<string, ActionType> = {
    'writo-improve': 'improve',
    'writo-grammar': 'grammar',
    'writo-professional': 'professional',
    'writo-concise': 'concise',
  };

  const action = actionMap[info.menuItemId as string];
  if (action && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXECUTE_ACTION',
      payload: { action, text: info.selectionText },
    }).catch(() => {});
  }
});

// Keyboard commands listener
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;

  if (command === 'open-sidepanel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } else if (command === 'quick-improve') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXECUTE_ACTION',
      payload: { action: 'improve' },
    }).catch(() => {});
  }
});

// Router for messages between content scripts, sidepanel, popup, and offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Ignore messages already targeted to offscreen or responses to avoid loops
  if (message.target === 'offscreen' || message.target === 'client') {
    return false;
  }

  // If request requires WebGPU offscreen worker, ensure it exists and forward with target: 'offscreen'
  if (message.type === 'DOWNLOAD_MODEL' || message.type === 'EXECUTE_ACTION' || message.type === 'GET_STATUS') {
    ensureOffscreenDocument()
      .then(async () => {
        if (message.type === 'EXECUTE_ACTION') {
          const settings = await getSettings();
          const tier: ModelTier = message.payload?.tier || settings.selectedTier;
          chrome.runtime.sendMessage({
            ...message,
            target: 'offscreen',
            payload: { ...message.payload, tier },
          });
        } else {
          chrome.runtime.sendMessage({
            ...message,
            target: 'offscreen',
          });
        }
      })
      .catch((err) => console.error('[Writo Background] Offscreen document error:', err));

    sendResponse({ routed: true });
    return true;
  }

  // Forward token chunks to the tab that requested it
  if (message.type === 'STREAM_TOKEN') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {});
      }
    });
  }

  // Handle side panel opening from in-page floating pill
  if (message.type === 'OPEN_SIDEPANEL') {
    const tabId = sender.tab?.id;
    if (tabId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId }).catch(() => {});
    }
    sendResponse({ opened: true });
    return true;
  }
});
