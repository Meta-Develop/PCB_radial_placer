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
  let baseRotationDeg: number;

  switch (settings.mode) {
    case 'fixed':
      baseRotationDeg = settings.fixedRotationDeg;
      break;
    case 'radialOutward':
      baseRotationDeg = thetaDeg;
      break;
    case 'radialInward':
      baseRotationDeg = thetaDeg + 180;
      break;
    case 'tangentClockwise':
      baseRotationDeg = thetaDeg - 90;
      break;
    case 'tangentCounterclockwise':
      baseRotationDeg = thetaDeg + 90;
      break;
    case 'customFormulaSimple':
      baseRotationDeg = settings.formulaA * thetaDeg + settings.formulaB;
      break;
    default: {
      const exhaustive: never = settings.mode;
      return exhaustive;
    }
  }

  const rotationDeg = baseRotationDeg + settings.rotationOffsetDeg;
  return normalizeAngle(rotationDeg, settings.normalize);
}
