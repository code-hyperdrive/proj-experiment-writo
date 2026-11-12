import { ActionConfig, ActionType } from '../types';

export const SYSTEM_PROMPT = `You are a professional, direct writing assistant.
You must output ONLY the single best improved/rewritten text.
Do NOT provide multiple options, bullet points, markdown code blocks, quotes, conversational preambles (such as "Here is the rewritten text:"), explanations, or postscripts.
Begin immediately with the rewritten text.`;

export const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  improve: {
    id: 'improve',
    label: 'Improve Writing',
    description: 'Polishes grammar, clarity, flow, and overall quality',
    icon: '✨',
    promptTemplate: (text: string) => `You are a professional writing assistant.

Rewrite the text to:
- Improve grammar
- Improve clarity
- Improve readability
- Preserve meaning
- Preserve language
- Do not add information
- Return only the improved text

Text:
${text}`,
  },
  professional: {
    id: 'professional',
    label: 'Professional Tone',
    description: 'Elevates text for executive and workplace communication',
    icon: '💼',
    promptTemplate: (text: string) => `Rewrite professionally for workplace communication.
Preserve the exact core meaning, but make it polished, polite, and confident.

Text:
${text}`,
  },
  concise: {
    id: 'concise',
    label: 'Make Concise',
    description: 'Cuts filler and redundancy while keeping full meaning',
    icon: '✂️',
    promptTemplate: (text: string) => `Reduce unnecessary words and eliminate fluff while preserving the full meaning and key points.

Text:
${text}`,
  },
  grammar: {
    id: 'grammar',
    label: 'Fix Grammar',
    description: 'Fixes syntax, typos, punctuation, and spelling strictly',
    icon: '🔍',
    promptTemplate: (text: string) => `Correct grammar and spelling only.
Do not change meaning or alter style unless necessary for correctness.

Text:
${text}`,
  },
  simplify: {
    id: 'simplify',
    label: 'Simplify',
    description: 'Converts jargon and complexity into plain language',
    icon: '🪶',
    promptTemplate: (text: string) => `Rewrite using simple, plain, and easy-to-understand language.

Text:
${text}`,
  },
};
