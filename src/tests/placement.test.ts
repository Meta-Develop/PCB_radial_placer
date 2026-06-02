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
    componentOffset: { ...DEFAULT_SETTINGS.componentOffset, ...overrides.componentOffset },
    export: { ...DEFAULT_SETTINGS.export, ...overrides.export },
    inputExpressions: { ...DEFAULT_SETTINGS.inputExpressions, ...overrides.inputExpressions },
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

  it('adds start angle offset to the first placement angle', () => {
    const placements = calculatePlacements(
      settings({
        count: 4,
        radius: 10,
        startAngleDeg: 0,
        startAngleOffsetDeg: 45,
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([45, 135, 225, 315]);
    closeTo(placements[0].x, Math.sqrt(50));
    closeTo(placements[0].y, Math.sqrt(50));
  });

  it('uses the effective start angle when targeting an arc endpoint', () => {
    const placements = calculatePlacements(
      settings({
        count: 4,
        radius: 10,
        angleMode: 'arc',
        startAngleDeg: 0,
        startAngleOffsetDeg: 15,
        endAngleDeg: 90,
        includeEndpoint: true,
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([15, 40, 65, 90]);
  });

  it('uses the selected direction to reach a coterminal arc endpoint', () => {
    const placements = calculatePlacements(
      settings({
        count: 4,
        radius: 10,
        angleMode: 'arc',
        startAngleDeg: 0,
        endAngleDeg: -90,
        direction: 'counterclockwise',
        includeEndpoint: true,
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([0, 90, 180, 270]);
  });

  it('uses one manually specified angle per component in individual angle mode', () => {
    const placements = calculatePlacements(
      settings({
        count: 4,
        radius: 10,
        angleMode: 'individualAngles',
        individualAnglesText: '0, 45; 180\n270',
        startAngleDeg: 90,
        startAngleOffsetDeg: 15,
        stepAngleDeg: 30,
        endAngleDeg: 120,
        direction: 'clockwise',
        includeEndpoint: false,
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([0, 45, 180, 270]);
    closeTo(placements[1].x, Math.sqrt(50));
    closeTo(placements[1].y, Math.sqrt(50));
  });

  it('evaluates individual angle expressions before placement and rotation', () => {
    const placements = calculatePlacements(
      settings({
        count: 3,
        radius: 10,
        angleMode: 'individualAngles',
        individualAnglesText: '360/8, (90 + 45), -90',
        rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'radialOutward', normalize: 'none' },
      }),
    );

    expect(placements.map((placement) => placement.angleDeg)).toEqual([45, 135, -90]);
    expect(placements.map((placement) => placement.rotationDeg)).toEqual([45, 135, -90]);
  });

  it('generates padded reference designators', () => {
    const placements = calculatePlacements(
      settings({ count: 3, reference: { prefix: 'LED', startNumber: 1, padding: 2 } }),
    );

    expect(placements.map((placement) => placement.ref)).toEqual(['LED01', 'LED02', 'LED03']);
  });

  it('keeps exported origin equal to target center when component offset is zero', () => {
    const placements = calculatePlacements(settings({ count: 1, radius: 10, componentOffset: { x: 0, y: 0 } }));

    closeTo(placements[0].x, placements[0].targetCenterX);
    closeTo(placements[0].y, placements[0].targetCenterY);
    closeTo(placements[0].appliedOffsetX, 0);
    closeTo(placements[0].appliedOffsetY, 0);
  });

  it('subtracts local component offset rotated by fixed output rotation', () => {
    const placements = calculatePlacements(
      settings({
        count: 1,
        radius: 10,
        rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed', fixedRotationDeg: 90, normalize: 'none' },
        componentOffset: { x: 2, y: 0 },
      }),
    );

    closeTo(placements[0].targetCenterX, 10);
    closeTo(placements[0].targetCenterY, 0);
    closeTo(placements[0].appliedOffsetX, 0);
    closeTo(placements[0].appliedOffsetY, 2);
    closeTo(placements[0].x, 10);
    closeTo(placements[0].y, -2);
  });

  it('uses Y-down output coordinates when rotating component offset', () => {
    const placements = calculatePlacements(
      settings({
        count: 1,
        radius: 10,
        coordinateSystem: 'ecadYDown',
        rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed', fixedRotationDeg: 90, normalize: 'none' },
        componentOffset: { x: 2, y: 0 },
      }),
    );

    closeTo(placements[0].targetCenterX, 10);
    closeTo(placements[0].targetCenterY, 0);
    closeTo(placements[0].appliedOffsetX, 0);
    closeTo(placements[0].appliedOffsetY, -2);
    closeTo(placements[0].x, 10);
    closeTo(placements[0].y, 2);
  });

  it('rotates a radial-outward local X offset along the Y-down radial direction', () => {
    const placements = calculatePlacements(
      settings({
        count: 1,
        radius: 10,
        startAngleDeg: 90,
        coordinateSystem: 'ecadYDown',
        rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'radialOutward', normalize: 'none' },
        componentOffset: { x: 2, y: 0 },
      }),
    );

    closeTo(placements[0].targetCenterX, 0);
    closeTo(placements[0].targetCenterY, -10);
    closeTo(placements[0].rotationDeg, 90);
    closeTo(placements[0].appliedOffsetX, 0);
    closeTo(placements[0].appliedOffsetY, -2);
    closeTo(placements[0].x, 0);
    closeTo(placements[0].y, -8);
  });
});
