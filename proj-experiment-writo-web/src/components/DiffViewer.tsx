import React, { useMemo } from 'react';
import { computeWordDiff } from '../utils/diff';

interface DiffViewerProps {
  original: string;
  improved: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, improved }) => {
  const diffParts = useMemo(() => {
    return computeWordDiff(original, improved);
  }, [original, improved]);

  if (!diffParts.length) {
    return <span className="text-slate-400 italic">No text to compare.</span>;
  }

  return (
    <div className="font-sans leading-relaxed text-base break-words whitespace-pre-wrap select-text">
      {diffParts.map((part, index) => {
        if (part.type === 'added') {
          return (
            <mark
              key={index}
              className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 px-1 py-0.5 rounded font-medium decoration-clone"
            >
              {part.value}
            </mark>
          );
        }
        if (part.type === 'removed') {
          return (
            <del
              key={index}
              className="bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 line-through px-1 py-0.5 rounded opacity-75 decoration-rose-500/80 decoration-clone"
            >
              {part.value}
            </del>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
};
