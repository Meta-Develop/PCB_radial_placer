export const SERVICE_WORKER_FILENAME = 'service-worker.js';

export function shouldRegisterServiceWorker(isProduction: boolean, hasServiceWorker: boolean): boolean {
  return isProduction && hasServiceWorker;
}

export function resolveServiceWorkerUrl(pageUrl: string, baseUrl: string, scriptUrl?: string): string {
  const parsedPageUrl = new URL(pageUrl);

  if (scriptUrl) {
    const parsedScriptUrl = new URL(scriptUrl, parsedPageUrl);
    if (parsedScriptUrl.origin === parsedPageUrl.origin && parsedScriptUrl.pathname.includes('/assets/')) {
      return new URL(`../${SERVICE_WORKER_FILENAME}`, parsedScriptUrl).toString();
    }
  }

  const effectiveBaseUrl = baseUrl && baseUrl !== './' ? baseUrl : './';
  const normalizedBaseUrl = effectiveBaseUrl.endsWith('/') ? effectiveBaseUrl : `${effectiveBaseUrl}/`;
  return new URL(`${normalizedBaseUrl}${SERVICE_WORKER_FILENAME}`, parsedPageUrl).toString();
}

export function currentModuleScriptUrl(documentRef: Document): string | undefined {
  const moduleScripts = [...documentRef.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')];
  const viteAssetScript = moduleScripts.find((script) => {
    try {
      return new URL(script.src, documentRef.baseURI).pathname.includes('/assets/');
    } catch {
      return false;
    }
  });
  return viteAssetScript?.src ?? moduleScripts.at(-1)?.src;
}

export function registerServiceWorker(): void {
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  if (!shouldRegisterServiceWorker(import.meta.env.PROD, hasServiceWorker)) {
    return;
  }

  const register = () => {
    const scriptUrl = typeof document !== 'undefined' ? currentModuleScriptUrl(document) : undefined;
    const serviceWorkerUrl = resolveServiceWorkerUrl(window.location.href, import.meta.env.BASE_URL, scriptUrl);
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error: unknown) => {
      console.info('Service worker registration failed.', error);
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
