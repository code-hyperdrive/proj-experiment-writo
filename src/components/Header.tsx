import React from 'react';
import { 
  Moon, 
  Sun, 
  Cpu, 
  Sparkles,
  Zap,
  ChevronDown
} from 'lucide-react';
import { EngineStatus } from '../types';
import { AVAILABLE_MODELS } from '../constants/models';

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  status: EngineStatus;
  modelId: string;
  onSelectModel: (id: string) => void;
  isSimulationMode: boolean;
  onToggleSimulationMode?: () => void;
  cachedModelIds?: string[];
  downloadingModelId?: string | null;
  onCancelDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleDark,
  status,
  modelId,
  onSelectModel,
  isSimulationMode,
  onToggleSimulationMode,
  cachedModelIds = [],
  downloadingModelId,
  onCancelDownload,
}) => {
  const getStatusBadge = () => {
    if (isSimulationMode) {
      return (
        <button
          type="button"
          onClick={onToggleSimulationMode}
          title="Demo Mode is active. Click to switch to WebGPU mode."
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
        >
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Demo Mode</span>
        </button>
      );
    }
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Ready
          </span>
        );
      case 'downloading':
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Downloading...
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3 h-3 text-purple-500 animate-spin" />
            Generating...
          </span>
        );
      case 'fallback':
      case 'error':
        return (
          <button
            type="button"
            onClick={onToggleSimulationMode}
            title="WebGPU offline. Click to enable instant Demo Mode."
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Enable Demo Mode</span>
          </button>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Cpu className="w-3 h-3 text-slate-400" />
            Model Standby
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Title & Brand */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Writo
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Writing Assistant
              </p>
            </div>
          </div>

          {/* Mobile dark mode button */}
          <div className="sm:hidden flex items-center gap-1.5">
            <button
              onClick={onToggleDark}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Controls: Model selector & theme toggle (visible on both mobile & desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Cancel download button if currently downloading */}
          {status === 'downloading' && onCancelDownload && (
            <button
              type="button"
              onClick={onCancelDownload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors shrink-0"
              title="Cancel current download and stay on active power stage"
            >
              <span>Cancel</span>
            </button>
          )}

          {/* Power Stage Selector Dropdown */}
          <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-auto shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="font-medium text-slate-400 shrink-0">Power:</span>
              <div className="relative flex items-center flex-1 min-w-0">
                <select
                  aria-label="Select Writing Power Stage"
                  value={modelId}
                  disabled={status === 'generating'}
                  onChange={(e) => onSelectModel(e.target.value)}
                  className="appearance-none bg-transparent border-none outline-none cursor-pointer font-semibold pr-5 text-slate-800 dark:text-slate-200 disabled:opacity-50 w-full truncate"
                >
                  {AVAILABLE_MODELS.map((m) => {
                    const isCached = cachedModelIds.includes(m.id);
                    const isDownloading = downloadingModelId === m.id;
                    const symbol = isDownloading ? '⏳' : isCached ? '✓' : '○';
                    return (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                        {symbol} {m.name} ({m.family}){m.recommended ? ' ★' : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-0.5 shrink-0" />
              </div>

              {/* Status pill for the currently selected model */}
              {cachedModelIds.includes(modelId) ? (
                <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1" title="Model weights are ready on your device">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ✓ Ready
                </span>
              ) : downloadingModelId === modelId ? (
                <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  ⏳ Loading
                </span>
              ) : (
                <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-600/40" title="Model weights will load on first use">
                  ○ On Demand
                </span>
              )}
            </div>
          </div>

          {/* Dark Mode Toggle (Desktop) */}
          <button
            onClick={onToggleDark}
            aria-label="Toggle theme"
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700/50"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
