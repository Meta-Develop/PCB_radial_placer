import type { Placement } from '../types';

export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatNumber(value: number, decimalPlaces: number): string {
  if (!Number.isFinite(value)) {
    return 'NaN';
  }
  return roundToDecimalPlaces(value, decimalPlaces).toFixed(decimalPlaces);
}

export function roundedPlacement(placement: Placement, decimalPlaces: number): Placement {
  return {
    ...placement,
    angleDeg: roundToDecimalPlaces(placement.angleDeg, decimalPlaces),
    x: roundToDecimalPlaces(placement.x, decimalPlaces),
    y: roundToDecimalPlaces(placement.y, decimalPlaces),
    rotationDeg: roundToDecimalPlaces(placement.rotationDeg, decimalPlaces),
    radius: roundToDecimalPlaces(placement.radius, decimalPlaces),
    centerX: roundToDecimalPlaces(placement.centerX, decimalPlaces),
    centerY: roundToDecimalPlaces(placement.centerY, decimalPlaces),
  };
}
