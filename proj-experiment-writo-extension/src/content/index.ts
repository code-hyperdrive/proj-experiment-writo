import { ActionType, SelectionContext, ExtensionMessage } from '../shared/types';
import { replaceSelectedText } from './textReplacer';

let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let currentContext: SelectionContext | null = null;
let isMenuOpen = false;
let isGenerating = false;
let currentRequestId = '';
let activeOriginalText = '';
let activeStreamedText = '';

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  hostElement = document.createElement('writo-extension-pill');
  hostElement.id = '__writo_pill_root__';
  hostElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  
  shadowRoot = hostElement.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .writo-pill-container {
      position: absolute;
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      user-select: none;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: writoFadeIn 0.15s ease-out;
    }
    @keyframes writoFadeIn {
      from { opacity: 0; transform: translateY(4px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .writo-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0f172a;
      color: #f8fafc;
      padding: 6px 12px;
      border-radius: 9999px;
      box-shadow: 0 4px 16px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
      border: 1px solid #334155;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .writo-pill:hover {
      background: #1e293b;
      border-color: #0e8ceb;
      box-shadow: 0 4px 20px -1px rgba(14, 140, 235, 0.35);
      transform: translateY(-1px);
    }
    .writo-menu {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 200px;
    }
    .writo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      color: #cbd5e1;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.12s ease;
    }
    .writo-item:hover {
      background: #1e293b;
      color: #f8fafc;
    }
    .writo-item.active {
      color: #38a9f7;
      font-weight: 600;
    }
    .writo-stop-btn {
      background: #334155;
      color: #f8fafc;
      border: none;
      border-radius: 9999px;
      padding: 2px 6px;
      margin-left: 4px;
      font-size: 10px;
      cursor: pointer;
    }
    .writo-stop-btn:hover {
      background: #ef4444;
    }
  `;

  shadowRoot.appendChild(style);
  document.body.appendChild(hostElement);
  return shadowRoot;
}

// Inspect current selection on page
function getSelectionContext(): SelectionContext | null {
  const activeEl = document.activeElement as HTMLElement | null;
  const winSelection = window.getSelection();

  // 1. Textarea or Input
  if (activeEl && (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement)) {
    const start = activeEl.selectionStart ?? 0;
    const end = activeEl.selectionEnd ?? 0;
    const fullText = activeEl.value || '';
    const selectedText = fullText.substring(start, end).trim();

    if (selectedText.length > 1) {
      const rect = activeEl.getBoundingClientRect();
      return {
        isContentEditable: false,
        selectedText,
        fullText,
        boundingRect: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          bottom: rect.bottom + window.scrollY,
          right: rect.right + window.scrollX,
          width: rect.width,
          height: rect.height,
        },
        startOffset: start,
        endOffset: end,
        targetElement: activeEl,
      };
    }
  }

  // 2. Contenteditable / Rich Text / Webpage Selection
  if (winSelection && winSelection.rangeCount > 0 && !winSelection.isCollapsed) {
    const range = winSelection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (selectedText.length > 1) {
      const rect = range.getBoundingClientRect();
      const parent = range.commonAncestorContainer.parentElement;

      return {
        isContentEditable: Boolean(parent?.closest('[contenteditable="true"]')),
        selectedText,
        fullText: parent?.innerText || selectedText,
        boundingRect: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          bottom: rect.bottom + window.scrollY,
          right: rect.right + window.scrollX,
          width: rect.width,
          height: rect.height,
        },
        range: range.cloneRange(),
        targetElement: parent?.closest('[contenteditable="true"]') as HTMLElement || parent,
      };
    }
  }

  return null;
}

// Render floating pill UI
function renderUI() {
  const root = ensureShadowHost();
  const existingContainer = root.querySelector('.writo-pill-container');
  if (existingContainer) existingContainer.remove();

  if (!currentContext && !isGenerating) return;

  const container = document.createElement('div');
  container.className = 'writo-pill-container';

  if (currentContext) {
    const top = Math.max(10, currentContext.boundingRect.top - 42);
    const left = Math.min(window.innerWidth - 220, Math.max(10, currentContext.boundingRect.left));
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
  }

  if (isGenerating) {
    container.innerHTML = `
      <div class="writo-pill">
        <span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span>
        <span>Polishing with Writo AI...</span>
        <button class="writo-stop-btn" id="writo-cancel-btn" title="Cancel generation">✕</button>
      </div>
    `;

    container.querySelector('#writo-cancel-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      cancelGeneration();
    });

    root.appendChild(container);
    return;
  }

  if (!isMenuOpen) {
    const wordCount = currentContext?.selectedText.split(/\s+/).length || 0;
    container.innerHTML = `
      <div class="writo-pill" id="writo-trigger-btn">
        <span style="color:#38a9f7;font-size:14px;">✨</span>
        <span style="font-weight:600;letter-spacing:-0.01em;">Writo</span>
        <span style="opacity:0.5;font-size:11px;">(${wordCount}w)</span>
      </div>
    `;

    container.querySelector('#writo-trigger-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMenuOpen = true;
      renderUI();
    });
  } else {
    container.innerHTML = `
      <div class="writo-menu">
        <div class="writo-item" data-action="improve">
          <span>✨ Improve Writing</span>
          <span style="opacity:0.5;font-size:10px;font-family:monospace;">Cmd+Enter</span>
        </div>
        <div class="writo-item" data-action="grammar">
          <span>✓ Fix Grammar</span>
        </div>
        <div class="writo-item" data-action="professional">
          <span>💼 Professional Tone</span>
        </div>
        <div class="writo-item" data-action="simplify">
          <span>🪶 Simplify</span>
        </div>
        <div class="writo-item" data-action="concise">
          <span>✂ Make Concise</span>
        </div>
        <div style="height:1px;background:#1e293b;margin:4px 0;"></div>
        <div class="writo-item" data-action="sidepanel">
          <span>📖 Open Side Panel</span>
          <span style="opacity:0.5;font-size:10px;">Full Workspace</span>
        </div>
      </div>
    `;

    container.querySelectorAll('.writo-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (item as HTMLElement).dataset.action;
        if (!action) return;

        if (action === 'sidepanel') {
          chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
          isMenuOpen = false;
          renderUI();
          return;
        }

        executeWritingAction(action as ActionType);
      });
    });
  }

  root.appendChild(container);
}

function cancelGeneration() {
  if (isGenerating && currentRequestId) {
    chrome.runtime.sendMessage({
      type: 'CANCEL_ACTION',
      requestId: currentRequestId,
    });
  }
  isGenerating = false;
  renderUI();
}

// Execute writing transformation
function executeWritingAction(action: ActionType, textOverride?: string) {
  const targetText = textOverride || currentContext?.selectedText;
  if (!targetText) return;

  activeOriginalText = targetText;
  activeStreamedText = '';
  isGenerating = true;
  isMenuOpen = false;
  currentRequestId = `req-${Date.now()}`;
  renderUI();

  chrome.runtime.sendMessage({
    type: 'EXECUTE_ACTION',
    requestId: currentRequestId,
    payload: {
      action,
      text: activeOriginalText,
    },
  });
}

// Listen for streaming tokens and commands from background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'STREAM_TOKEN' && message.requestId === currentRequestId) {
    const payload = message.payload as { chunk: string; fullText: string; isDone: boolean; error?: string };
    
    if (payload.error) {
      alert(`Writo AI Error: ${payload.error}`);
      isGenerating = false;
      renderUI();
      return;
    }

    if (payload.fullText) {
      activeStreamedText = payload.fullText;
    }

    if (payload.isDone) {
      isGenerating = false;
      if (currentContext && activeStreamedText.trim()) {
        replaceSelectedText(currentContext, activeStreamedText.trim());
      }
      currentContext = null;
      renderUI();
    }
  }

  // Handle command shortcut (Cmd+Shift+I) or context menu action
  if (message.type === 'EXECUTE_ACTION') {
    const payload = message.payload as { action: ActionType; text?: string };
    const ctx = getSelectionContext();
    if (ctx) {
      currentContext = ctx;
    }
    if (currentContext || payload.text) {
      executeWritingAction(payload.action, payload.text);
    }
    sendResponse({ started: true });
    return true;
  }

  // Answer Side Panel inquiry for active selection
  if (message.type === 'GET_ACTIVE_SELECTION') {
    const ctx = getSelectionContext();
    const selText = ctx?.selectedText || window.getSelection()?.toString().trim() || '';
    sendResponse({ selectedText: selText });
    return true;
  }

  // Apply revised text from Side Panel back to the webpage
  if (message.type === 'APPLY_TO_ACTIVE_PAGE') {
    const newText = (message.payload as { text: string })?.text;
    if (newText) {
      const ctx = currentContext || getSelectionContext();
      if (ctx) {
        replaceSelectedText(ctx, newText);
      } else {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLInputElement) {
          activeEl.focus();
          document.execCommand('insertText', false, newText);
        }
      }
    }
    sendResponse({ applied: true });
    return true;
  }
});

// Event listeners for text selections
document.addEventListener('mouseup', () => {
  setTimeout(() => {
    if (isGenerating) return;
    const ctx = getSelectionContext();
    if (ctx && ctx.selectedText.length > 1) {
      currentContext = ctx;
      renderUI();
    } else if (!isMenuOpen) {
      currentContext = null;
      renderUI();
    }
  }, 10);
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Escape') {
    if (isGenerating) {
      cancelGeneration();
    } else {
      isMenuOpen = false;
      currentContext = null;
      renderUI();
    }
  }
});

document.addEventListener('mousedown', (e) => {
  if (hostElement && e.composedPath().includes(hostElement)) {
    return;
  }
  if (isMenuOpen) {
    isMenuOpen = false;
    renderUI();
  }
});
