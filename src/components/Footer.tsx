import React from 'react';
import { ShieldCheck, Cpu, WifiOff, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Privacy Statement */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>All processing happens locally in your browser.</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            Your text never leaves your device. No cloud APIs, no backend databases, and no telemetry.
            Model weights are stored directly in your browser's persistent cache.
          </p>
        </div>

        {/* Feature badges */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span>WebGPU Hardware Acceleration</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 text-indigo-500" />
            <span>Works Fully Offline Once Cached</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>Open Weights: Qwen, Phi & TinyLlama</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
