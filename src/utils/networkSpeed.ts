export interface NetworkSpeedResult {
  speedMbps: number;
  tier: 'fast' | 'moderate' | 'slow';
  source: 'navigator' | 'measured' | 'fallback';
  saveData: boolean;
  effectiveType?: string;
}

interface NetworkInformationLike {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

/**
 * Detects user network speed using the Network Information API
 * with a quick measurement fallback for Safari/Firefox.
 */
export async function detectNetworkSpeed(): Promise<NetworkSpeedResult> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { speedMbps: 15, tier: 'fast', source: 'fallback', saveData: false };
  }

  const nav = navigator as unknown as { connection?: NetworkInformationLike };
  const conn = nav.connection;

  // 1. Check Data-Saver flag
  const saveData = Boolean(conn?.saveData);

  // 2. If modern browser provides connection.downlink
  if (conn?.downlink && conn.downlink > 0) {
    const mbps = conn.downlink;
    return {
      speedMbps: Number(mbps.toFixed(1)),
      tier: getTier(mbps, saveData),
      source: 'navigator',
      saveData,
      effectiveType: conn.effectiveType,
    };
  }

  // 3. Fallback for Safari / Firefox: quick download probe of a small static resource
  try {
    const startTime = performance.now();
    // Test with a lightweight public SVG/font/shard header with cache-busting
    const probeUrl = `https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC/raw/main/mlc-chat-config.json?t=${Date.now()}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(probeUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const blob = await response.blob();
      const endTime = performance.now();
      const durationSec = Math.max(0.05, (endTime - startTime) / 1000);
      const sizeBytes = blob.size;
      const speedBps = (sizeBytes * 8) / durationSec;
      const speedMbps = Math.max(0.5, Number((speedBps / 1_000_000).toFixed(1)));

      return {
        speedMbps,
        tier: getTier(speedMbps, saveData),
        source: 'measured',
        saveData,
      };
    }
  } catch {
    // If probe blocked by CORS or offline, fallback safely
  }

  // Default assumption if completely unmeterable
  return {
    speedMbps: 12,
    tier: 'moderate',
    source: 'fallback',
    saveData: false,
    effectiveType: '4g',
  };
}

function getTier(speedMbps: number, saveData: boolean): 'fast' | 'moderate' | 'slow' {
  if (saveData || speedMbps < 25) return 'slow';
  if (speedMbps <= 50) return 'moderate';
  return 'fast';
}

/**
 * Calculates estimated download time in seconds based on model size and detected speed
 */
export function estimateDownloadTimeSeconds(sizeMB: number, speedMbps: number): number {
  if (speedMbps <= 0) return 0;
  // Convert MB to Megabits and divide by speed Mbps, assuming ~80% network efficiency
  const sizeMbits = sizeMB * 8;
  const effectiveSpeed = speedMbps * 0.8;
  return Math.max(2, Math.round(sizeMbits / effectiveSpeed));
}
