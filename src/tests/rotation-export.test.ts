import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { formatPlacementsAsCsv } from '../core/export';
import { roundToDecimalPlaces } from '../core/format';
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
      calculateRotation(90, { ...DEFAULT_SETTINGS.rotation, mode: 'radialInward', rotationOffsetDeg: 0 }),
    ).toBe(270);
    expect(
      calculateRotation(90, { ...DEFAULT_SETTINGS.rotation, mode: 'tangentClockwise', rotationOffsetDeg: 0 }),
    ).toBe(0);
    expect(
      calculateRotation(90, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'tangentCounterclockwise',
        rotationOffsetDeg: 0,
      }),
    ).toBe(180);
  });

  it('supports fixed and simple formula rotations', () => {
    expect(
      calculateRotation(45, { ...DEFAULT_SETTINGS.rotation, mode: 'fixed', fixedRotationDeg: 12 }),
    ).toBe(12);
    expect(
      calculateRotation(45, {
        ...DEFAULT_SETTINGS.rotation,
        mode: 'customFormulaSimple',
        formulaA: 2,
        formulaB: 10,
      }),
    ).toBe(100);
  });
});

describe('export formatting', () => {
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
});
