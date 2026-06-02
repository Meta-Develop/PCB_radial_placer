import type { RotationNormalizeMode, RotationSettings } from '../types';

export function normalizeAngle(angleDeg: number, mode: RotationNormalizeMode): number {
  if (!Number.isFinite(angleDeg) || mode === 'none') {
    return angleDeg;
  }

  const zeroTo360 = ((angleDeg % 360) + 360) % 360;

  if (mode === 'zeroTo360') {
    return zeroTo360;
  }

  return zeroTo360 > 180 ? zeroTo360 - 360 : zeroTo360;
}

export function calculateRotation(thetaDeg: number, settings: RotationSettings): number {
  let rotationDeg: number;

  switch (settings.mode) {
    case 'fixed':
      rotationDeg = settings.fixedRotationDeg;
      break;
    case 'radialOutward':
      rotationDeg = thetaDeg + settings.rotationOffsetDeg;
      break;
    case 'radialInward':
      rotationDeg = thetaDeg + 180 + settings.rotationOffsetDeg;
      break;
    case 'tangentClockwise':
      rotationDeg = thetaDeg - 90 + settings.rotationOffsetDeg;
      break;
    case 'tangentCounterclockwise':
      rotationDeg = thetaDeg + 90 + settings.rotationOffsetDeg;
      break;
    case 'customFormulaSimple':
      rotationDeg = settings.formulaA * thetaDeg + settings.formulaB;
      break;
    default: {
      const exhaustive: never = settings.mode;
      return exhaustive;
    }
  }

  return normalizeAngle(rotationDeg, settings.normalize);
}
