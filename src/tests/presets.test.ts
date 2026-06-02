import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { parsePresetImport } from '../core/presets';
import { normalizePlacementSettings } from '../core/settings';

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

  it('throws for syntactically invalid JSON import', () => {
    expect(() => parsePresetImport('{bad json')).toThrow();
  });
});
