import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { formatPlacementsAsCsv } from '../core/export';
import { roundToDecimalPlaces } from '../core/format';
import { calculatePlacements } from '../core/placement';
import { calculateRotation } from '../core/rotation';

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
    const csv = formatPlacementsAsCsv(placements, { includeHeaders: true, decimalPlaces: 2 });

    expect(internalX).not.toBe(roundToDecimalPlaces(internalX, 2));
    expect(csv).toContain('3.33');
    expect(placements[0].x).toBe(internalX);
  });
});
