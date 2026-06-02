import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE_STORAGE_KEY, loadLanguage, storeLanguage } from '../App';

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

function restoreLocalStorage() {
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    window.localStorage.clear();
  }
}

function replaceLocalStorage(storage: Partial<Storage>) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

function blockLocalStorageAccess() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('localStorage unavailable');
    },
  });
}

afterEach(() => {
  restoreLocalStorage();
  vi.restoreAllMocks();
});

describe('language localStorage robustness', () => {
  it('falls back to English when localStorage property access throws', () => {
    blockLocalStorageAccess();

    expect(loadLanguage()).toBe('en');
  });

  it('falls back to English when localStorage getItem throws', () => {
    replaceLocalStorage({
      getItem: vi.fn(() => {
        throw new Error('blocked getItem');
      }),
    });

    expect(loadLanguage()).toBe('en');
  });

  it('stores language when storage is available', () => {
    const setItem = vi.fn();
    replaceLocalStorage({ setItem });

    storeLanguage('ja');

    expect(setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'ja');
  });

  it('does not throw when language persistence fails', () => {
    replaceLocalStorage({
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    });

    expect(() => storeLanguage('ja')).not.toThrow();
  });
});
