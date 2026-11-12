import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Puzzle, 
  Check, 
  Copy, 
  ShieldCheck, 
  FolderArchive,
  ToggleRight,
  MousePointerClick
} from 'lucide-react';

interface InstallExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallExtensionModal: React.FC<InstallExtensionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleCopyExtensionsUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDownload = () => {
    setDownloadStarted(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = '/writo.zip';
    link.download = 'writo.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-1 ring-white/20">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Install Writo Extension
                </h2>
                <span className="text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                  Manifest V3
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI writing, fixing, and tone adjustment on any website
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Hero Download Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-slate-800/90 dark:to-slate-850/80 border border-brand-100 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-600/30">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Writo Extension Package
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  writo.zip (~2.3 MB) • Free & Open Source
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-600/25 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStarted ? 'Downloaded writo.zip' : 'Download writo.zip'}</span>
            </button>
          </div>

          {/* 3 Step Visual Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              3 Quick Steps to Install (30 Seconds)
            </h4>

            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <FolderArchive className="w-4 h-4 text-brand-500" />
                  <span>Unzip <code className="text-brand-600 dark:text-brand-400 font-mono text-xs">writo.zip</code></span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Double-click the downloaded <strong className="text-slate-700 dark:text-slate-300">writo.zip</strong> file. This extracts a clean folder named <strong className="text-slate-700 dark:text-slate-300">writo</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <ToggleRight className="w-4 h-4 text-brand-500" />
                    <span>Open Extensions & Toggle Developer Mode</span>
                  </div>
                  <button
                    onClick={handleCopyExtensionsUrl}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Copy chrome://extensions to clipboard"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedUrl ? 'Copied URL' : 'chrome://extensions'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Paste <code className="bg-slate-200 dark:bg-slate-700/60 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">chrome://extensions</code> in your address bar, then switch <strong className="text-slate-700 dark:text-slate-300">Developer mode</strong> toggle to <strong className="text-brand-600 dark:text-brand-400">ON</strong> (top-right corner).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <MousePointerClick className="w-4 h-4 text-brand-500" />
                  <span>Click "Load unpacked" & select the "writo" folder</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Click the <strong className="text-slate-700 dark:text-slate-300">Load unpacked</strong> button (top-left) and select the extracted <strong className="text-slate-700 dark:text-slate-300">writo</strong> folder. That's it! Writo is instantly installed.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Browser Support Footer */}
          <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>100% Private • Local WebGPU LLM • Zero Telemetry</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
              Chrome • Brave • Arc • Edge
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
