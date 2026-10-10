import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ArrowLeftRight, 
  Download, 
  GitCompare, 
  Sparkles, 
  Zap, 
  FileCheck
} from 'lucide-react';
import { GenerationStats, TextMetrics } from '../types';
import { DiffViewer } from './DiffViewer';
import { calculateMetrics } from '../utils/textStats';

interface ResultViewerProps {
  originalText: string;
  resultText: string;
  isGenerating: boolean;
  stats: GenerationStats | null;
  onReplaceOriginal: (newText: string) => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  originalText,
  resultText,
  isGenerating,
  stats,
  onReplaceOriginal,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [replacedAlert, setReplacedAlert] = useState<boolean>(false);

  const resultMetrics: TextMetrics = calculateMetrics(resultText);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  // Replace original draft in the text editor
  const handleReplace = () => {
    if (!resultText) return;
    onReplaceOriginal(resultText);
    setReplacedAlert(true);
    setTimeout(() => setReplacedAlert(false), 2500);
  };

  // Download improved text as a .txt file
  const handleDownloadTxt = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `improved-writing-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasOutput = resultText.length > 0;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all">
      
      {/* Header Bar */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Improved Version
          </span>

          {/* Replaced banner badge */}
          {replacedAlert && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-fadeIn">
              <Check className="w-3 h-3" /> Replaced editor draft!
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Diff Toggle */}
          {hasOutput && originalText.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDiff(!showDiff)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                showDiff
                  ? 'bg-brand-500 text-white font-medium'
                  : 'bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="Toggle visual diff comparison"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{showDiff ? 'Raw Text' : 'Diff View'}</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            disabled={!hasOutput}
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Replace Original Button */}
          <button
            type="button"
            disabled={!hasOutput}
            onClick={handleReplace}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Replace editor content with this revision"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Replace Original</span>
            <span className="sm:hidden">Replace</span>
          </button>

          {/* Download TXT */}
          <button
            type="button"
            disabled={!hasOutput}
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1 p-1 rounded bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Download result as .txt file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 min-h-[280px] sm:min-h-[340px] p-4 sm:p-5 overflow-y-auto">
        {hasOutput ? (
          showDiff ? (
            <DiffViewer original={originalText} improved={resultText} />
          ) : (
            <div className="font-sans text-slate-800 dark:text-slate-100 text-base leading-relaxed whitespace-pre-wrap select-text">
              {resultText}
              {isGenerating && (
                <span className="inline-block w-2 h-4 ml-1 bg-brand-500 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-600 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-3 text-slate-400">
              <FileCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Your polished text will appear here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Select one of the action buttons above to trigger private local processing.
            </p>
          </div>
        )}
      </div>

      {/* Results Footer: Metrics & Generation Stats */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            <strong className="text-slate-700 dark:text-slate-300 font-medium">
              {resultMetrics.words}
            </strong>{' '}
            words
          </span>
          <span className="font-mono">
            <strong className="text-slate-700 dark:text-slate-300 font-medium">
              {resultMetrics.characters}
            </strong>{' '}
            chars
          </span>
        </div>

        {/* Inference performance pill */}
        {stats && (
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-3 h-3 text-amber-500" />
              {stats.tokensPerSecond} tok/s
            </span>
            <span>•</span>
            <span>{stats.tokens} tokens</span>
            <span>•</span>
            <span>{(stats.totalTimeMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

    </div>
  );
};
