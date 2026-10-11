import React from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Feather, 
  CheckCheck, 
  Scissors, 
  Loader2, 
  Square,
  Command
} from 'lucide-react';
import { ActionType, EngineStatus } from '../types';

interface ActionToolbarProps {
  onAction: (action: ActionType) => void;
  onStop: () => void;
  status: EngineStatus;
  activeAction: ActionType | null;
  disabled: boolean;
  hasSelection?: boolean;
  selectedWordCount?: number;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onAction,
  onStop,
  status,
  activeAction,
  disabled,
  hasSelection = false,
  selectedWordCount = 0,
}) => {
  const isGenerating = status === 'generating';
  const isBusy = status === 'downloading' || status === 'loading';

  return (
    <div className="flex flex-col items-center gap-2 w-full py-1">
      {hasSelection && selectedWordCount > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-[11px] font-medium text-brand-700 dark:text-brand-300">
          <span>Targeting selection:</span>
          <strong className="font-semibold">{selectedWordCount} {selectedWordCount === 1 ? 'word' : 'words'}</strong>
        </div>
      )}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 w-full">
      
      {/* 1. Improve Writing (Primary Action) */}
      <button
        type="button"
        disabled={disabled || isBusy || (isGenerating && activeAction !== 'improve')}
        onClick={() => onAction('improve')}
        className={`col-span-2 group relative inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm ${
          activeAction === 'improve' && isGenerating
            ? 'bg-brand-600 text-white shadow-brand-500/25 ring-2 ring-brand-500/50'
            : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white shadow-brand-600/20 hover:shadow-brand-600/30'
        } disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none`}
      >
        {activeAction === 'improve' && isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-brand-200 group-hover:rotate-12 transition-transform" />
        )}
        <span>Improve Writing</span>
        <span className="hidden md:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white font-mono">
          <Command className="w-2.5 h-2.5" /> Enter
        </span>
      </button>

      {/* 2. Fix Grammar */}
      <button
        type="button"
        disabled={disabled || isBusy || (isGenerating && activeAction !== 'grammar')}
        onClick={() => onAction('grammar')}
        className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
          activeAction === 'grammar' && isGenerating
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {activeAction === 'grammar' && isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
        ) : (
          <CheckCheck className="w-4 h-4 text-indigo-500" />
        )}
        <span>Fix Grammar</span>
      </button>

      {/* 3. Simplify */}
      <button
        type="button"
        disabled={disabled || isBusy || (isGenerating && activeAction !== 'simplify')}
        onClick={() => onAction('simplify')}
        className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
          activeAction === 'simplify' && isGenerating
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {activeAction === 'simplify' && isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
        ) : (
          <Feather className="w-4 h-4 text-emerald-500" />
        )}
        <span>Simplify</span>
      </button>

      {/* 4. Professional Tone */}
      <button
        type="button"
        disabled={disabled || isBusy || (isGenerating && activeAction !== 'professional')}
        onClick={() => onAction('professional')}
        className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
          activeAction === 'professional' && isGenerating
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {activeAction === 'professional' && isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
        ) : (
          <Briefcase className="w-4 h-4 text-sky-500" />
        )}
        <span>Professional Tone</span>
      </button>

      {/* 5. Make Concise */}
      <button
        type="button"
        disabled={disabled || isBusy || (isGenerating && activeAction !== 'concise')}
        onClick={() => onAction('concise')}
        className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
          activeAction === 'concise' && isGenerating
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {activeAction === 'concise' && isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
        ) : (
          <Scissors className="w-4 h-4 text-amber-500" />
        )}
        <span>Make Concise</span>
      </button>

      {/* Stop generation button when active */}
      {isGenerating && (
        <button
          type="button"
          onClick={onStop}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors animate-pulse"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
          <span className="text-[10px] bg-rose-200/60 dark:bg-rose-900/60 px-1 py-0.5 rounded font-mono">Esc</span>
        </button>
      )}

      </div>
    </div>
  );
};
