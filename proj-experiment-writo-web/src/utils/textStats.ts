import { TextMetrics } from '../types';

export function calculateMetrics(text: string): TextMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      sentences: 0,
      readingTimeMinutes: 0,
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;
  
  // Word count matching alphanumeric words
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  
  // Sentence count based on terminal punctuation
  const sentences = trimmed
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length || (trimmed.length > 0 ? 1 : 0);

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(0.1, Number((words / 200).toFixed(1)));

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    readingTimeMinutes,
  };
}
