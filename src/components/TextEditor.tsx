import React from 'react';
import { 
  FileText, 
  Trash2, 
  Sparkles, 
  Clock, 
  AlignLeft
} from 'lucide-react';
import { TextMetrics } from '../types';

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  metrics: TextMetrics;
  disabled?: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  metrics,
  disabled = false,
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500">
      
      {/* Editor Header / Presets bar */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
          <FileText className="w-4 h-4 text-brand-500" />
          <span>Original Draft</span>
        </div>



        {/* Clear button */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Textarea Area */}
      <div className="relative flex-1 min-h-[280px] sm:min-h-[340px]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste or start typing your text here... Then select an action below or press Ctrl+Enter to improve writing."
          className="w-full h-full p-4 sm:p-5 resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none text-base sm:text-base leading-relaxed font-sans"
        />
        
        {value.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-600">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-3 text-slate-400">
              <Sparkles className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Start typing your text
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              All text is processed strictly on your device inside WebGPU memory.
            </p>
          </div>
        )}
      </div>

      {/* Editor Footer / Metrics Bar */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
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
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>~{metrics.readingTimeMinutes} min read</span>
        </div>
      </div>

    </div>
  );
};
