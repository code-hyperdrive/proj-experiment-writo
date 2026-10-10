import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  AlignLeft, 
  Clock, 
  Loader2, 
  HardDrive,
  Eye,
  PenLine,
  CheckCircle2,
  Zap,
  FileDown,
  History,
  BookmarkPlus
} from 'lucide-react';
import { TextMetrics, EngineStatus, LoadingProgress, NetworkInfo, ActionType, GenerationStats } from '../types';
import { ActionToolbar } from './ActionToolbar';
import { DiffViewer } from './DiffViewer';
import { AVAILABLE_MODELS } from '../constants/models';

interface UnifiedEditorProps {
  text: string;
  onChange: (val: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  metrics: TextMetrics;
  isAssistantEnabled: boolean;
  onToggleAssistant: (enabled: boolean) => void;
  status: EngineStatus;
  progress: LoadingProgress;
  modelId: string;
  activeAction: ActionType | null;
  onAction: (action: ActionType, selectedText?: string, selectionRange?: { start: number; end: number }) => void;
  onStop: () => void;
  networkInfo: NetworkInfo;
  previousText?: string;
  stats?: GenerationStats | null;
  isSimulationMode?: boolean;
  onToggleSimulationMode?: () => void;
  isSaved?: boolean;
  onOpenHistory: () => void;
  historyCount?: number;
  onSaveSnapshot?: () => void;
  onSelectModel?: (id: string) => void;
  cachedModelIds?: string[];
  downloadingModelId?: string | null;
  activeLoadedModelId?: string | null;
  onCancelDownload?: () => void;
}

export const UnifiedEditor: React.FC<UnifiedEditorProps> = ({
  text,
  onChange,
  onUndo,
  canUndo,
  metrics,
  isAssistantEnabled,
  onToggleAssistant,
  status,
  progress,
  modelId,
  activeAction,
  onAction,
  onStop,
  networkInfo: _networkInfo,
  previousText,
  stats,
  isSimulationMode = false,
  onToggleSimulationMode,
  isSaved = true,
  onOpenHistory,
  historyCount = 0,
  onSaveSnapshot,
  onSelectModel,
  cachedModelIds = [],
  downloadingModelId,
  activeLoadedModelId,
  onCancelDownload,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'edit' | 'diff'>('edit');
  const [selection, setSelection] = useState<{ start: number; end: number; text: string; words: number }>({
    start: 0,
    end: 0,
    text: '',
    words: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isGenerating = status === 'generating';
  const isBusy = status === 'downloading' || status === 'loading';
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === modelId) || AVAILABLE_MODELS[0];
  const percent = Math.min(100, Math.round(progress.progress * 100));

  // If text was reverted or changed so diff has no difference, return to edit mode
  useEffect(() => {
    if (viewMode === 'diff' && (!previousText || previousText === text)) {
      setViewMode('edit');
    }
  }, [viewMode, previousText, text]);

  // Track user text selection
  const updateSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selectedStr = textarea.value.substring(start, end).trim();
      const words = selectedStr ? selectedStr.split(/\s+/).length : 0;
      setSelection({ start, end, text: selectedStr, words });
    } else {
      setSelection({ start: 0, end: 0, text: '', words: 0 });
    }
  }, []);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!text) return;
    const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `writo-draft-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleActionClick = (action: ActionType) => {
    if (!isAssistantEnabled) {
      onToggleAssistant(true);
    }

    if (selection.words > 0) {
      onAction(action, selection.text, { start: selection.start, end: selection.end });
    } else {
      onAction(action);
    }
  };

  const handleUndoRevision = () => {
    onUndo();
    if (viewMode === 'diff') {
      setViewMode('edit');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-500/20">
      
      {/* Top Bar: Controls & View Mode Toggle */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: View Mode Tabs (Edit vs Changes) & Undo */}
        <div className="flex items-center gap-2">
          {/* Edit / Changes Mode Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            {canUndo && previousText && previousText !== text && (
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'diff'
                    ? 'bg-brand-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'
                }`}
                title="Inspect color-coded changes made by the AI"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Changes</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}
          </div>

          {/* Undo Revision Button */}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndoRevision}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors border border-amber-500/20"
              title="Undo last AI revision and revert to previous text (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Revision</span>
            </button>
          )}

          {/* Version History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Browse, compare, and restore previous draft versions"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-300 dark:bg-slate-700 font-mono font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Copy, Download, Clear & Assistant Toggle */}
        <div className="flex items-center gap-3">
          {/* Action icons */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
            {text.length > 0 && (
              <>
                {onSaveSnapshot && (
                  <button
                    type="button"
                    onClick={onSaveSnapshot}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                    title="Save a snapshot to history"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  title="Copy text to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  title="Download as Plain Text (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('md')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  title="Download as Markdown (.md)"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Clear text (Undoable)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* AI Assistance Toggle Switch */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${isAssistantEnabled ? 'text-brand-500 fill-brand-500/20 animate-pulse' : 'text-slate-400'}`} />
              <span>AI Assistant</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isAssistantEnabled}
              onClick={() => onToggleAssistant(!isAssistantEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                isAssistantEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAssistantEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>

      {/* Main Single Text Box or Diff Comparison View */}
      <div className="relative min-h-[360px] sm:min-h-[440px]">
        {/* Top edge animated gradient shimmer when generating */}
        {isGenerating && (
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 animate-pulse z-20" />
        )}

        {/* Non-obstructive floating status badge during streaming */}
        {isGenerating && (
          <div className="absolute top-3 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-brand-500/30 shadow-md text-xs font-medium text-brand-600 dark:text-brand-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
            <span>Rewriting {selection.words > 0 ? 'selection' : 'draft'}...</span>
            <button
              type="button"
              onClick={onStop}
              className="ml-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 underline underline-offset-2"
              title="Stop generation (Esc)"
            >
              Stop (Esc)
            </button>
          </div>
        )}

        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onSelect={updateSelection}
            onKeyUp={updateSelection}
            onMouseUp={updateSelection}
            readOnly={isGenerating}
            placeholder="Type or paste your text here... Highlight any phrase to rewrite specific sentences."
            className="w-full h-full min-h-[360px] sm:min-h-[440px] p-5 sm:p-6 resize-y bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none text-base leading-relaxed font-sans"
          />
        ) : (
          <div className="p-6 min-h-[360px] sm:min-h-[440px] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Added words
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 line-through" /> Removed words
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className="px-3 py-1 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
                >
                  Keep Changes
                </button>
                <button
                  type="button"
                  onClick={handleUndoRevision}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Revert Revision
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <DiffViewer original={previousText || ''} improved={text} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics & Status Bar */}
      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium">
              {metrics.words.toLocaleString()}
            </strong>{' '}
            {metrics.words === 1 ? 'word' : 'words'}
          </span>
          <span className="font-mono">
            <strong className="text-slate-700 dark:text-slate-300 font-medium">
              {metrics.characters.toLocaleString()}
            </strong>{' '}
            characters
          </span>
          <span className="hidden md:inline">
            <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium">
              {metrics.sentences}
            </strong>{' '}
            {metrics.sentences === 1 ? 'sentence' : 'sentences'}
          </span>

          {/* Highlight Selection Indicator */}
          {selection.words > 0 && (
            <span className="text-brand-600 dark:text-brand-400 font-medium">
              ({selection.words} {selection.words === 1 ? 'word' : 'words'} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {/* Generation Speed Badge */}
          {stats && stats.tokensPerSecond > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
              ⚡ {stats.tokensPerSecond} tok/s • {(stats.totalTimeMs / 1000).toFixed(1)}s
            </span>
          )}

          {/* Auto-Save Indicator */}
          <span className="flex items-center gap-1">
            {isSaved ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                <span>Saving...</span>
              </>
            )}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>~{metrics.readingTimeMinutes} min read</span>
          </span>
        </div>
      </div>

      {/* AI Assistant Section (Action Toolbar & Status) */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 transition-all space-y-3">
        
        {/* WebGPU Fallback Demo Notice if not supported */}
        {status === 'fallback' && !isSimulationMode && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>WebGPU acceleration is offline on this browser. You can test all 5 writing actions with instant simulation mode.</span>
            </div>
            {onToggleSimulationMode && (
              <button
                type="button"
                onClick={onToggleSimulationMode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs transition-colors shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Enable Demo Mode</span>
              </button>
            )}
          </div>
        )}

        {/* Download / Loading Progress if busy */}
        {isBusy && (
          <div className="p-3.5 rounded-xl border border-brand-500/20 bg-brand-500/5 dark:bg-brand-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {status === 'downloading' ? `Preparing ${currentModel.name} Power` : `Activating ${currentModel.name} Power`}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  ({currentModel.family} • ~{currentModel.sizeMB} MB)
                </span>
              </div>
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {percent}%
              </span>
            </div>
            
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, percent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-[70%] font-mono">
                {progress.text || 'Preparing WebGPU runtime...'}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                Cached locally
              </span>
            </div>

            {/* Provision to switch to an already downloaded stage or cancel so writing doesn't halt */}
            <div className="pt-2 border-t border-brand-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Continue writing with a ready power stage:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {AVAILABLE_MODELS.filter((m) => cachedModelIds.includes(m.id) && m.id !== downloadingModelId).map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => onSelectModel && onSelectModel(stage.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                    title={`Switch to ${stage.name} (${stage.family}) which is already downloaded`}
                  >
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span>Use {stage.name} (Ready)</span>
                  </button>
                ))}

                {onToggleSimulationMode && (
                  <button
                    type="button"
                    onClick={onToggleSimulationMode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30 transition-colors cursor-pointer"
                    title="Switch to Demo Mode while downloading"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Demo Mode</span>
                  </button>
                )}

                {onCancelDownload && (
                  <button
                    type="button"
                    onClick={onCancelDownload}
                    className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Cancel Download
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Toolbar with all 5 Improvement Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {selection.words > 0
                ? `Choose an action to rewrite selected text (${selection.words} words):`
                : 'Choose an improvement action to rewrite your text:'}
            </span>
            <span className="text-[11px] font-mono">
              {isSimulationMode ? 'Demo Mode' : `${currentModel.name} Power (${currentModel.family})`}
            </span>
          </div>

          <ActionToolbar
            onAction={handleActionClick}
            onStop={onStop}
            status={status}
            activeAction={activeAction}
            disabled={text.trim().length === 0 || (isBusy && !activeLoadedModelId && !isSimulationMode)}
            hasSelection={selection.words > 0}
            selectedWordCount={selection.words}
          />
        </div>

      </div>

    </div>
  );
};
