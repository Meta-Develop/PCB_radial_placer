import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import {
  loadPresetRecords,
  loadRecentSettings,
  parsePresetImport,
  PRESETS_STORAGE_KEY,
  savePresetRecord,
  storeRecentSettings,
} from '../core/presets';
import { normalizePlacementSettings } from '../core/settings';

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

describe('preset/settings normalization', () => {
  it('merges partial imported settings with defaults', () => {
    const parsed = parsePresetImport(
      JSON.stringify({
        settings: {
          count: 12,
          radius: '30',
          reference: {
            prefix: 'LED',
          },
        },
      }),
    );

    expect(parsed.count).toBe(12);
    expect(parsed.radius).toBe(30);
    expect(parsed.centerX).toBe(DEFAULT_SETTINGS.centerX);
    expect(parsed.reference.prefix).toBe('LED');
    expect(parsed.reference.startNumber).toBe(DEFAULT_SETTINGS.reference.startNumber);
    expect(parsed.rotation.mode).toBe(DEFAULT_SETTINGS.rotation.mode);
    expect(parsed.componentOffset).toEqual(DEFAULT_SETTINGS.componentOffset);
    expect(parsed.inputExpressions).toEqual(DEFAULT_SETTINGS.inputExpressions);
  });

  it('falls back to defaults for malformed object shapes', () => {
    const normalized = normalizePlacementSettings({
      count: 'not-a-number',
      direction: 'sideways',
      coordinateSystem: 'unknown',
      reference: 'bad-shape',
      rotation: {
        mode: 'spin',
        fixedRotationDeg: 'also-bad',
      },
      export: null,
    });

    expect(normalized.count).toBe(DEFAULT_SETTINGS.count);
    expect(normalized.direction).toBe(DEFAULT_SETTINGS.direction);
    expect(normalized.coordinateSystem).toBe(DEFAULT_SETTINGS.coordinateSystem);
    expect(normalized.reference).toEqual(DEFAULT_SETTINGS.reference);
    expect(normalized.rotation.mode).toBe(DEFAULT_SETTINGS.rotation.mode);
    expect(normalized.rotation.fixedRotationDeg).toBe(DEFAULT_SETTINGS.rotation.fixedRotationDeg);
    expect(normalized.export).toEqual(DEFAULT_SETTINGS.export);
  });

  it('round-trips raw expression strings while resolving numeric settings', () => {
    const parsed = parsePresetImport(
      JSON.stringify({
        settings: {
          radius: 10,
          inputExpressions: {
            radius: '2.54/2',
            'componentOffset.x': '10 + 1.27',
          },
        },
      }),
    );

    expect(parsed.radius).toBeCloseTo(1.27, 12);
    expect(parsed.componentOffset.x).toBeCloseTo(11.27, 12);
    expect(parsed.inputExpressions.radius).toBe('2.54/2');
    expect(parsed.inputExpressions['componentOffset.x']).toBe('10 + 1.27');
  });

  it('round-trips start-angle offset and significant digit expressions', () => {
    const parsed = parsePresetImport(
      JSON.stringify({
        settings: {
          inputExpressions: {
            startAngleOffsetDeg: '360/16/2',
            significantDigits: '2 + 3',
          },
          outputPrecisionMode: 'significantDigits',
        },
      }),
    );

    expect(parsed.startAngleOffsetDeg).toBeCloseTo(11.25, 12);
    expect(parsed.significantDigits).toBe(5);
    expect(parsed.outputPrecisionMode).toBe('significantDigits');
    expect(parsed.inputExpressions.startAngleOffsetDeg).toBe('360/16/2');
    expect(parsed.inputExpressions.significantDigits).toBe('2 + 3');
  });

  it('normalizes and round-trips individual angle mode settings', () => {
    const parsed = parsePresetImport(
      JSON.stringify({
        settings: {
          count: 3,
          angleMode: 'individualAngles',
          individualAnglesText: '0, 360/8, 90 + 45',
        },
      }),
    );

    expect(parsed.count).toBe(3);
    expect(parsed.angleMode).toBe('individualAngles');
    expect(parsed.individualAnglesText).toBe('0, 360/8, 90 + 45');
  });

  it('defaults v1 presets without component origin offsets or expression metadata', () => {
    const normalized = normalizePlacementSettings({
      count: 3,
      radius: 20,
      reference: { prefix: 'U' },
    });

    expect(normalized.componentOffset).toEqual({ x: 0, y: 0 });
    expect(normalized.startAngleOffsetDeg).toBe(0);
    expect(normalized.outputPrecisionMode).toBe('decimalPlaces');
    expect(normalized.significantDigits).toBe(DEFAULT_SETTINGS.significantDigits);
    expect(normalized.individualAnglesText).toBe('');
    expect(normalized.inputExpressions).toEqual({});
  });

  it('throws for syntactically invalid JSON import', () => {
    expect(() => parsePresetImport('{bad json')).toThrow();
  });
});

describe('preset localStorage robustness', () => {
  it('falls back when localStorage property access throws', () => {
    blockLocalStorageAccess();

    expect(loadPresetRecords()).toEqual([]);
    expect(loadRecentSettings()).toBeNull();
    expect(storeRecentSettings(DEFAULT_SETTINGS)).toBe(false);
  });

  it('falls back when localStorage getItem throws', () => {
    replaceLocalStorage({
      getItem: vi.fn(() => {
        throw new Error('blocked getItem');
      }),
      setItem: vi.fn(),
    });

    expect(loadPresetRecords()).toEqual([]);
    expect(loadRecentSettings()).toBeNull();
  });

  it('does not report preset save success when localStorage setItem throws', () => {
    const existingPreset = {
      id: 'existing',
      name: 'Existing',
      settings: DEFAULT_SETTINGS,
      savedAt: new Date(0).toISOString(),
    };
    replaceLocalStorage({
      getItem: vi.fn((key: string) => (key === PRESETS_STORAGE_KEY ? JSON.stringify([existingPreset]) : null)),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    });

    const result = savePresetRecord('Blocked Save', DEFAULT_SETTINGS);

    expect(result.saved).toBe(false);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].name).toBe('Existing');
  });

  it('returns false instead of throwing when recent settings cannot be stored', () => {
    replaceLocalStorage({
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    });

    expect(storeRecentSettings(DEFAULT_SETTINGS)).toBe(false);
  });
});
