import { ModelOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Vapor',
    family: 'Instant',
    sizeMB: 380,
    vramMB: 750,
    description: 'Instant & lightweight. Starts in seconds; optimal for fast checks and quick notes.',
  },
  {
    id: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC',
    name: 'Liquid',
    family: 'Balanced',
    sizeMB: 650,
    vramMB: 1100,
    description: 'Smooth & balanced. Fast everyday flow for emails and messages.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Solid',
    family: 'Gold Standard',
    sizeMB: 980,
    vramMB: 1600,
    description: 'Gold standard writing. Rich vocabulary, flawless grammar, and polished tone.',
    recommended: true,
  },
  {
    id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    name: 'Core',
    family: 'Deep Precision',
    sizeMB: 2200,
    vramMB: 2800,
    description: 'Maximum depth & nuance. Best for complex essays, technical clarity, and in-depth prose.',
  },
];

export const DEFAULT_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

/**
 * Automatically picks the optimal power stage based on measured network speed and data-saver mode
 */
export function selectOptimalModelForSpeed(speedMbps: number, saveData: boolean = false): {
  modelId: string;
  reason: string;
} {
  if (saveData) {
    return {
      modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      reason: 'Data Saver active. Selected lightweight Vapor power stage.',
    };
  }

  if (speedMbps < 25) {
    return {
      modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      reason: `Slower connection (~${speedMbps} Mbps). Selected fast Vapor stage to minimize wait time.`,
    };
  }

  if (speedMbps <= 50) {
    return {
      modelId: 'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC',
      reason: `Moderate connection (~${speedMbps} Mbps). Selected balanced Liquid stage.`,
    };
  }

  return {
    modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    reason: `Fast connection (~${speedMbps} Mbps). Selected Solid stage for optimal writing quality.`,
  };
}
