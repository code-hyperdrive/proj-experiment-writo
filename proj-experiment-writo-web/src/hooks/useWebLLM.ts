import { useState, useRef, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport, hasModelInCache } from '@mlc-ai/web-llm';
import { EngineStatus, LoadingProgress, GenerationStats, ActionType, NetworkInfo } from '../types';
import { ACTION_CONFIGS, SYSTEM_PROMPT } from '../constants/prompts';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS, selectOptimalModelForSpeed } from '../constants/models';
import { checkWebGPUSupport, WebGPUCheckResult } from '../utils/webgpu';
import { detectNetworkSpeed } from '../utils/networkSpeed';

// Helper to find the highest capability/size model among downloaded models
function getHighestDownloadedModel(cachedIds: string[]): string | null {
  if (!cachedIds || cachedIds.length === 0) return null;
  const downloaded = AVAILABLE_MODELS.filter((m) => cachedIds.includes(m.id));
  if (downloaded.length === 0) return null;
  downloaded.sort((a, b) => b.sizeMB - a.sizeMB);
  return downloaded[0].id;
}

export function useWebLLM() {
  // Track cached models
  const [cachedModelIds, setCachedModelIds] = useState<string[]>(() => {
    try {
      return AVAILABLE_MODELS.filter((m) => localStorage.getItem(`writo_cached_${m.id}`) === 'true').map((m) => m.id);
    } catch {
      return [];
    }
  });

  // Default model: highest downloaded model if any are cached, otherwise saved preference, otherwise DEFAULT_MODEL_ID
  const [modelId, setModelId] = useState<string>(() => {
    try {
      const initialCached = AVAILABLE_MODELS.filter(
        (m) => localStorage.getItem(`writo_cached_${m.id}`) === 'true'
      ).map((m) => m.id);
      
      const highestDownloaded = getHighestDownloadedModel(initialCached);
      if (highestDownloaded) {
        return highestDownloaded;
      }
      
      const saved = localStorage.getItem('writo_selected_model');
      if (saved && AVAILABLE_MODELS.some((m) => m.id === saved)) {
        return saved;
      }
    } catch {}
    return DEFAULT_MODEL_ID;
  });

  const [status, setStatus] = useState<EngineStatus>('unloaded');
  const [progress, setProgress] = useState<LoadingProgress>({ progress: 0, text: '' });
  const [gpuInfo, setGpuInfo] = useState<WebGPUCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    speedMbps: 0,
    tier: 'fast',
    saveData: false,
    isTesting: true,
  });

  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [activeLoadedModelId, setActiveLoadedModelId] = useState<string | null>(null);

  // Track if user has manually chosen a model to avoid overriding their preference
  const userManuallySelectedModelRef = useRef<boolean>(
    typeof window !== 'undefined' && localStorage.getItem('writo_user_manually_selected') === 'true'
  );

  // Engine references to keep loaded in memory
  const engineRef = useRef<MLCEngine | null>(null);
  const activeEngineModelIdRef = useRef<string | null>(null);
  const activeLoadRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<boolean>(false);
  const lastRequestTimeRef = useRef<number>(0);

  // Refresh list of cached models via WebLLM's hasModelInCache
  const refreshCachedModels = useCallback(async () => {
    const cached: string[] = [];
    for (const m of AVAILABLE_MODELS) {
      try {
        const inCache = await hasModelInCache(m.id);
        const inLocal = localStorage.getItem(`writo_cached_${m.id}`) === 'true';
        if (inCache || inLocal) {
          cached.push(m.id);
          localStorage.setItem(`writo_cached_${m.id}`, 'true');
        }
      } catch {
        if (localStorage.getItem(`writo_cached_${m.id}`) === 'true') {
          cached.push(m.id);
        }
      }
    }
    setCachedModelIds(cached);

    // Keep default model as the HIGHEST downloaded model
    if (cached.length > 0) {
      const highestDownloaded = getHighestDownloadedModel(cached);
      if (highestDownloaded) {
        const userExplicitlyPicked = localStorage.getItem('writo_user_manually_selected') === 'true';
        const savedChoice = localStorage.getItem('writo_selected_model');
        // If user hasn't explicitly chosen a different downloaded model, default to the highest downloaded
        if (!userExplicitlyPicked || !savedChoice || !cached.includes(savedChoice)) {
          setModelId(highestDownloaded);
          try {
            localStorage.setItem('writo_selected_model', highestDownloaded);
          } catch {}
        }
      }
    }

    return cached;
  }, []);

  // Request browser storage persistence so model weights are never evicted
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  // Detect Network Speed: ONLY used when NO model is downloaded to pick the initial model to download
  const runSpeedCheck = useCallback(async (currentCachedCount?: number) => {
    const count = currentCachedCount !== undefined ? currentCachedCount : cachedModelIds.length;
    
    // IF ANY MODEL IS DOWNLOADED: DO NOT run speed logic to pick model!
    if (count > 0) {
      setNetworkInfo((prev) => ({ ...prev, isTesting: false }));
      return;
    }

    setNetworkInfo((prev) => ({ ...prev, isTesting: true }));
    try {
      const speedResult = await detectNetworkSpeed();
      const recommendation = selectOptimalModelForSpeed(speedResult.speedMbps, speedResult.saveData);
      
      setNetworkInfo({
        speedMbps: speedResult.speedMbps,
        tier: speedResult.tier,
        saveData: speedResult.saveData,
        recommendationReason: recommendation.reason,
        isTesting: false,
      });

      // Since NO model is downloaded yet, pick the recommended model based on speed to start download
      if (status === 'unloaded') {
        setModelId(recommendation.modelId);
        try {
          localStorage.setItem('writo_selected_model', recommendation.modelId);
        } catch {}
      }
    } catch {
      setNetworkInfo({
        speedMbps: 15,
        tier: 'moderate',
        saveData: false,
        recommendationReason: 'Defaulted to standard profile.',
        isTesting: false,
      });
    }
  }, [status, cachedModelIds.length]);

  // Check WebGPU, cached models & Network on mount
  useEffect(() => {
    let mounted = true;
    checkWebGPUSupport().then((info) => {
      if (!mounted) return;
      setGpuInfo(info);
      if (!info.supported) {
        setStatus('fallback');
        setIsSimulationMode(true);
        setErrorMessage(info.reason || 'WebGPU is not supported on this device/browser.');
      }
    });

    refreshCachedModels().then((cached) => {
      if (!mounted) return;
      // ONLY run speed logic to pick a model if NO model is downloaded yet!
      if (cached.length === 0) {
        runSpeedCheck(0);
      } else {
        setNetworkInfo((prev) => ({ ...prev, isTesting: false }));
      }
    });

    return () => {
      mounted = false;
    };
  }, [runSpeedCheck, refreshCachedModels]);

  /**
   * Cancel an in-flight download request without losing the previously active engine
   */
  const cancelDownload = useCallback(() => {
    // Increment request ID so any pending download callbacks are ignored
    activeLoadRequestIdRef.current++;
    setDownloadingModelId(null);

    // If an engine is already loaded, revert to it immediately so app doesn't halt
    if (engineRef.current && activeEngineModelIdRef.current) {
      setModelId(activeEngineModelIdRef.current);
      setStatus('ready');
      setProgress({
        progress: 1,
        text: `Switched back to active power stage. Ready.`,
      });
    } else {
      setStatus('unloaded');
      setProgress({ progress: 0, text: 'Download cancelled.' });
    }
  }, []);

  /**
   * Initialize and load the selected model into browser WebGPU memory.
   * If a previous model is already active, keeps it running so the app doesn't halt.
   */
  const loadModel = useCallback(async (targetModelId?: string) => {
    const idToLoad = targetModelId || modelId;
    const currentRequestId = ++activeLoadRequestIdRef.current;
    
    // Check GPU support first
    const gpuCheck = await checkWebGPUSupport();
    setGpuInfo(gpuCheck);
    
    if (!gpuCheck.supported) {
      setStatus('fallback');
      setErrorMessage(gpuCheck.reason || 'WebGPU is required for local hardware-accelerated LLM inference.');
      return;
    }

    try {
      const isAlreadyCached = await hasModelInCache(idToLoad).catch(() => false);

      setDownloadingModelId(idToLoad);
      setStatus(isAlreadyCached ? 'loading' : 'downloading');
      setErrorMessage(null);
      setProgress({
        progress: 0.05,
        text: isAlreadyCached
          ? '⚡ Reading model weights from offline disk storage...'
          : 'Connecting to model repository and downloading weights...',
      });

      const engine = await CreateMLCEngine(idToLoad, {
        initProgressCallback: (report: InitProgressReport) => {
          // If request was superseded or cancelled, ignore callbacks
          if (activeLoadRequestIdRef.current !== currentRequestId) {
            return;
          }

          let displayText = report.text;
          if (isAlreadyCached && displayText.includes('Fetching param cache')) {
            displayText = displayText.replace(/Fetching param cache/i, '⚡ Loading cached weights');
          }

          setProgress({
            progress: report.progress,
            text: displayText,
            timeElapsed: report.timeElapsed,
          });
          if (report.progress < 1) {
            setStatus(isAlreadyCached || report.text.includes('Loading model') ? 'loading' : 'downloading');
          }
        },
      });

      // If user switched or cancelled while CreateMLCEngine was running, unload this engine
      if (activeLoadRequestIdRef.current !== currentRequestId) {
        try {
          await engine.unload();
        } catch {}
        return;
      }

      // Unload previous engine if any, now that the new one is ready
      if (engineRef.current && engineRef.current !== engine) {
        try {
          await engineRef.current.unload();
        } catch (e) {
          console.warn('Error unloading previous engine:', e);
        }
      }

      engineRef.current = engine;
      activeEngineModelIdRef.current = idToLoad;
      setActiveLoadedModelId(idToLoad);
      setModelId(idToLoad);
      setDownloadingModelId(null);
      setStatus('ready');
      setProgress({ progress: 1, text: 'Power stage activated and ready.' });

      // Mark model as cached and save selected model permanently
      try {
        localStorage.setItem(`writo_cached_${idToLoad}`, 'true');
        localStorage.setItem('writo_selected_model', idToLoad);
      } catch {}
      setCachedModelIds((prev) => (prev.includes(idToLoad) ? prev : [...prev, idToLoad]));
    } catch (err: unknown) {
      // If request was superseded or cancelled, ignore errors
      if (activeLoadRequestIdRef.current !== currentRequestId) {
        return;
      }

      console.error('Failed to load WebLLM model:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download or initialize power stage.';
      setErrorMessage(msg);
      setDownloadingModelId(null);

      // If we still have a working previous engine, stay on it instead of locking the app
      if (engineRef.current && activeEngineModelIdRef.current) {
        setModelId(activeEngineModelIdRef.current);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    }
  }, [modelId]);

  /**
   * Helper simulation mode for browsers without WebGPU or quick demonstration
   */
  const runSimulation = useCallback(async (action: ActionType, text: string, onUpdate?: (val: string) => void) => {
    setStatus('generating');
    setActiveAction(action);
    setResultText('');
    const startTime = performance.now();
    let generatedWords = 0;

    let transformed = '';
    switch (action) {
      case 'grammar':
        transformed = text
          .replace(/\bTheir are\b/gi, 'There are')
          .replace(/\balot\b/gi, 'a lot')
          .replace(/\bWe was not\b/gi, 'We were not')
          .replace(/\bengineer's\b/gi, 'engineers')
          .replace(/\bdont\b/gi, "don't")
          .replace(/\bmisteak\b/gi, 'mistake')
          .replace(/\bi\b/g, 'I');
        break;
      case 'concise':
        transformed = text
          .replace(/At the present moment in time,/gi, 'Currently,')
          .replace(/in order to successfully achieve/gi, 'to achieve')
          .replace(/optimal strategic objectives/gi, 'key goals')
          .replace(/it is absolutely essential that each and every single member/gi, 'every member must')
          .replace(/cooperates together in a collaborative manner/gi, 'collaborate')
          .replace(/take into consideration/gi, 'consider')
          .replace(/the various different factors that may potentially impact/gi, 'factors impacting')
          .replace(/going forward into the foreseeable future/gi, 'ahead');
        break;
      case 'professional':
        transformed = text
          .replace(/hey guys,/gi, 'Hello Team,')
          .replace(/just wanted to check if you got around to looking at my slides yet\?/gi, 'Could you please provide an update on the slide deck review?')
          .replace(/i really need the numbers fixed asap/gi, 'It is critical that we finalize the metrics promptly,')
          .replace(/cuz the boss is gonna be super mad if we miss the deadline tomorrow morning\./gi, 'as leadership expects the presentation before tomorrow morning’s deadline.')
          .replace(/lmk!/gi, 'Thank you for your prompt attention to this matter.');
        break;
      case 'simplify':
        transformed = text
          .replace(/The implementation leverages an asynchronous event-driven paradigm utilizing decoupled microservices architectures/gi, 'Our system uses independent services that communicate through events')
          .replace(/to optimize decentralized telemetry ingestion,/gi, 'to easily gather data,')
          .replace(/facilitating deterministic throughput elasticity while minimizing latency overheads across heterogeneous cloud topologies\./gi, 'keeping it fast and reliable across different servers.');
        break;
      case 'improve':
      default:
        transformed = text
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\bi\b/g, 'I')
          .replace(/([.!?])\s*([a-z])/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`);
        if (transformed.length > 0) {
          transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
        }
        if (!/[.!?]$/.test(transformed)) {
          transformed += '.';
        }
        break;
    }

    // Ensure output is clean text without any bracketed tags or metadata
    transformed = transformed.replace(/^\[(Polished|Revised|Improved|Cleaned)\]\s*/i, '');

    const words = transformed.split(' ');
    let currentResult = '';

    for (let i = 0; i < words.length; i++) {
      if (abortControllerRef.current) break;
      currentResult += (i === 0 ? '' : ' ') + words[i];
      generatedWords++;
      setResultText(currentResult);
      if (onUpdate) {
        onUpdate(currentResult);
      }
      await new Promise((r) => setTimeout(r, 22));
    }

    const elapsedMs = performance.now() - startTime;
    setStats({
      tokens: Math.round(generatedWords * 1.3),
      tokensPerSecond: Number(((generatedWords * 1.3) / (elapsedMs / 1000)).toFixed(1)),
      totalTimeMs: Math.round(elapsedMs),
    });

    setStatus('ready');
    setActiveAction(null);
  }, []);

  /**
   * Execute writing action with local LLM streaming
   */
  const executeAction = useCallback(async (action: ActionType, text: string, onUpdate?: (val: string) => void) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = performance.now();
    if (now - lastRequestTimeRef.current < 300) {
      return;
    }
    lastRequestTimeRef.current = now;

    if (isSimulationMode || status === 'fallback') {
      return runSimulation(action, trimmed, onUpdate);
    }

    // If an engine is not loaded, start loading
    if (!engineRef.current || status !== 'ready') {
      await loadModel();
      if (!engineRef.current) return;
    }

    const config = ACTION_CONFIGS[action];
    if (!config) return;

    const prompt = config.promptTemplate(trimmed);
    abortControllerRef.current = false;
    setStatus('generating');
    setActiveAction(action);
    setResultText('');
    setStats(null);

    const startTime = performance.now();
    let tokenCount = 0;

    try {
      const chunks = await engineRef.current.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.25,
        stream: true,
        stream_options: { include_usage: true },
      });

      let accumulated = '';

      for await (const chunk of chunks) {
        if (abortControllerRef.current) {
          try {
            await engineRef.current.interruptGenerate();
          } catch {
            // Ignore interruption
          }
          break;
        }

        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          tokenCount++;
          setResultText(accumulated);
          if (onUpdate) {
            onUpdate(accumulated);
          }
        }
      }

      let cleaned = accumulated.trim();
      if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
      }
      // Strip any unwanted bracketed tags or conversational preamble
      cleaned = cleaned
        .replace(/^\[(Polished|Revised|Improved|Cleaned)\]\s*/i, '')
        .replace(/^(Here is|Here's) (the|your)? (improved|revised|rewritten|polished)? (text|version|draft):\s*/i, '')
        .trim();

      // Unwrap quotes if the LLM wrapped the entire response in quotation marks
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith('“') && cleaned.endsWith('”'))) {
        cleaned = cleaned.slice(1, -1).trim();
      }

      setResultText(cleaned);
      if (onUpdate) {
        onUpdate(cleaned);
      }

      const elapsedMs = performance.now() - startTime;
      const tps = elapsedMs > 0 ? (tokenCount / (elapsedMs / 1000)) : 0;

      setStats({
        tokens: tokenCount,
        tokensPerSecond: Number(tps.toFixed(1)),
        totalTimeMs: Math.round(elapsedMs),
      });

      setStatus('ready');
    } catch (err: unknown) {
      console.error('Inference error:', err);
      if (!abortControllerRef.current) {
        setErrorMessage(err instanceof Error ? err.message : 'Error during AI generation.');
        setStatus('error');
      } else {
        setStatus('ready');
      }
    } finally {
      setActiveAction(null);
    }
  }, [isSimulationMode, status, runSimulation, loadModel]);

  /**
   * Stop ongoing generation
   */
  const stopGeneration = useCallback(async () => {
    abortControllerRef.current = true;
    if (engineRef.current) {
      try {
        await engineRef.current.interruptGenerate();
      } catch (e) {
        console.warn('Interruption note:', e);
      }
    }
    setStatus('ready');
    setActiveAction(null);
  }, []);

  /**
   * Select a model / power stage.
   * If a model is currently downloading, switching to an already-downloaded model
   * cancels the download and switches immediately so the user is never halted.
   */
  const selectModel = useCallback(async (newModelId: string) => {
    userManuallySelectedModelRef.current = true;
    try {
      localStorage.setItem('writo_selected_model', newModelId);
      localStorage.setItem('writo_user_manually_selected', 'true');
    } catch {}

    // If already active on this exact model, nothing to do
    if (newModelId === activeEngineModelIdRef.current && status === 'ready') {
      return;
    }

    // If user picks the already loaded model while another download is running:
    if (newModelId === activeEngineModelIdRef.current && status === 'downloading') {
      cancelDownload();
      return;
    }

    setModelId(newModelId);

    // If assistant is active or downloading, trigger load
    if (status === 'ready' || status === 'downloading' || status === 'loading') {
      await loadModel(newModelId);
    }
  }, [status, loadModel, cancelDownload]);

  return {
    modelId,
    selectModel,
    status,
    progress,
    gpuInfo,
    errorMessage,
    activeAction,
    resultText,
    stats,
    loadModel,
    executeAction,
    stopGeneration,
    isSimulationMode,
    setIsSimulationMode,
    networkInfo,
    recheckNetworkSpeed: runSpeedCheck,
    cachedModelIds,
    downloadingModelId,
    activeLoadedModelId,
    cancelDownload,
    isModelCached: (id: string) => cachedModelIds.includes(id),
  };
}
