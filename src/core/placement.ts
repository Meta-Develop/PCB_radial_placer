import type { Placement, PlacementSettings } from '../types';
import { calculateStepAngle, polarToCartesian } from './geometry';
import { calculateRotation } from './rotation';

export function generateReference(index: number, settings: PlacementSettings['reference']): string {
  const number = settings.startNumber + index;
  const numberText =
    settings.padding > 0 ? String(number).padStart(settings.padding, '0') : String(number);
  return `${settings.prefix}${numberText}`;
}

export function calculatePlacements(settings: PlacementSettings): Placement[] {
  const count = Number.isInteger(settings.count) ? settings.count : 0;
  const stepAngleDeg = calculateStepAngle(settings);

  if (count <= 0 || !Number.isFinite(stepAngleDeg)) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const angleDeg = settings.startAngleDeg + index * stepAngleDeg;
    const point = polarToCartesian(
      settings.radius,
      angleDeg,
      settings.centerX,
      settings.centerY,
      settings.coordinateSystem,
    );

    return {
      ref: generateReference(index, settings.reference),
      index,
      angleDeg,
      x: point.x,
      y: point.y,
      rotationDeg: calculateRotation(angleDeg, settings.rotation),
      radius: settings.radius,
      centerX: settings.centerX,
      centerY: settings.centerY,
    };
  });
}
