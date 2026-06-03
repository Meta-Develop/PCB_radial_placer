import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { formatPlacementsAsCsv, formatPlacementsAsTsv } from '../core/export';
import {
  formatNumber,
  formatSignificantDigits,
  roundNumber,
  roundedPlacement,
  roundToDecimalPlaces,
  roundToSignificantDigits,
} from '../core/format';
import { calculatePlacements } from '../core/placement';
import { calculateRotation } from '../core/rotation';
import type { ExportFormatOptions } from '../types';

function exportOptions(overrides: Partial<ExportFormatOptions>): ExportFormatOptions {
  return {
    includeHeaders: true,
    precisionMode: 'decimalPlaces',
    decimalPlaces: 3,
    significantDigits: 4,
    ...overrides,
  };
}

describe('rotation calculations', () => {
  it('calculates radial and tangent rotation modes', () => {
    expect(
      calculateRotation(90, { ...DEFAULT_SETTINGS.rotation, mode: 'radialOutward', rotationOffsetDeg: 5 }),
    ).toBe(95);
    expect(
      calculateRotation(90, { ...DEFAULT_SETTINGS.rotation, mode: 'radialInward', rotationOffsetDeg: 5 }),
    ).toBe(275);
    expect(
      calculateRotation(90, { ...DEFAULT_SETTINGS.rotation, mode: 'tangentClockwise', rotationOffsetDeg: 5 }),
    ).toBe(5);
    expect(
      calculateRotation(90, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'tangentCounterclockwise',
        rotationOffsetDeg: 5,
      }),
    ).toBe(185);
  });

  it('applies rotation offset to fixed and simple formula rotations', () => {
    expect(
      calculateRotation(45, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'fixed',
        fixedRotationDeg: 12,
        rotationOffsetDeg: 5,
      }),
    ).toBe(17);
    expect(
      calculateRotation(45, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'customFormulaSimple',
        formulaA: 2,
        formulaB: 10,
        rotationOffsetDeg: 5,
      }),
    ).toBe(105);
  });

  it('normalizes after applying the common rotation offset', () => {
    expect(
      calculateRotation(0, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'fixed',
        fixedRotationDeg: 350,
        rotationOffsetDeg: 20,
      }),
    ).toBe(10);
  });
});

describe('export formatting', () => {
  it('rounds decimal half-boundaries symmetrically', () => {
    expect(roundToDecimalPlaces(1.005, 2)).toBe(1.01);
    expect(roundToDecimalPlaces(-1.005, 2)).toBe(-1.01);
  });

  it('clamps out-of-range decimal places during display and export rounding', () => {
    const precision = {
      precisionMode: 'decimalPlaces' as const,
      decimalPlaces: 1000,
      significantDigits: 1000,
    };
    const placement = calculatePlacements({ ...DEFAULT_SETTINGS, count: 1, radius: 1 / 3 })[0];

    expect(() => formatNumber(1.2345678912, precision)).not.toThrow();
    expect(formatNumber(1.2345678912, precision)).toBe('1.234567891');
    expect(formatNumber(1.9, { ...precision, decimalPlaces: -1000 })).toBe('2');
    expect(roundToDecimalPlaces(1.2345678912, 1000)).toBe(1.234567891);
    expect(roundNumber(1.2345678912, precision)).toBe(1.234567891);
    expect(() => roundedPlacement(placement, precision)).not.toThrow();
    expect(roundedPlacement(placement, precision).x).toBe(0.333333333);
  });

  it('clamps out-of-range significant digits during display and export rounding', () => {
    const precision = {
      precisionMode: 'significantDigits' as const,
      decimalPlaces: 1000,
      significantDigits: 1000,
    };

    expect(() => formatNumber(1.2345678912345, precision)).not.toThrow();
    expect(formatNumber(1.2345678912345, precision)).toBe('1.23456789123');
    expect(formatSignificantDigits(1.2345678912345, 1000)).toBe('1.23456789123');
    expect(formatSignificantDigits(12.34, -1000)).toBe('10');
    expect(roundToSignificantDigits(1.2345678912345, 1000)).toBe(1.23456789123);
    expect(roundNumber(12.34, { ...precision, significantDigits: -1000 })).toBe(10);
  });

  it('rounds exported values without mutating internal placement calculations', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      radius: 10 / 3,
      decimalPlaces: 2,
    };
    const placements = calculatePlacements(settings);
    const internalX = placements[0].x;
    const csv = formatPlacementsAsCsv(placements, exportOptions({ decimalPlaces: 2 }));

    expect(internalX).not.toBe(roundToDecimalPlaces(internalX, 2));
    expect(csv).toContain('3.33');
    expect(placements[0].x).toBe(internalX);
  });

  it('includes target center and applied offset audit columns', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      radius: 10,
      decimalPlaces: 3,
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' as const, fixedRotationDeg: 90, normalize: 'none' as const },
      componentOffset: { x: 2, y: 0 },
    };
    const csv = formatPlacementsAsCsv(calculatePlacements(settings), {
      includeHeaders: true,
      precisionMode: 'decimalPlaces',
      decimalPlaces: 3,
      significantDigits: 4,
    });

    expect(csv.split('\n')[0]).toBe(
      'Ref,Index,AngleDeg,X,Y,TargetCenterX,TargetCenterY,AppliedOffsetX,AppliedOffsetY,RotationDeg,Radius,CenterX,CenterY',
    );
    expect(csv.split('\n')[1]).toBe('D1,0,0.000,10.000,-2.000,10.000,0.000,0.000,2.000,90.000,10.000,0.000,0.000');
  });

  it('formats exported values with significant digits when selected', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      radius: 10 / 3,
      outputPrecisionMode: 'significantDigits' as const,
      significantDigits: 3,
    };
    const csv = formatPlacementsAsCsv(
      calculatePlacements(settings),
      exportOptions({ precisionMode: 'significantDigits', significantDigits: 3 }),
    );

    expect(csv.split('\n')[1]).toBe('D1,0,0,3.33,0,3.33,0,0,0,0,3.33,0,0');
  });

  it('formats cardinal zero coordinates as 0 in significant-digits mode', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 4,
      radius: 10,
    };
    const csv = formatPlacementsAsCsv(
      calculatePlacements(settings),
      exportOptions({ precisionMode: 'significantDigits', significantDigits: 4 }),
    );

    expect(csv.split('\n').slice(1, 5)).toEqual([
      'D1,0,0,10.00,0,10.00,0,0,0,0,10.00,0,0',
      'D2,1,90.00,0,10.00,0,10.00,0,0,90.00,10.00,0,0',
      'D3,2,180.0,-10.00,0,-10.00,0,0,0,180.0,10.00,0,0',
      'D4,3,270.0,0,-10.00,0,-10.00,0,0,270.0,10.00,0,0',
    ]);
  });

  it('normalizes tabs and newlines inside TSV cells', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      reference: { ...DEFAULT_SETTINGS.reference, prefix: 'D\tbad\nline\r' },
    };
    const tsv = formatPlacementsAsTsv(calculatePlacements(settings), exportOptions({ decimalPlaces: 3 }));
    const lines = tsv.split('\n');
    const dataColumns = lines[1].split('\t');

    expect(lines).toHaveLength(3);
    expect(dataColumns).toHaveLength(13);
    expect(dataColumns[0]).toBe('D bad line 1');
  });
});
