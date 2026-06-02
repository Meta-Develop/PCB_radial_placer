import { describe, expect, it } from 'vitest';
import { resolveServiceWorkerUrl, SERVICE_WORKER_FILENAME, shouldRegisterServiceWorker } from '../pwa';

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
});
