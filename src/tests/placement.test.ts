import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculatePlacements } from '../core/placement';
import type { PlacementSettings } from '../types';

function settings(overrides: Partial<PlacementSettings>): PlacementSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    reference: { ...DEFAULT_SETTINGS.reference, ...overrides.reference },
    rotation: { ...DEFAULT_SETTINGS.rotation, ...overrides.rotation },
    export: { ...DEFAULT_SETTINGS.export, ...overrides.export },
  };
}

function closeTo(value: number, expected: number): void {
  expect(value).toBeCloseTo(expected, 9);
}

describe('calculatePlacements', () => {
  it('places four components on cardinal points in full-circle Y-up mode', () => {
    const placements = calculatePlacements(settings({ count: 4, radius: 10, centerX: 0, centerY: 0 }));

    closeTo(placements[0].x, 10);
    closeTo(placements[0].y, 0);
    closeTo(placements[1].x, 0);
    closeTo(placements[1].y, 10);
    closeTo(placements[2].x, -10);
    closeTo(placements[2].y, 0);
    closeTo(placements[3].x, 0);
    closeTo(placements[3].y, -10);
  });

  it('applies center offset after polar conversion', () => {
    const placements = calculatePlacements(settings({ count: 4, radius: 10, centerX: 100, centerY: 50 }));

    closeTo(placements[0].x, 110);
    closeTo(placements[0].y, 50);
    closeTo(placements[1].x, 100);
    closeTo(placements[1].y, 60);
  });

  it('uses negative angular steps in clockwise mode', () => {
    const placements = calculatePlacements(settings({ count: 4, radius: 10, direction: 'clockwise' }));

    expect(placements.map((placement) => placement.angleDeg)).toEqual([0, -90, -180, -270]);
  });

  it('flips sine sign in Y-down coordinate mode', () => {
    const placements = calculatePlacements(
      settings({ count: 4, radius: 10, coordinateSystem: 'ecadYDown' }),
    );

    closeTo(placements[1].x, 0);
    closeTo(placements[1].y, -10);
  });

  it('supports arc endpoint mode', () => {
    const placements = calculatePlacements(
      settings({
        count: 4,
        radius: 10,
        angleMode: 'arc',
        startAngleDeg: 0,
        endAngleDeg: 90,
        includeEndpoint: true,
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([0, 30, 60, 90]);
  });

  it('generates padded reference designators', () => {
    const placements = calculatePlacements(
      settings({ count: 3, reference: { prefix: 'LED', startNumber: 1, padding: 2 } }),
    );

    expect(placements.map((placement) => placement.ref)).toEqual(['LED01', 'LED02', 'LED03']);
  });
});
