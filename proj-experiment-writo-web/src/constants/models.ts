import { ModelOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Vapor (0.5B)',
    family: 'Instant',
    badge: 'Fast & Lightweight',
    sizeMB: 380,
    vramMB: 750,
    description: 'Instant startup, ultra-low memory. Perfect for quick checks, social media, and modest laptop GPUs.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Solid (1.5B)',
    family: 'Gold Standard',
    badge: 'Recommended',
    sizeMB: 980,
    vramMB: 1600,
    description: 'Gold standard balance. Rich vocabulary, flawless grammar, and natural tone rewrites.',
    recommended: true,
  },
  {
    id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    name: 'Core (3.8B)',
    family: 'Deep Precision',
    badge: 'Deep Precision',
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
      reason: 'Data Saver active. Selected lightweight Vapor (0.5B) power stage.',
    };
  }

  if (speedMbps < 30) {
    return {
      modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
      reason: `Slower connection (~${speedMbps} Mbps). Selected fast Vapor (0.5B) stage to minimize wait time.`,
    };
  }

  return {
    modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    reason: `Fast connection (~${speedMbps} Mbps). Selected Solid (1.5B) stage for optimal writing quality.`,
  };
}
