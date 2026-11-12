import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  CheckCheck, 
  Briefcase, 
  Feather, 
  Scissors, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  Clock, 
  FileText, 
  Loader2, 
  Eye,
  PenLine,
  Square,
  ChevronDown
} from 'lucide-react';
import { ActionType, ModelTier, LoadingProgress, GenerationStats, EngineStatus } from '../shared/types';
import { MODEL_TIERS } from '../shared/models';
import { SAMPLE_TEXTS } from '../shared/prompts';
import { computeWordDiff } from '../shared/diff';
import { getSettings, saveSettings } from '../shared/storage';

export const SidePanelApp: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [resultText, setResultText] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<ModelTier>('mid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'diff'>('editor');
  const [progress, setProgress] = useState<LoadingProgress>({ progress: 0, text: '' });
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('unloaded');

  const currentRequestIdRef = useRef<string>('');

  // Sync settings & check active selection
  useEffect(() => {
    getSettings().then((s) => {
      setSelectedTier(s.selectedTier);
    });

    // Check active tab selection
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_ACTIVE_SELECTION' }, (res) => {
          if (res?.selectedText) {
            setInputText(res.selectedText);
          }
        });
      }
    });

    // Query status from offscreen worker
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (res) {
        setEngineStatus(res.status);
        if (res.progress) setProgress(res.progress);
      }
    });

    // Listen for streaming tokens and progress updates
    const listener = (msg: { type: string; requestId?: string; payload?: unknown }) => {
      if (msg.type === 'STREAM_TOKEN' && msg.requestId === currentRequestIdRef.current) {
        const payload = msg.payload as { chunk: string; fullText: string; isDone: boolean; stats?: GenerationStats; error?: string };
        if (payload.error) {
          alert(`Error: ${payload.error}`);
          setIsGenerating(false);
          setActiveAction(null);
          return;
        }
        if (payload.fullText) {
          setResultText(payload.fullText);
        }
        if (payload.isDone) {
          setIsGenerating(false);
          setActiveAction(null);
          if (payload.stats) setStats(payload.stats);
        }
      } else if (msg.type === 'PROGRESS_UPDATE') {
        setProgress(msg.payload as LoadingProgress);
      } else if (msg.type === 'STATUS_RESPONSE') {
        const s = msg.payload as { status: EngineStatus; error?: string };
        setEngineStatus(s.status);
        if (s.status === 'ready') {
          setProgress({ progress: 1, text: 'Ready' });
        } else if (s.status === 'error' || s.status === 'fallback') {
          setIsGenerating(false);
          setActiveAction(null);
          if (s.error) alert(`Writo: ${s.error}`);
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Text metrics calculation
  const metrics = useMemo(() => {
    const trimmed = inputText.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = inputText.length;
    const readingTimeMins = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTimeMins };
  }, [inputText]);

  // LCS word diff
  const diffParts = useMemo(() => {
    if (!inputText || !resultText) return [];
    return computeWordDiff(inputText, resultText);
  }, [inputText, resultText]);

  const handleSelectTier = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tier = e.target.value as ModelTier;
    setSelectedTier(tier);
    await saveSettings({ selectedTier: tier });
  };

  const handleExecuteAction = (action: ActionType) => {
    if (!inputText.trim() || isGenerating) return;

    setIsGenerating(true);
    setActiveAction(action);
    setResultText('');
    setStats(null);
    currentRequestIdRef.current = `req-${Date.now()}`;

    chrome.runtime.sendMessage({
      type: 'EXECUTE_ACTION',
      requestId: currentRequestIdRef.current,
      payload: {
        action,
        text: inputText.trim(),
        tier: selectedTier,
      },
    });
  };

  const handleStop = () => {
    if (isGenerating && currentRequestIdRef.current) {
      chrome.runtime.sendMessage({
        type: 'CANCEL_ACTION',
        requestId: currentRequestIdRef.current,
      });
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleLoadSample = (index: number) => {
    const sample = SAMPLE_TEXTS[index];
    if (sample) {
      setInputText(sample.text);
      setResultText('');
    }
  };

  const handleCopy = async () => {
    const textToCopy = resultText || inputText;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToPage = () => {
    if (!resultText) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'APPLY_TO_ACTIVE_PAGE',
          payload: { text: resultText },
        });
        setApplied(true);
        setTimeout(() => setApplied(false), 2000);
      }
    });
  };

  const handleDownload = () => {
    const content = resultText || inputText;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writo-revision-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans text-xs selection:bg-brand-500 selection:text-white">
      {/* Top Navbar - Matching Web App Header */}
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs tracking-tight">Writo</span>
              {isGenerating ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-2.5 h-2.5 animate-spin" />
                  Generating...
                </span>
              ) : engineStatus === 'ready' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  AI Ready
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-slate-400">Writing Assistant</p>
          </div>
        </div>

        {/* Model Tier Selector */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-800 bg-slate-900/90 text-[11px] text-slate-300">
            <span className="text-slate-500 font-medium">Power:</span>
            <div className="relative flex items-center">
              <select
                value={selectedTier}
                onChange={handleSelectTier}
                className="appearance-none bg-transparent border-none outline-none cursor-pointer font-semibold pr-4 text-brand-400 focus:text-brand-300"
              >
                <option value="low" className="bg-slate-900 text-slate-200">Vapor (0.5B) • Fast & Lightweight</option>
                <option value="mid" className="bg-slate-900 text-slate-200">Solid (1.5B) • Recommended ★</option>
                <option value="high" className="bg-slate-900 text-slate-200">Core (3.8B) • Deep Precision</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-0 shrink-0" />
            </div>
          </div>
        </div>
      </header>

      {/* Progress banner if downloading weights */}
      {progress.progress > 0 && progress.progress < 1 && (
        <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 truncate">
            <Loader2 className="w-3 h-3 animate-spin text-brand-400 shrink-0" />
            <span className="truncate">{progress.text}</span>
          </span>
          <span className="font-mono text-brand-400 shrink-0 font-semibold">
            {Math.round(progress.progress * 100)}%
          </span>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden gap-2.5">
        {/* Source Text Input */}
        <div className="flex-1 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/90">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-slate-400" />
              Original Draft
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value !== '') {
                    handleLoadSample(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                className="bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] rounded-md px-1.5 py-0.5 outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Load Sample...</option>
                {SAMPLE_TEXTS.map((s, idx) => (
                  <option key={idx} value={idx}>{s.title}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <span>{metrics.words}w</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {metrics.readingTimeMins}m
                </span>
              </div>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type, paste, or select text on any webpage to polish with Writo AI..."
            className="flex-1 w-full bg-transparent p-3 resize-none outline-none text-slate-200 placeholder-slate-600 font-sans leading-relaxed text-xs"
          />
        </div>

        {/* Action Toolbar - Matching Web App Action Buttons */}
        <div className="flex flex-col gap-1.5 w-full">
          {isGenerating ? (
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-medium transition-all shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Generating</span>
            </button>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              {/* Primary: Improve Writing */}
              <button
                onClick={() => handleExecuteAction('improve')}
                disabled={!inputText.trim() || isGenerating}
                className={`w-full group flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-xs transition-all shadow-sm ${
                  activeAction === 'improve'
                    ? 'bg-brand-600 text-white ring-2 ring-brand-500/50 shadow-brand-500/25'
                    : 'bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white shadow-brand-600/25'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-200 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold">Improve Writing</span>
              </button>

              {/* Secondary Action Grid */}
              <div className="grid grid-cols-4 gap-1.5 w-full">
                <button
                  onClick={() => handleExecuteAction('grammar')}
                  disabled={!inputText.trim() || isGenerating}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all ${
                    activeAction === 'grammar'
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40'
                  }`}
                  title="Fix Grammar & Spelling"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-400 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Grammar</span>
                </button>

                <button
                  onClick={() => handleExecuteAction('professional')}
                  disabled={!inputText.trim() || isGenerating}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all ${
                    activeAction === 'professional'
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40'
                  }`}
                  title="Professional Tone"
                >
                  <Briefcase className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Formal</span>
                </button>

                <button
                  onClick={() => handleExecuteAction('simplify')}
                  disabled={!inputText.trim() || isGenerating}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all ${
                    activeAction === 'simplify'
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40'
                  }`}
                  title="Simplify Complex Text"
                >
                  <Feather className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Simplify</span>
                </button>

                <button
                  onClick={() => handleExecuteAction('concise')}
                  disabled={!inputText.trim() || isGenerating}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all ${
                    activeAction === 'concise'
                      ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                      : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-40'
                  }`}
                  title="Make Concise"
                >
                  <Scissors className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                  <span className="text-[10px] font-medium leading-tight">Concise</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Output & Diff Card */}
        <div className="flex-1 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/90">
            {/* View Switcher: Result vs Diff */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] transition-all ${
                  activeTab === 'editor'
                    ? 'bg-brand-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenLine className="w-3 h-3" />
                Result
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                disabled={!resultText}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] transition-all ${
                  activeTab === 'diff'
                    ? 'bg-brand-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                }`}
              >
                <Eye className="w-3 h-3" />
                Diff View
              </button>
            </div>

            {/* Performance Stats */}
            {stats && (
              <span className="text-[10px] text-brand-400 font-mono font-medium">
                {stats.tokensPerSecond} tok/s ({stats.totalTimeMs}ms)
              </span>
            )}
          </div>

          <div className="flex-1 p-3 overflow-y-auto leading-relaxed">
            {isGenerating && !resultText ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>Running local WebGPU inference...</span>
              </div>
            ) : activeTab === 'diff' ? (
              <div className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {diffParts.map((part, idx) => {
                  if (part.type === 'added') {
                    return (
                      <span key={idx} className="bg-emerald-500/15 text-emerald-300 px-0.5 rounded border border-emerald-500/25">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.type === 'removed') {
                    return (
                      <span key={idx} className="bg-rose-500/15 text-rose-300 line-through px-0.5 rounded border border-rose-500/25 opacity-75">
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-slate-300">{part.value}</span>;
                })}
              </div>
            ) : (
              <div className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                {resultText || (
                  <span className="text-slate-600 italic">
                    Improved text will stream here in real time...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!resultText && !inputText}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 disabled:opacity-40 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!resultText && !inputText}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors"
            title="Download TXT"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleApplyToPage}
          disabled={!resultText}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-[11px] transition-all shadow-md shadow-brand-600/20 disabled:opacity-40 active:scale-[0.98]"
        >
          {applied ? <Check className="w-3.5 h-3.5 text-white" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {applied ? 'Applied to Webpage!' : 'Apply to Webpage'}
        </button>
      </footer>
    </div>
  );
};
