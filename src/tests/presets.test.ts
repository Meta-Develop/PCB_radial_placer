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
    expect(normalized.inputExpressions).toEqual({});
  });

  it('throws for syntactically invalid JSON import', () => {
    expect(() => parsePresetImport('{bad json')).toThrow();
  });
});
