import type { CoordinateSystem, DerivedGeometry, PlacementSettings, Point } from '../types';

export function degreesToRadians(angleDeg: number): number {
  return (angleDeg * Math.PI) / 180;
}

export function directionSign(direction: PlacementSettings['direction']): number {
  return direction === 'counterclockwise' ? 1 : -1;
}

export function ySign(coordinateSystem: CoordinateSystem): number {
  return coordinateSystem === 'mathYUp' ? 1 : -1;
}

export function calculateStepAngle(settings: PlacementSettings): number {
  if (!Number.isFinite(settings.count) || settings.count <= 0) {
    return Number.NaN;
  }

  const sign = directionSign(settings.direction);

  if (settings.angleMode === 'fullCircle') {
    return sign * (360 / settings.count);
  }

  if (settings.angleMode === 'customStep') {
    return sign * settings.stepAngleDeg;
  }

  const denominator = settings.includeEndpoint ? settings.count - 1 : settings.count;
  if (denominator <= 0) {
    return Number.NaN;
  }

  const span = Math.abs(settings.endAngleDeg - settings.startAngleDeg);
  return sign * (span / denominator);
}

export function polarToCartesian(
  radius: number,
  thetaDeg: number,
  centerX: number,
  centerY: number,
  coordinateSystem: CoordinateSystem,
): Point {
  const thetaRad = degreesToRadians(thetaDeg);
  return {
    x: centerX + radius * Math.cos(thetaRad),
    y: centerY + ySign(coordinateSystem) * radius * Math.sin(thetaRad),
  };
}

export function calculateDerivedGeometry(settings: PlacementSettings): DerivedGeometry {
  const signedStepAngleDeg = calculateStepAngle(settings);
  const angularPitchDeg = Math.abs(signedStepAngleDeg);
  const angularPitchRad = degreesToRadians(angularPitchDeg);

  return {
    signedStepAngleDeg,
    angularPitchDeg,
    chordLength: 2 * settings.radius * Math.sin(Math.abs(angularPitchRad) / 2),
    arcLength: settings.radius * Math.abs(angularPitchRad),
    circumference: 2 * Math.PI * settings.radius,
  };
}
