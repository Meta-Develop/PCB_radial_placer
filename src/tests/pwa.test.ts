/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { resolveServiceWorkerUrl, SERVICE_WORKER_FILENAME, shouldRegisterServiceWorker } from '../pwa';

const serviceWorkerSource = readFileSync(resolve(process.cwd(), 'public/service-worker.js'), 'utf8');

function loadServiceWorkerForTest(options: {
  cache?: Record<string, unknown>;
  caches?: Record<string, unknown>;
  fetch?: typeof fetch;
} = {}) {
  const listeners = new Map<string, EventListener>();
  const cache = {
    add: vi.fn(),
    match: vi.fn(),
    put: vi.fn(),
    ...options.cache,
  };
  const caches = {
    delete: vi.fn(),
    keys: vi.fn(async () => []),
    match: vi.fn(async () => undefined),
    open: vi.fn(async () => cache),
    ...options.caches,
  };
  const self = {
    addEventListener: vi.fn((type: string, listener: EventListener) => listeners.set(type, listener)),
    clients: {
      claim: vi.fn(),
    },
    location: {
      origin: 'https://example.test',
    },
    registration: {
      scope: 'https://example.test/app/',
    },
    skipWaiting: vi.fn(),
  };
  const context = createContext({
    caches,
    console,
    fetch: options.fetch ?? vi.fn(),
    Promise,
    Response,
    self,
    Set,
    URL,
  });

  runInContext(
    `${serviceWorkerSource}\nself.__testExports = { cacheFirst, networkFirstNavigation, staleWhileRevalidate };`,
    context,
  );

  return {
    cache,
    caches,
    exports: (self as unknown as { __testExports: Record<string, (...args: unknown[]) => Promise<Response>> })
      .__testExports,
    listeners,
  };
}

describe('PWA service worker registration', () => {
  it('uses the expected public service worker filename', () => {
    expect(SERVICE_WORKER_FILENAME).toBe('service-worker.js');
  });

  it('registers only for production browsers with service worker support', () => {
    expect(shouldRegisterServiceWorker(true, true)).toBe(true);
    expect(shouldRegisterServiceWorker(false, true)).toBe(false);
    expect(shouldRegisterServiceWorker(true, false)).toBe(false);
  });

  it('resolves a service worker URL for a GitHub Pages project base', () => {
    expect(resolveServiceWorkerUrl('https://owner.github.io/PCB_radial_placer/', '/PCB_radial_placer/')).toBe(
      'https://owner.github.io/PCB_radial_placer/service-worker.js',
    );
  });

  it('resolves next to built Vite assets when the app uses a relative base', () => {
    expect(
      resolveServiceWorkerUrl(
        'https://owner.github.io/PCB_radial_placer/tools/',
        './',
        'https://owner.github.io/PCB_radial_placer/assets/index-abc123.js',
      ),
    ).toBe('https://owner.github.io/PCB_radial_placer/service-worker.js');
  });

  it('returns valid navigation responses when cache.put rejects', async () => {
    const onlineResponse = new Response('online', { status: 200 });
    const put = vi.fn(async () => {
      throw new Error('quota exceeded');
    });
    const { exports } = loadServiceWorkerForTest({
      cache: { put },
      fetch: vi.fn(async () => onlineResponse),
    });

    const result = await exports.networkFirstNavigation(new Request('https://example.test/app/'));

    expect(result).toBe(onlineResponse);
    expect(put).toHaveBeenCalled();
  });

  it('returns valid asset responses when cache.put rejects', async () => {
    const assetResponse = new Response('asset', { status: 200 });
    const put = vi.fn(async () => {
      throw new Error('quota exceeded');
    });
    const { exports } = loadServiceWorkerForTest({
      cache: { put },
      fetch: vi.fn(async () => assetResponse),
    });

    const result = await exports.cacheFirst(new Request('https://example.test/app/assets/index.js'));

    expect(result).toBe(assetResponse);
    expect(put).toHaveBeenCalled();
  });
});
