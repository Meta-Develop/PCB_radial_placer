import type { ExportFormatOptions, OutputPrecisionMode, Placement } from '../types';

export interface NumberFormatOptions {
  precisionMode: OutputPrecisionMode;
  decimalPlaces: number;
  significantDigits: number;
}

export type NumberFormatInput = number | NumberFormatOptions;

function normalizeFormatOptions(input: NumberFormatInput): NumberFormatOptions {
  if (typeof input === 'number') {
    return {
      precisionMode: 'decimalPlaces',
      decimalPlaces: input,
      significantDigits: 4,
    };
  }

  return input;
}

export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundToSignificantDigits(value: number, significantDigits: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return value;
  }

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const factor = 10 ** (significantDigits - 1 - exponent);
  return Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor;
}

function expandExponentialNotation(value: string): string {
  if (!/[eE]/.test(value)) {
    return value;
  }

  const [coefficient, exponentText] = value.toLowerCase().split('e');
  const exponent = Number(exponentText);
  if (!Number.isInteger(exponent)) {
    return value;
  }

  const sign = coefficient.startsWith('-') ? '-' : '';
  const unsignedCoefficient = coefficient.replace(/^[+-]/, '');
  const [integerPart, fractionalPart = ''] = unsignedCoefficient.split('.');
  const digits = `${integerPart}${fractionalPart}`;
  const decimalIndex = integerPart.length + exponent;

  if (decimalIndex <= 0) {
    return `${sign}0.${'0'.repeat(Math.abs(decimalIndex))}${digits}`;
  }

  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${'0'.repeat(decimalIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

export function formatSignificantDigits(value: number, significantDigits: number): string {
  if (!Number.isFinite(value)) {
    return 'NaN';
  }

  if (Object.is(value, -0) || value === 0) {
    return '0';
  }

  return expandExponentialNotation(value.toPrecision(significantDigits));
}

export function formatNumber(value: number, precision: NumberFormatInput): string {
  if (!Number.isFinite(value)) {
    return 'NaN';
  }

  const options = normalizeFormatOptions(precision);
  if (options.precisionMode === 'significantDigits') {
    return formatSignificantDigits(value, options.significantDigits);
  }

  return roundToDecimalPlaces(value, options.decimalPlaces).toFixed(options.decimalPlaces);
}

export function outputFormatOptions(settings: Pick<ExportFormatOptions, 'precisionMode' | 'decimalPlaces' | 'significantDigits'>): NumberFormatOptions {
  return {
    precisionMode: settings.precisionMode,
    decimalPlaces: settings.decimalPlaces,
    significantDigits: settings.significantDigits,
  };
}

export function roundNumber(value: number, precision: NumberFormatInput): number {
  const options = normalizeFormatOptions(precision);
  return options.precisionMode === 'significantDigits'
    ? roundToSignificantDigits(value, options.significantDigits)
    : roundToDecimalPlaces(value, options.decimalPlaces);
}

export function roundedPlacement(placement: Placement, precision: NumberFormatInput): Placement {
  return {
    ...placement,
    angleDeg: roundNumber(placement.angleDeg, precision),
    x: roundNumber(placement.x, precision),
    y: roundNumber(placement.y, precision),
    rotationDeg: roundNumber(placement.rotationDeg, precision),
    radius: roundNumber(placement.radius, precision),
    centerX: roundNumber(placement.centerX, precision),
    centerY: roundNumber(placement.centerY, precision),
    targetCenterX: roundNumber(placement.targetCenterX, precision),
    targetCenterY: roundNumber(placement.targetCenterY, precision),
    appliedOffsetX: roundNumber(placement.appliedOffsetX, precision),
    appliedOffsetY: roundNumber(placement.appliedOffsetY, precision),
  };
}
