import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Sparkles, 
  FileText, 
  Eye, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { HistoryEntry } from '../types';
import { DiffViewer } from './DiffViewer';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  currentText: string;
  onRestore: (entryText: string) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentText,
  onRestore,
  onDeleteEntry,
  onClearAll,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Set default selected entry to the first (latest) entry
  useEffect(() => {
    if (entries.length > 0) {
      if (!selectedId || !entries.some((e) => e.id === selectedId)) {
        setSelectedId(entries[0].id);
      }
    } else {
      setSelectedId('');
    }
  }, [entries, selectedId]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedId) || entries[0] || null;
  }, [entries, selectedId]);

  if (!isOpen) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy history text:', e);
    }
  };

  const handleRestore = (text: string) => {
    onRestore(text);
    onClose();
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="w-full max-w-4xl h-[88vh] max-h-[720px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all"
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="history-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Version History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {entries.length} {entries.length === 1 ? 'version' : 'versions'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse, compare diffs, and restore any previous draft
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-1 rounded-lg">
                    <span className="text-xs text-rose-600 dark:text-rose-400">Clear all?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-1.5 py-0.5 rounded text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Clear all saved history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-3 text-slate-400">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No version history yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              As you write and apply AI improvements, previous revisions will automatically be recorded here so you can revisit or restore them anytime.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            
            {/* Left Column: Revision List */}
            <div className="w-full sm:w-80 md:w-96 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-900/40">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Saved Timeline
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {entries.map((entry) => {
                  const isSelected = selectedEntry?.id === entry.id;
                  const isCurrent = entry.text === currentText;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(entry.id);
                        setShowDiff(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-brand-500/40 shadow-sm ring-1 ring-brand-500/20'
                          : 'bg-white/60 dark:bg-slate-850/60 border-slate-200/60 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 truncate">
                            {entry.actionLabel.includes('Draft') ? (
                              <FileText className="w-3 h-3 text-slate-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-brand-500" />
                            )}
                            <span className="truncate">{entry.actionLabel}</span>
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-sans">
                        {entry.text || <span className="italic text-slate-400">(Empty document)</span>}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {entry.words} {entry.words === 1 ? 'word' : 'words'} • {entry.characters} chars
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-brand-500 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Version Preview & Actions */}
            {selectedEntry && (
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                {/* Preview Toolbar */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEntry.actionLabel}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTimestamp(selectedEntry.timestamp)}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {selectedEntry.words} words
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Compare / Diff View */}
                    <button
                      type="button"
                      onClick={() => setShowDiff(!showDiff)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        showDiff
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/30 text-brand-600 dark:text-brand-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title="Compare this version with your current editor text"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showDiff ? 'Standard View' : 'Compare Diff'}</span>
                    </button>

                    {/* Copy Version */}
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEntry.text)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy this version"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Delete Entry */}
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(selectedEntry.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete this history entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Restore Button */}
                    <button
                      type="button"
                      onClick={() => handleRestore(selectedEntry.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all"
                      title="Load this version into the editor"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Use This Version</span>
                    </button>
                  </div>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-base leading-relaxed text-slate-800 dark:text-slate-100 font-sans">
                  {showDiff ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                        <AlertCircle className="w-4 h-4 text-brand-500 shrink-0" />
                        <span>Comparing this version against your current editor text.</span>
                      </div>
                      <DiffViewer original={selectedEntry.text} improved={currentText} />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words select-text">
                      {selectedEntry.text ? (
                        selectedEntry.text
                      ) : (
                        <span className="italic text-slate-400">This version contains no text.</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default HistoryModal;
