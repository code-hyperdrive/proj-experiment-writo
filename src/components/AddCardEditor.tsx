/**
 * AddCardEditor React Component
 * Deliverable 3: Updated text box component integrating the AI toggle,
 * action buttons, progress bar, and in-place replacement with undo support.
 * 100% Client-Side In-Browser AI Assistant via WebGPU and WebLLM.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Square,
  HardDrive,
  Loader2,
  AlertTriangle,
  Briefcase,
  Feather,
  CheckCheck,
  Scissors
} from 'lucide-react';
import { useWebLLM } from '../hooks/useWebLLM';
import { ActionType, ModelOption } from '../types';
import { AVAILABLE_MODELS } from '../constants/models';

export interface AddCardEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const AddCardEditor: React.FC<AddCardEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel: _onCancel,
  maxLength = 500,
  placeholder = "What's on your mind?",
  disabled = false,
}) => {
  const [isAssistantEnabled, setIsAssistantEnabled] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    modelId,
    selectModel,
    status,
    progress,
    activeAction: _activeAction,
    stats,
    loadModel,
    executeAction,
    stopGeneration,
    isSimulationMode,
    setIsSimulationMode,
    gpuInfo,
    networkInfo,
  } = useWebLLM();

  const isWebGPUSupported = gpuInfo?.supported ?? false;

  const isBusy = status === 'downloading' || status === 'loading';
  const isGenerating = status === 'generating';

  // Toggle Assistant
  const handleToggle = useCallback(
    (enabled: boolean) => {
      setIsAssistantEnabled(enabled);
      if (enabled && status === 'unloaded') {
        loadModel();
      }
    },
    [status, loadModel]
  );

  // Execute AI action with in-place text replacement & undo stack
  const handleAction = useCallback(
    (action: ActionType) => {
      const trimmed = value.trim();
      if (!trimmed || isGenerating || isBusy) return;

      // Save previous draft into history stack
      setHistory((prev) => [...prev, value]);

      // Stream text directly in-place into the textarea
      executeAction(action, trimmed, (updatedText: string) => {
        onChange(updatedText);
      });
    },
    [value, isGenerating, isBusy, executeAction, onChange]
  );

  // Undo Revision
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    onChange(previous);
  }, [history, onChange]);

  // Keyboard shortcut: Ctrl + Enter or Cmd + Enter = ✨ Improve Writing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isAssistantEnabled && value.trim() && !isGenerating && !isBusy) {
          e.preventDefault();
          handleAction('improve');
        } else if (!isAssistantEnabled && onSave) {
          e.preventDefault();
          onSave(value);
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [isAssistantEnabled, value, isGenerating, isBusy, handleAction, onSave]);

  // Derived metrics
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const currentModel = AVAILABLE_MODELS.find((m: ModelOption) => m.id === modelId) || AVAILABLE_MODELS[0];
  const percent = Math.round((progress?.progress || 0) * 100);

  return (
    <div className="flex flex-col gap-2 w-full font-sans">
      {/* Top Header & AI Assistant Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Your thoughts (max {maxLength} characters)
        </label>

        {/* AI Assistant Switch */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="aiToggle"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Sparkles
              className={`w-4 h-4 ${
                isAssistantEnabled ? 'text-indigo-600 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>AI Assistant</span>
          </label>
          <button
            id="aiToggle"
            type="button"
            role="switch"
            aria-checked={isAssistantEnabled}
            onClick={() => handleToggle(!isAssistantEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isAssistantEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAssistantEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* AI Assistant Controls (Visible only when toggle is ON) */}
      {isAssistantEnabled && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2.5 transition-all">
          {/* WebGPU Fallback Alert if not supported */}
          {!isWebGPUSupported && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  WebGPU not detected (requires Chrome 113+, Edge 113+, Safari 18+). Simulation mode active.
                </span>
              </div>
              <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSimulationMode}
                  onChange={(e) => setIsSimulationMode(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Simulation
              </label>
            </div>
          )}

          {/* Model Selection & Bandwidth Speed Tier */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
                title={`Detected speed: ${networkInfo.speedMbps} Mbps`}
              >
                ⚡ {networkInfo.speedMbps} Mbps ({networkInfo.tier})
              </span>
              <select
                value={modelId}
                onChange={(e) => selectModel(e.target.value)}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
              >
                {AVAILABLE_MODELS.map((m: ModelOption) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.family}) {m.recommended ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <HardDrive className="w-3 h-3" />
                Cached Offline
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  status === 'ready'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : isBusy || isGenerating
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'ready' ? 'bg-emerald-500' : isBusy ? 'bg-indigo-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                {status === 'ready'
                  ? 'Ready (WebGPU)'
                  : status === 'downloading'
                  ? 'Downloading...'
                  : status === 'loading'
                  ? 'Loading to VRAM...'
                  : status === 'generating'
                  ? 'Rewriting...'
                  : 'Idle'}
              </span>
            </div>
          </div>

          {/* Download & GPU Load Progress Bar */}
          {isBusy && (
            <div className="p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>
                    {status === 'downloading'
                      ? `Downloading ${currentModel.name}`
                      : 'Allocating GPU memory buffers'}
                  </span>
                </div>
                <span>{percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-200/50 dark:bg-indigo-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(4, percent)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 truncate">
                {progress.text || 'Preparing WebGPU shaders...'}
              </div>
            </div>
          )}

          {/* The 5 Writing Improvement Action Buttons */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => handleAction('improve')}
              disabled={!value.trim() || isBusy || isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
              title="Enter / Ctrl + Enter"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Improve Writing</span>
              <span className="text-[10px] bg-white/20 px-1 py-0.5 rounded font-mono">Ctrl+↵</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('professional')}
              disabled={!value.trim() || isBusy || isGenerating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <span>Professional Tone</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('simplify')}
              disabled={!value.trim() || isBusy || isGenerating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Feather className="w-3.5 h-3.5 text-amber-500" />
              <span>Simplify</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('grammar')}
              disabled={!value.trim() || isBusy || isGenerating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fix Grammar</span>
            </button>

            <button
              type="button"
              onClick={() => handleAction('concise')}
              disabled={!value.trim() || isBusy || isGenerating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <Scissors className="w-3.5 h-3.5 text-rose-500" />
              <span>Make Concise</span>
            </button>

            {/* Stop Generation Button */}
            {isGenerating && (
              <button
                type="button"
                onClick={stopGeneration}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold animate-pulse transition-all"
              >
                <Square className="w-3 h-3 fill-rose-600" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Single Main Textarea with In-Place Replacement */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          rows={5}
          placeholder={placeholder}
          className={`w-full p-3.5 rounded-xl border-2 text-base leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all ${
            isGenerating
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
          }`}
        />
      </div>

      {/* Footer Metrics & Undo Revision */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className={charCount > maxLength ? 'text-rose-500 font-bold' : ''}>
            {charCount} / {maxLength} characters
          </span>
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>~{readingTimeMinutes} min read</span>
          {stats && (
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              ⚡ {stats.tokensPerSecond} tok/s ({stats.totalTimeMs}ms)
            </span>
          )}
        </div>

        {/* Undo Revision Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Revision ({history.length})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AddCardEditor;
