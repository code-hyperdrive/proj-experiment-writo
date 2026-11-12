import { CreateMLCEngine, MLCEngine, InitProgressReport, hasModelInCache } from '@mlc-ai/web-llm';
import { EngineStatus, LoadingProgress, ModelTier, ActionType, GenerationStats } from '../shared/types';
import { getModelConfig } from '../shared/models';
import { SYSTEM_PROMPT, ACTION_CONFIGS } from '../shared/prompts';
import { markModelDownloaded } from '../shared/storage';

let engine: MLCEngine | null = null;
let currentLoadedModelId: string | null = null;
let currentEngineStatus: EngineStatus = 'unloaded';
let currentProgress: LoadingProgress = { progress: 0, text: '' };
let activeAbortController: AbortController | null = null;
let isCurrentlyLoading = false;

// Request persistent storage so Chrome never evicts model weights on memory pressure
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

async function checkWebGPU(): Promise<{ supported: boolean; reason?: string }> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return { supported: false, reason: 'WebGPU is not supported in this Chrome installation.' };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false, reason: 'No compatible WebGPU hardware adapter found.' };
    }
    return { supported: true };
  } catch (e) {
    return { supported: false, reason: e instanceof Error ? e.message : 'WebGPU check failed' };
  }
}

// Split large documents into safe, paragraph-aware chunks to avoid WebGPU VRAM buffer limits
function splitIntoManageableChunks(text: string, maxWordsPerChunk: number = 180): string[] {
  const totalWords = text.trim().split(/\s+/).length;
  if (totalWords <= maxWordsPerChunk) {
    return [text.trim()];
  }

  // 1. Try splitting by double newlines (paragraphs)
  const rawParagraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/);
    if (words.length <= maxWordsPerChunk) {
      chunks.push(trimmed);
    } else {
      // 2. Long paragraph: split by sentence boundaries
      const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmed];
      let currentChunk = '';

      for (const sentence of sentences) {
        const sentenceWords = sentence.trim().split(/\s+/).length;
        const currentWords = currentChunk ? currentChunk.split(/\s+/).length : 0;

        if (currentWords + sentenceWords > maxWordsPerChunk && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

// Notify popup and sidepanel of status updates
function broadcastStatus(status: EngineStatus, extra?: Record<string, unknown>) {
  currentEngineStatus = status;
  chrome.runtime.sendMessage({
    type: 'STATUS_RESPONSE',
    target: 'client',
    payload: {
      status,
      modelId: currentLoadedModelId,
      progress: currentProgress,
      ...extra,
    },
  }).catch(() => {});
}

function broadcastProgress(report: InitProgressReport) {
  currentProgress = {
    progress: report.progress,
    text: report.text,
    timeElapsed: report.timeElapsed,
  };
  chrome.runtime.sendMessage({
    type: 'PROGRESS_UPDATE',
    target: 'client',
    payload: currentProgress,
  }).catch(() => {});
}

async function loadModel(tier: ModelTier): Promise<boolean> {
  const modelConfig = getModelConfig(tier);
  const targetId = modelConfig.id;

  if (engine && currentLoadedModelId === targetId && currentEngineStatus === 'ready') {
    broadcastStatus('ready', { modelId: targetId });
    return true;
  }

  if (isCurrentlyLoading) {
    console.log('[Writo Offscreen] Loading already in progress, ignoring duplicate trigger.');
    return false;
  }

  isCurrentlyLoading = true;

  const gpuCheck = await checkWebGPU();
  if (!gpuCheck.supported) {
    isCurrentlyLoading = false;
    const reason = gpuCheck.reason || 'WebGPU is not supported on this browser/GPU.';
    console.error('[Writo Offscreen] WebGPU Check Failed:', reason);
    broadcastStatus('fallback', { reason, error: reason });
    return false;
  }

  try {
    const isCached = await hasModelInCache(targetId).catch(() => false);
    broadcastStatus(isCached ? 'loading' : 'downloading');

    broadcastProgress({
      progress: 0.05,
      text: isCached
        ? 'Reading model weights from offline cache...'
        : 'Connecting to repository & compiling WebAssembly shaders...',
      timeElapsed: 0,
    });

    console.log(`[Writo Offscreen] Initializing CreateMLCEngine for: ${targetId} (isCached: ${isCached})`);

    const newEngine = await CreateMLCEngine(
      targetId,
      {
        initProgressCallback: (report: InitProgressReport) => {
          let text = report.text;
          if (isCached && text.includes('Fetching param cache')) {
            text = text.replace(/Fetching param cache/i, '⚡ Loading cached weights from disk');
          }
          console.log(`[Writo Progress] ${Math.round(report.progress * 100)}% - ${text}`);
          broadcastProgress({
            progress: report.progress,
            text,
            timeElapsed: report.timeElapsed,
          });
        },
      },
      {
        context_window_size: 2048,
        sliding_window_size: -1,
      }
    );

    if (engine && engine !== newEngine) {
      await engine.unload().catch(() => {});
    }

    engine = newEngine;
    currentLoadedModelId = targetId;
    await markModelDownloaded(targetId, true);
    broadcastStatus('ready', { modelId: targetId });
    console.log(`[Writo Offscreen] Model successfully loaded & ready: ${targetId}`);
    return true;
  } catch (err: unknown) {
    console.error('[Writo Offscreen] Failed to initialize WebLLM engine:', err);
    const msg = err instanceof Error ? err.message : 'Model initialization failed';
    broadcastStatus('error', { error: msg, reason: msg });
    return false;
  } finally {
    isCurrentlyLoading = false;
  }
}

async function executeAction(
  requestId: string,
  action: ActionType,
  text: string,
  tier: ModelTier,
  customInstruction?: string
) {
  if (!engine || currentEngineStatus !== 'ready') {
    const ready = await loadModel(tier);
    if (!ready || !engine) {
      chrome.runtime.sendMessage({
        type: 'STREAM_TOKEN',
        requestId,
        payload: { error: 'Failed to initialize AI engine for model tier: ' + tier, isDone: true },
      }).catch(() => {});
      return;
    }
  }

  // Split text into paragraph-safe chunks to prevent GPU out-of-memory errors
  const chunks = splitIntoManageableChunks(text, 180);
  console.log(`[Writo Offscreen] Processing text in ${chunks.length} safe chunk(s)`);

  activeAbortController = new AbortController();
  const startTime = performance.now();
  let generatedTokens = 0;
  let fullAccumulated = '';

  try {
    broadcastStatus('generating');

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      if (activeAbortController?.signal.aborted) break;

      const chunkText = chunks[cIdx];
      const userContent = customInstruction
        ? `You are a direct, professional writing assistant.
Instruction: ${customInstruction}

Draft:
${chunkText}

Return only the final revised text without preambles or explanations.`
        : (ACTION_CONFIGS[action] || ACTION_CONFIGS.improve).promptTemplate(chunkText);

      const chunkWords = chunkText.split(/\s+/).length;
      const maxTokens = Math.min(1024, Math.max(256, Math.round(chunkWords * 2)));

      const stream = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.25,
        max_tokens: maxTokens,
      });

      let chunkAccumulated = '';

      for await (const chunk of stream) {
        if (activeAbortController?.signal.aborted) {
          try {
            await engine.interruptGenerate();
          } catch {}
          break;
        }
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          chunkAccumulated += delta;
          generatedTokens++;
          const livePreview = (fullAccumulated ? fullAccumulated + '\n\n' : '') + chunkAccumulated;
          chrome.runtime.sendMessage({
            type: 'STREAM_TOKEN',
            requestId,
            payload: { chunk: delta, fullText: livePreview, isDone: false },
          }).catch(() => {});
        }
      }

      // Sanitize this chunk's output
      let cleanedChunk = chunkAccumulated.trim();
      cleanedChunk = cleanedChunk.replace(/^```[a-z]*\n?|```$/gi, '').trim();
      cleanedChunk = cleanedChunk.replace(/^"(.*)"$/s, '$1').trim();
      cleanedChunk = cleanedChunk.replace(/^\[(Polished|Revised|Improved|Cleaned)\]\s*/i, '').trim();

      fullAccumulated += (fullAccumulated ? '\n\n' : '') + (cleanedChunk || chunkText);
    }

    const elapsedMs = performance.now() - startTime;
    const stats: GenerationStats = {
      tokens: generatedTokens,
      tokensPerSecond: Number((generatedTokens / (elapsedMs / 1000)).toFixed(1)),
      totalTimeMs: Math.round(elapsedMs),
    };

    chrome.runtime.sendMessage({
      type: 'STREAM_TOKEN',
      requestId,
      payload: { chunk: '', fullText: fullAccumulated.trim(), isDone: true, stats },
    }).catch(() => {});
    broadcastStatus('ready');
  } catch (err: unknown) {
    console.error('Generation error:', err);
    const msg = err instanceof Error ? err.message : 'Generation failed';

    // If WebGPU device was reset or buffer unmapped, cleanly reset engine
    if (msg.includes('unmapped') || msg.includes('device') || msg.includes('mapAsync')) {
      console.warn('[Writo Offscreen] WebGPU buffer unmapped / device reset. Resetting engine state...');
      try {
        await engine.unload();
      } catch {}
      engine = null;
      currentEngineStatus = 'unloaded';
    }

    chrome.runtime.sendMessage({
      type: 'STREAM_TOKEN',
      requestId,
      payload: { error: msg, isDone: true },
    }).catch(() => {});
    broadcastStatus(engine ? 'ready' : 'unloaded');
  } finally {
    activeAbortController = null;
  }
}

// Listen to commands from background service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target && message.target !== 'offscreen') {
    return false;
  }

  if (message.type === 'GET_STATUS') {
    sendResponse({
      status: currentEngineStatus,
      modelId: currentLoadedModelId,
      progress: currentProgress,
    });
    return true;
  }

  if (message.type === 'DOWNLOAD_MODEL') {
    const tier = (message.payload?.tier as ModelTier) || 'mid';
    loadModel(tier);
    sendResponse({ started: true });
    return true;
  }

  if (message.type === 'EXECUTE_ACTION') {
    const { action, text, tier, customInstruction } = message.payload;
    executeAction(message.requestId, action, text, tier, customInstruction);
    sendResponse({ processing: true });
    return true;
  }

  if (message.type === 'CANCEL_ACTION') {
    if (activeAbortController) {
      activeAbortController.abort();
    }
    if (engine) {
      engine.interruptGenerate().catch(() => {});
    }
    broadcastStatus('ready');
    sendResponse({ cancelled: true });
    return true;
  }
});
