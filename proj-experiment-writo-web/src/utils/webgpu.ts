export interface WebGPUCheckResult {
  supported: boolean;
  adapterInfo?: {
    vendor?: string;
    architecture?: string;
    device?: string;
    description?: string;
  };
  reason?: string;
}

interface WebGPUAdapterInfoLike {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

interface WebGPUAdapterLike {
  requestAdapterInfo?: () => Promise<WebGPUAdapterInfoLike>;
}

interface NavigatorWithGPU {
  gpu?: {
    requestAdapter: () => Promise<WebGPUAdapterLike | null>;
  };
}

export async function checkWebGPUSupport(): Promise<WebGPUCheckResult> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { supported: false, reason: 'Non-browser environment' };
  }

  const nav = navigator as unknown as NavigatorWithGPU;
  if (!nav.gpu) {
    return {
      supported: false,
      reason: 'WebGPU is not enabled or supported in this browser. Try Chrome 113+, Edge 113+, Arc, or Safari 18+.',
    };
  }

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        reason: 'WebGPU API is present, but no compatible graphics adapter was found on your system.',
      };
    }

    let adapterInfo: WebGPUCheckResult['adapterInfo'];
    try {
      if (adapter.requestAdapterInfo) {
        const info = await adapter.requestAdapterInfo();
        adapterInfo = {
          vendor: info.vendor || undefined,
          architecture: info.architecture || undefined,
          device: info.device || undefined,
          description: info.description || undefined,
        };
      }
    } catch {
      // Non-fatal, older WebGPU spec
    }

    return {
      supported: true,
      adapterInfo,
    };
  } catch (err) {
    return {
      supported: false,
      reason: err instanceof Error ? err.message : 'Failed to initialize WebGPU adapter.',
    };
  }
}
