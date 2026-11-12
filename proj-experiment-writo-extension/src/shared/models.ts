import { ModelTier, ModelTierConfig } from './types';

export const MODEL_TIERS: Record<ModelTier, ModelTierConfig> = {
  low: {
    tier: 'low',
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Vapor (0.5B)',
    family: 'Instant',
    badge: 'Fast & Lightweight',
    sizeMB: 380,
    vramMB: 750,
    description: 'Instant startup, ultra-low memory. Perfect for quick checks, social media, and modest laptop GPUs.',
  },
  mid: {
    tier: 'mid',
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Solid (1.5B)',
    family: 'Gold Standard',
    badge: 'Recommended',
    sizeMB: 980,
    vramMB: 1600,
    description: 'Gold standard balance. Rich vocabulary, flawless grammar, and natural tone rewrites.',
    recommended: true,
  },
  high: {
    tier: 'high',
    id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    name: 'Core (3.8B)',
    family: 'Deep Precision',
    badge: 'Deep Precision',
    sizeMB: 2200,
    vramMB: 2800,
    description: 'Maximum depth & nuance. Best for technical clarity, executive communication, and detailed prose.',
  },
};

export const DEFAULT_TIER: ModelTier = 'mid';

export function getModelConfig(tier: ModelTier): ModelTierConfig {
  return MODEL_TIERS[tier] || MODEL_TIERS.mid;
}
