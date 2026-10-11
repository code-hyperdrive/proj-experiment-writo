import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { UnifiedEditor } from './components/UnifiedEditor';
import { HistoryModal } from './components/HistoryModal';
import { useDarkMode } from './hooks/useDarkMode';
import { useWebLLM } from './hooks/useWebLLM';
import { calculateMetrics } from './utils/textStats';
import { ActionType, HistoryEntry } from './types';

const STORAGE_KEY = 'writo_draft';
const HISTORY_STORAGE_KEY = 'writo_history_entries';

const ACTION_LABELS: Record<ActionType, string> = {
  improve: 'Improve Writing',
  grammar: 'Fix Grammar',
  professional: 'Professional Tone',
  simplify: 'Simplify',
  concise: 'Make Concise',
};

export const App: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  
  // Initialize draft from localStorage if available
  const [inputText, setInputText] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [history, setHistory] = useState<string[]>([]);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Initialize history entries from localStorage
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const {
    modelId,
    selectModel,
    status,
    progress,
    activeAction,
    stats,
    loadModel,
    executeAction,
    stopGeneration,
    isSimulationMode,
    setIsSimulationMode,
    networkInfo,
    cachedModelIds,
    downloadingModelId,
    activeLoadedModelId,
    cancelDownload,
  } = useWebLLM();

  const metrics = calculateMetrics(inputText);
  const initialRecordedRef = useRef<boolean>(false);

  // Add an entry to revision history
  const addHistoryEntry = useCallback((content: string, label: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setHistoryEntries((prev) => {
      // Avoid duplicate consecutive identical text entries
      if (prev.length > 0 && prev[0].text.trim() === trimmed) {
        return prev;
      }

      const words = trimmed.split(/\s+/).length;
      const newEntry: HistoryEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        text: content,
        actionLabel: label,
        words,
        characters: content.length,
      };

      const updated = [newEntry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history to localStorage:', e);
      }
      return updated;
    });
  }, []);

  // Record initial draft if history is empty and text exists
  useEffect(() => {
    if (!initialRecordedRef.current && inputText.trim() && historyEntries.length === 0) {
      initialRecordedRef.current = true;
      addHistoryEntry(inputText, 'Initial Draft');
    }
  }, [inputText, historyEntries.length, addHistoryEntry]);

  // Auto-save draft to localStorage with debouncing
  useEffect(() => {
    setIsSaved(false);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, inputText);
        setIsSaved(true);
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inputText]);

  // When user toggles assistant on, automatically trigger model download/loading if not loaded
  const handleToggleAssistant = useCallback((enabled: boolean) => {
    setIsAssistantEnabled(enabled);
    if (enabled && status === 'unloaded' && !isSimulationMode) {
      loadModel();
    }
  }, [status, loadModel, isSimulationMode]);

  // Toggle demo simulation mode
  const handleToggleSimulationMode = useCallback(() => {
    setIsSimulationMode((prev) => !prev);
  }, [setIsSimulationMode]);

  // Handle action execution with support for both full draft and targeted text selection
  const handleAction = useCallback(
    (action: ActionType, selectedText?: string, selectionRange?: { start: number; end: number }) => {
      const hasSelection = Boolean(selectedText && selectedText.trim());
      const targetText = hasSelection ? (selectedText as string).trim() : inputText.trim();
      
      if (!targetText) return;

      const label = ACTION_LABELS[action] || 'AI Revision';

      // Auto-enable assistant if not enabled yet
      if (!isAssistantEnabled) {
        setIsAssistantEnabled(true);
      }

      // Record current draft into history before rewriting
      addHistoryEntry(inputText, `Draft before ${label}`);
      setHistory((prev) => [...prev, inputText]);

      if (hasSelection && selectionRange && selectionRange.end > selectionRange.start) {
        const prefix = inputText.substring(0, selectionRange.start);
        const suffix = inputText.substring(selectionRange.end);

        // Stream replacement directly into the highlighted selection slot
        executeAction(action, targetText, (updatedChunk) => {
          const newFullText = prefix + updatedChunk + suffix;
          setInputText(newFullText);
          // On completion, record full draft to history
          if (updatedChunk === targetText || updatedChunk.length > 0) {
            // Updated dynamically
          }
        });
      } else {
        // Execute AI action on full draft
        executeAction(action, targetText, (updatedText) => {
          setInputText(updatedText);
        });
      }
    },
    [inputText, isAssistantEnabled, executeAction, addHistoryEntry]
  );

  // When generation completes, record the finished result to history
  const prevGeneratingRef = useRef<boolean>(false);
  useEffect(() => {
    const isGenerating = status === 'generating';
    if (prevGeneratingRef.current && !isGenerating && inputText.trim()) {
      addHistoryEntry(inputText, 'Completed AI Revision');
    }
    prevGeneratingRef.current = isGenerating;
  }, [status, inputText, addHistoryEntry]);

  // Handle clearing text (saves draft before clearing so user never loses text)
  const handleClearText = useCallback((val: string) => {
    if (val === '' && inputText.trim()) {
      addHistoryEntry(inputText, 'Draft before Clear');
      setHistory((prev) => [...prev, inputText]);
    }
    setInputText(val);
  }, [inputText, addHistoryEntry]);

  // Undo last revision
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setInputText(previous);
  }, [history]);

  // Restore a specific version from History modal
  const handleRestoreFromHistory = useCallback((entryText: string) => {
    if (inputText.trim() && inputText !== entryText) {
      addHistoryEntry(inputText, 'Draft before Restore');
      setHistory((prev) => [...prev, inputText]);
    }
    setInputText(entryText);
  }, [inputText, addHistoryEntry]);

  // Delete a specific history entry
  const handleDeleteHistoryEntry = useCallback((id: string) => {
    setHistoryEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Clear all history entries
  const handleClearAllHistory = useCallback(() => {
    setHistoryEntries([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
  }, []);

  // Save manual snapshot
  const handleSaveSnapshot = useCallback(() => {
    if (!inputText.trim()) return;
    addHistoryEntry(inputText, 'Manual Snapshot');
  }, [inputText, addHistoryEntry]);

  // Keyboard shortcuts:
  // - Ctrl + Enter / Cmd + Enter = Improve Writing
  // - Escape = Stop generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to stop generation
      if (e.key === 'Escape' && status === 'generating') {
        e.preventDefault();
        stopGeneration();
        return;
      }

      // Ctrl+Enter or Cmd+Enter to Improve Writing
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (inputText.trim() && status !== 'generating' && status !== 'downloading' && status !== 'loading') {
          e.preventDefault();
          handleAction('improve');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, status, handleAction, stopGeneration]);

  const previousText = history.length > 0 ? history[history.length - 1] : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. Header */}
      <Header
        isDark={isDark}
        onToggleDark={toggleDarkMode}
        status={isAssistantEnabled ? status : 'unloaded'}
        modelId={modelId}
        onSelectModel={selectModel}
        isSimulationMode={isSimulationMode}
        onToggleSimulationMode={handleToggleSimulationMode}
        cachedModelIds={cachedModelIds}
        downloadingModelId={downloadingModelId}
        onCancelDownload={cancelDownload}
      />

      {/* Main Single Text Box Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-3 sm:space-y-6">
        
        <section aria-label="Writing Editor and Assistant">
          <UnifiedEditor
            text={inputText}
            onChange={handleClearText}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            metrics={metrics}
            isAssistantEnabled={isAssistantEnabled}
            onToggleAssistant={handleToggleAssistant}
            status={status}
            progress={progress}
            modelId={modelId}
            activeAction={activeAction}
            onAction={handleAction}
            onStop={stopGeneration}
            networkInfo={networkInfo}
            previousText={previousText}
            stats={stats}
            isSimulationMode={isSimulationMode}
            onToggleSimulationMode={handleToggleSimulationMode}
            isSaved={isSaved}
            onOpenHistory={() => setIsHistoryOpen(true)}
            historyCount={historyEntries.length}
            onSaveSnapshot={handleSaveSnapshot}
            onSelectModel={selectModel}
            cachedModelIds={cachedModelIds}
            downloadingModelId={downloadingModelId}
            activeLoadedModelId={activeLoadedModelId}
            onCancelDownload={cancelDownload}
          />
        </section>

      </main>

      {/* Version History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={historyEntries}
        currentText={inputText}
        onRestore={handleRestoreFromHistory}
        onDeleteEntry={handleDeleteHistoryEntry}
        onClearAll={handleClearAllHistory}
      />

    </div>
  );
};

export default App;
