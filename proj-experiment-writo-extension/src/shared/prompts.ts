import { ActionConfig, ActionType } from './types';

export const SYSTEM_PROMPT = `You are a professional, direct writing assistant.
You must output ONLY the improved/rewritten text.
Do NOT include any greetings, markdown backticks, conversational preamble (such as "Here is the rewritten text:"), explanations, or postscripts.
Begin immediately with the rewritten text.`;

export const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  improve: {
    id: 'improve',
    label: 'Improve Writing',
    description: 'Polishes grammar, clarity, flow, and overall quality',
    icon: 'Sparkles',
    shortcut: 'Ctrl + Enter',
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
  grammar: {
    id: 'grammar',
    label: 'Fix Grammar',
    description: 'Corrects typos, syntax, and punctuation strictly',
    icon: 'CheckCheck',
    shortcut: 'Ctrl + Shift + G',
    promptTemplate: (text: string) => `Correct grammar and spelling only.
Do not change meaning.

Text:
${text}`,
  },
  professional: {
    id: 'professional',
    label: 'Professional Tone',
    description: 'Elevates text for workplace and executive communication',
    icon: 'Briefcase',
    shortcut: 'Ctrl + Shift + P',
    promptTemplate: (text: string) => `Rewrite professionally for workplace communication.

Text:
${text}`,
  },
  simplify: {
    id: 'simplify',
    label: 'Simplify',
    description: 'Converts jargon and complexity into plain language',
    icon: 'Feather',
    shortcut: 'Ctrl + Shift + S',
    promptTemplate: (text: string) => `Rewrite using simple and easy-to-understand language.

Text:
${text}`,
  },
  concise: {
    id: 'concise',
    label: 'Make Concise',
    description: 'Trims wordiness and redundant phrasing',
    icon: 'Scissors',
    shortcut: 'Ctrl + Shift + C',
    promptTemplate: (text: string) => `Reduce unnecessary words while preserving meaning.

Text:
${text}`,
  },
};

export const SAMPLE_TEXTS = [
  {
    title: 'Wordy & Redundant Draft',
    action: 'concise' as ActionType,
    text: `At the present moment in time, in order to successfully achieve our optimal strategic objectives, it is absolutely essential that each and every single member of the team cooperates together in a collaborative manner. We should take into consideration the various different factors that may potentially impact our project deliverables going forward into the foreseeable future.`,
  },
  {
    title: 'Rough Grammar & Typos',
    action: 'grammar' as ActionType,
    text: `Their are alot of reasons why the server crash yesterday. We was not aware that the database connection had timed out, and none of the engineer's have checked the error logs until this morning. Hopefully we dont make this misteak again.`,
  },
  {
    title: 'Casual Workplace Slack',
    action: 'professional' as ActionType,
    text: `hey guys, just wanted to check if you got around to looking at my slides yet? i really need the numbers fixed asap cuz the boss is gonna be super mad if we miss the deadline tomorrow morning. lmk!`,
  },
  {
    title: 'Jargon-Heavy Explainer',
    action: 'simplify' as ActionType,
    text: `The implementation leverages an asynchronous event-driven paradigm utilizing decoupled microservices architectures to optimize decentralized telemetry ingestion, facilitating deterministic throughput elasticity while minimizing latency overheads across heterogeneous cloud topologies.`,
  },
];


