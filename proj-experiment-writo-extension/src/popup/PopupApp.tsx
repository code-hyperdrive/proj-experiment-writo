import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HardDrive, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  Check
} from 'lucide-react';
import { hasModelInCache } from '@mlc-ai/web-llm';
import { ModelTier, EngineStatus, LoadingProgress, WritoExtensionSettings } from '../shared/types';
import { MODEL_TIERS } from '../shared/models';
import { getSettings, saveSettings, isModelDownloaded, markModelDownloaded } from '../shared/storage';

export const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<WritoExtensionSettings | null>(null);
  const [selectedTier, setSelectedTier] = useState<ModelTier>('mid');
  const [downloadedTiers, setDownloadedTiers] = useState<Record<ModelTier, boolean>>({
    low: false,
    mid: false,
    high: false,
  });
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('unloaded');
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadingProgress>({ progress: 0, text: '' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request persistent storage
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  // Load initial settings and check actual cache
  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setSelectedTier(s.selectedTier);
    });

    const checkCache = async () => {
      const checkTier = async (id: string): Promise<boolean> => {
        try {
          const inCache = await hasModelInCache(id);
          const inStorage = await isModelDownloaded(id);
          if (inCache && !inStorage) {
            await markModelDownloaded(id, true);
          }
          return Boolean(inCache || inStorage);
        } catch {
          return await isModelDownloaded(id);
        }
      };

      const [lowCached, midCached, highCached] = await Promise.all([
        checkTier(MODEL_TIERS.low.id),
        checkTier(MODEL_TIERS.mid.id),
        checkTier(MODEL_TIERS.high.id),
      ]);
      setDownloadedTiers({ low: lowCached, mid: midCached, high: highCached });
    };
    checkCache();

    // Query status from offscreen worker
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (res) {
        setEngineStatus(res.status);
        if (res.modelId) setActiveModelId(res.modelId);
        if (res.progress) setProgress(res.progress);
      }
    });

    // Listen for progress and status updates
    const listener = (msg: { type: string; payload?: unknown }) => {
      if (msg.type === 'PROGRESS_UPDATE') {
        const p = msg.payload as LoadingProgress;
        setProgress(p);
        setIsDownloading(p.progress < 1);
        if (p.progress < 1) {
          setErrorMessage(null);
        }
      } else if (msg.type === 'STATUS_RESPONSE') {
        const s = msg.payload as { status: EngineStatus; modelId?: string; error?: string; reason?: string };
        setEngineStatus(s.status);
        if (s.modelId) setActiveModelId(s.modelId);
        if (s.status === 'ready') {
          setIsDownloading(false);
          setErrorMessage(null);
          checkCache();
        } else if (s.status === 'error' || s.status === 'fallback') {
          setIsDownloading(false);
          setErrorMessage(s.error || s.reason || 'Model initialization failed');
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleSelectTier = async (tier: ModelTier) => {
    setSelectedTier(tier);
    setErrorMessage(null);
    await saveSettings({ selectedTier: tier });
  };

  const handleDownloadModel = () => {
    setIsDownloading(true);
    setErrorMessage(null);
    const isCached = downloadedTiers[selectedTier];
    setProgress({ 
      progress: 0.05, 
      text: isCached ? '⚡ Reading cached weights from disk into GPU...' : 'Connecting to repository...' 
    });
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_MODEL',
      payload: { tier: selectedTier },
    });
  };

  const handleToggleInline = async () => {
    if (!settings) return;
    const updated = !settings.inlineAssistantEnabled;
    const saved = await saveSettings({ inlineAssistantEnabled: updated });
    setSettings(saved);
  };

  const handleOpenSidePanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id && chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
        window.close();
      }
    });
  };

  const currentConfig = MODEL_TIERS[selectedTier];
  const isCurrentDownloaded = downloadedTiers[selectedTier];
  const isCurrentActive = engineStatus === 'ready' && activeModelId === currentConfig.id;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 font-sans selection:bg-brand-500 selection:text-white">
      {/* Header - Consistent with Web App */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">Writo</h1>
              <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.2 rounded font-mono font-medium">
                WebGPU
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">Writing Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>100% Private</span>
        </div>
      </div>

      {/* Model Power Stage Selector */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>Power Stage</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Local LLM</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          {(['low', 'mid', 'high'] as ModelTier[]).map((tier) => {
            const config = MODEL_TIERS[tier];
            const isSelected = selectedTier === tier;
            const isCached = downloadedTiers[tier];

            return (
              <button
                key={tier}
                onClick={() => handleSelectTier(tier)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-600/30 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold">{config.name}</span>
                  {isCached && (
                    <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                  )}
                </div>
                <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-400'} mt-0.5 font-mono`}>
                  {config.recommended ? '★ Best' : `~${config.sizeMB}MB`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Details Card */}
      <div className="mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white">{currentConfig.name}</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-brand-300 font-medium px-2 py-0.5 rounded-full border border-slate-700">
            {currentConfig.badge}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {currentConfig.description}
        </p>

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 break-words">
              <span className="font-semibold">Notice:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Download / Activation State */}
        <div className="mt-1 pt-2 border-t border-slate-800">
          {isDownloading ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
                  {isCurrentDownloaded ? 'Loading into GPU memory...' : 'Downloading weights...'}
                </span>
                <span className="font-mono text-brand-400 font-semibold">
                  {Math.round(progress.progress * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 truncate">{progress.text}</span>
            </div>
          ) : isCurrentActive ? (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active in GPU Memory • AI Ready
              </span>
              <button
                onClick={handleDownloadModel}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline flex items-center gap-1"
                title="Reload from local cache"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Reload
              </button>
            </div>
          ) : isCurrentDownloaded ? (
            <button
              onClick={handleDownloadModel}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition-all shadow-md shadow-brand-600/20 active:scale-[0.99]"
            >
              <Zap className="w-3.5 h-3.5" />
              Activate & Load into GPU (Cached)
            </button>
          ) : (
            <button
              onClick={handleDownloadModel}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition-all shadow-md shadow-brand-600/20 active:scale-[0.99]"
            >
              <Download className="w-3.5 h-3.5" />
              Download {currentConfig.name} (~{currentConfig.sizeMB} MB)
            </button>
          )}
        </div>
      </div>

      {/* Quick Settings & Actions */}
      <div className="mt-3.5 flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors">
          <span className="font-medium">In-Page Floating Assistant</span>
          <input
            type="checkbox"
            checked={settings?.inlineAssistantEnabled ?? true}
            onChange={handleToggleInline}
            className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
          />
        </label>

        <button
          onClick={handleOpenSidePanel}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
          Open Side Panel (Full Workspace)
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-3 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
        <HardDrive className="w-3 h-3 text-slate-500" />
        Zero telemetry • 100% In-Browser Privacy
      </div>
    </div>
  );
};
