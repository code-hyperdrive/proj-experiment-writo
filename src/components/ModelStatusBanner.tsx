import React from 'react';
import { 
  DownloadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  HardDrive, 
  RefreshCw, 
  Play,
  Wifi,
  Gauge
} from 'lucide-react';
import { EngineStatus, LoadingProgress, NetworkInfo } from '../types';
import { AVAILABLE_MODELS } from '../constants/models';
import { WebGPUCheckResult } from '../utils/webgpu';
import { estimateDownloadTimeSeconds } from '../utils/networkSpeed';

interface ModelStatusBannerProps {
  status: EngineStatus;
  progress: LoadingProgress;
  modelId: string;
  gpuInfo: WebGPUCheckResult | null;
  errorMessage: string | null;
  onLoadModel: () => void;
  isSimulationMode: boolean;
  onToggleSimulation: () => void;
  networkInfo: NetworkInfo;
  onRecheckSpeed: () => void;
}

export const ModelStatusBanner: React.FC<ModelStatusBannerProps> = ({
  status,
  progress,
  modelId,
  gpuInfo,
  errorMessage,
  onLoadModel,
  isSimulationMode,
  onToggleSimulation,
  networkInfo,
  onRecheckSpeed,
}) => {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId) || AVAILABLE_MODELS[0];
  const percent = Math.min(100, Math.round(progress.progress * 100));
  const estimatedSeconds = estimateDownloadTimeSeconds(model.sizeMB, networkInfo.speedMbps);

  // Network badge helper
  const renderNetworkBadge = () => {
    const isFast = networkInfo.tier === 'fast';
    const isModerate = networkInfo.tier === 'moderate';

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRecheckSpeed}
          title="Click to re-test network bandwidth"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-colors border bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        >
          {networkInfo.isTesting ? (
            <RefreshCw className="w-3 h-3 animate-spin text-brand-500" />
          ) : (
            <Wifi className={`w-3 h-3 ${isFast ? 'text-emerald-500' : isModerate ? 'text-amber-500' : 'text-rose-500'}`} />
          )}
          <span>
            {networkInfo.isTesting ? 'Testing speed...' : `${networkInfo.speedMbps} Mbps`}
          </span>
          <span className="text-[10px] text-slate-400 capitalize">
            ({networkInfo.tier})
          </span>
        </button>

        {estimatedSeconds > 0 && status === 'unloaded' && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans hidden md:inline">
            Est. download: ~{estimatedSeconds}s
          </span>
        )}
      </div>
    );
  };

  // If in simulation mode
  if (isSimulationMode) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-4 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Interactive Preview Mode Active
              </h2>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Simulating local LLM transforms instantaneously without downloading weights. Ideal for testing UI or unsupported browsers.
              </p>
            </div>
          </div>
          {gpuInfo?.supported && (
            <button
              onClick={onToggleSimulation}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              Switch to Real WebGPU Model
            </button>
          )}
        </div>
      </div>
    );
  }

  // If WebGPU is unsupported or failed
  if (status === 'fallback' || (!gpuInfo?.supported && gpuInfo !== null)) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-4 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                WebGPU is not enabled in this browser
              </h2>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                {errorMessage || 'Hardware-accelerated WebGPU is needed to run weights directly on your GPU.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supported browsers: Chrome 113+, Edge 113+, Arc, Brave, or Safari 18+ on modern GPUs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={onToggleSimulation}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Enable Preview Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Downloading or Loading progress
  if (status === 'downloading' || status === 'loading') {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 dark:bg-brand-950/20 p-4 transition-all">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-brand-500 animate-bounce" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {status === 'downloading' ? 'Downloading Model Weights' : 'Initializing Shader Pipeline & Memory'}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                ({model.name})
              </span>
            </div>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
              {percent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(4, percent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[70%] font-mono">
              {progress.text || 'Preparing WebGPU runtime...'}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-400" />
              Cached permanently in browser
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Ready State
  if (status === 'ready') {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-3 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Local AI Engine Ready:</span>{' '}
            <span>{model.name} is running live inside browser memory via WebGPU.</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
          <span className="bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
            Local WebGPU
          </span>
          <span>•</span>
          <span>Offline Ready</span>
        </div>
      </div>
    );
  }

  // Unloaded initial standby state with Smart Speed recommendation
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4 transition-all space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        {/* Model Details */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {model.name}
              </h2>
              {model.recommended && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {networkInfo.recommendationReason || model.description}
            </p>
          </div>
        </div>

        {/* Network Speed & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
          {renderNetworkBadge()}

          <button
            onClick={onLoadModel}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-600 dark:hover:bg-brand-400 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Load Model</span>
          </button>
          
          <button
            onClick={onToggleSimulation}
            title="Try without downloading full model weights"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

      </div>
    </div>
  );
};
