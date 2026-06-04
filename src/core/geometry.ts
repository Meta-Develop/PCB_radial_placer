import type { CoordinateSystem, DerivedGeometry, PlacementSettings, Point } from '../types';
import { parseIndividualAngles, representativeIndividualStep } from './individualAngles';

const QUARTER_TURN_TOLERANCE = 1e-10;
const QUARTER_TURN_COS = [1, 0, -1, 0] as const;
const QUARTER_TURN_SIN = [0, 1, 0, -1] as const;

export function degreesToRadians(angleDeg: number): number {
  return (angleDeg * Math.PI) / 180;
}

export function directionSign(direction: PlacementSettings['direction']): number {
  return direction === 'counterclockwise' ? 1 : -1;
}

export function ySign(coordinateSystem: CoordinateSystem): number {
  return coordinateSystem === 'mathYUp' ? 1 : -1;
}

export function effectiveStartAngleDeg(settings: PlacementSettings): number {
  return settings.startAngleDeg + settings.startAngleOffsetDeg;
}

function positiveModulo(value: number, modulo: number): number {
  const remainder = value % modulo;
  return remainder < 0 ? remainder + modulo : remainder;
}

function exactQuarterTurnIndex(angleDeg: number): number | null {
  if (!Number.isFinite(angleDeg)) {
    return null;
  }

  const quarterTurns = angleDeg / 90;
  const nearestQuarterTurn = Math.round(quarterTurns);

  if (Math.abs(quarterTurns - nearestQuarterTurn) > QUARTER_TURN_TOLERANCE) {
    return null;
  }

  return positiveModulo(nearestQuarterTurn, 4);
}

function cosDegrees(angleDeg: number): number {
  const quarterTurnIndex = exactQuarterTurnIndex(angleDeg);
  return quarterTurnIndex === null
    ? Math.cos(degreesToRadians(angleDeg))
    : QUARTER_TURN_COS[quarterTurnIndex];
}

function sinDegrees(angleDeg: number): number {
  const quarterTurnIndex = exactQuarterTurnIndex(angleDeg);
  return quarterTurnIndex === null
    ? Math.sin(degreesToRadians(angleDeg))
    : QUARTER_TURN_SIN[quarterTurnIndex];
}

export function calculateDirectedArcSpan(settings: PlacementSettings): number {
  const rawSpan = settings.endAngleDeg - effectiveStartAngleDeg(settings);

  if (settings.direction === 'counterclockwise') {
    return rawSpan >= 0 ? rawSpan : positiveModulo(rawSpan, 360);
  }

  return rawSpan <= 0 ? rawSpan : -positiveModulo(-rawSpan, 360);
}

export function calculateStepAngle(settings: PlacementSettings): number {
  if (!Number.isFinite(settings.count) || settings.count <= 0) {
    return Number.NaN;
  }

  if (settings.angleMode === 'individualAngles') {
    const parsed = parseIndividualAngles(settings.individualAnglesText);
    if (parsed.errors.length > 0 || parsed.angles.length !== settings.count) {
      return 0;
    }
    return representativeIndividualStep(parsed.angles);
  }

  const sign = directionSign(settings.direction);

  if (settings.angleMode === 'fullCircle') {
    return sign * (360 / settings.count);
  }

  if (settings.angleMode === 'customStep') {
    return sign * Math.abs(settings.stepAngleDeg);
  }

  const denominator = settings.includeEndpoint ? settings.count - 1 : settings.count;
  if (denominator <= 0) {
    return Number.NaN;
  }

  return calculateDirectedArcSpan(settings) / denominator;
}

export function polarToCartesian(
  radius: number,
  thetaDeg: number,
  centerX: number,
  centerY: number,
  coordinateSystem: CoordinateSystem,
): Point {
  return {
    x: centerX + radius * cosDegrees(thetaDeg),
    y: centerY + ySign(coordinateSystem) * radius * sinDegrees(thetaDeg),
  };
}

export function rotateLocalOffset(
  offsetX: number,
  offsetY: number,
  rotationDeg: number,
  coordinateSystem: CoordinateSystem,
): Point {
  const cos = cosDegrees(rotationDeg);
  const sin = ySign(coordinateSystem) * sinDegrees(rotationDeg);

  return {
    x: offsetX * cos - offsetY * sin,
    y: offsetX * sin + offsetY * cos,
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
