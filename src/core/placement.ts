import type { Placement, PlacementSettings } from '../types';
import { calculateStepAngle, effectiveStartAngleDeg, polarToCartesian, rotateLocalOffset } from './geometry';
import { parseIndividualAngles } from './individualAngles';
import { MAX_COMPONENT_COUNT } from './limits';
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

  if (count <= 0 || count > MAX_COMPONENT_COUNT || !Number.isFinite(stepAngleDeg)) {
    return [];
  }

  const firstAngleDeg = effectiveStartAngleDeg(settings);
  const individualAngles =
    settings.angleMode === 'individualAngles' ? parseIndividualAngles(settings.individualAnglesText) : null;

  if (
    individualAngles &&
    (individualAngles.errors.length > 0 || individualAngles.angles.length !== count)
  ) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const angleDeg = individualAngles ? individualAngles.angles[index] : firstAngleDeg + index * stepAngleDeg;
    const targetCenter = polarToCartesian(
      settings.radius,
      angleDeg,
      settings.centerX,
      settings.centerY,
      settings.coordinateSystem,
    );
    const rotationDeg = calculateRotation(angleDeg, settings.rotation);
    const appliedOffset = rotateLocalOffset(
      settings.componentOffset.x,
      settings.componentOffset.y,
      rotationDeg,
      settings.coordinateSystem,
    );

    return {
      ref: generateReference(index, settings.reference),
      index,
      angleDeg,
      x: targetCenter.x - appliedOffset.x,
      y: targetCenter.y - appliedOffset.y,
      rotationDeg,
      radius: settings.radius,
      centerX: settings.centerX,
      centerY: settings.centerY,
      targetCenterX: targetCenter.x,
      targetCenterY: targetCenter.y,
      appliedOffsetX: appliedOffset.x,
      appliedOffsetY: appliedOffset.y,
    };
  });
}
