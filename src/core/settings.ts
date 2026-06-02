import { DEFAULT_SETTINGS } from './defaults';
import type {
  AngleMode,
  CoordinateSystem,
  Direction,
  PlacementSettings,
  RotationMode,
  RotationNormalizeMode,
  Unit,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function integerNumber(value: unknown, fallback: number): number {
  const parsed = finiteNumber(value, fallback);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizePlacementSettings(input: unknown): PlacementSettings {
  const raw = isRecord(input) ? input : {};
  const reference = isRecord(raw.reference) ? raw.reference : {};
  const rotation = isRecord(raw.rotation) ? raw.rotation : {};
  const exportSettings = isRecord(raw.export) ? raw.export : {};

  return {
    count: integerNumber(raw.count, DEFAULT_SETTINGS.count),
    radius: finiteNumber(raw.radius, DEFAULT_SETTINGS.radius),
    centerX: finiteNumber(raw.centerX, DEFAULT_SETTINGS.centerX),
    centerY: finiteNumber(raw.centerY, DEFAULT_SETTINGS.centerY),
    startAngleDeg: finiteNumber(raw.startAngleDeg, DEFAULT_SETTINGS.startAngleDeg),
    endAngleDeg: finiteNumber(raw.endAngleDeg, DEFAULT_SETTINGS.endAngleDeg),
    stepAngleDeg: finiteNumber(raw.stepAngleDeg, DEFAULT_SETTINGS.stepAngleDeg),
    direction: enumValue<Direction>(
      raw.direction,
      ['counterclockwise', 'clockwise'],
      DEFAULT_SETTINGS.direction,
    ),
    angleMode: enumValue<AngleMode>(
      raw.angleMode,
      ['fullCircle', 'customStep', 'arc'],
      DEFAULT_SETTINGS.angleMode,
    ),
    includeEndpoint: booleanValue(raw.includeEndpoint, DEFAULT_SETTINGS.includeEndpoint),
    unit: enumValue<Unit>(raw.unit, ['mm', 'inch', 'mil', 'unitless'], DEFAULT_SETTINGS.unit),
    decimalPlaces: integerNumber(raw.decimalPlaces, DEFAULT_SETTINGS.decimalPlaces),
    coordinateSystem: enumValue<CoordinateSystem>(
      raw.coordinateSystem,
      ['mathYUp', 'ecadYDown'],
      DEFAULT_SETTINGS.coordinateSystem,
    ),
    reference: {
      prefix: stringValue(reference.prefix, DEFAULT_SETTINGS.reference.prefix),
      startNumber: integerNumber(reference.startNumber, DEFAULT_SETTINGS.reference.startNumber),
      padding: integerNumber(reference.padding, DEFAULT_SETTINGS.reference.padding),
    },
    rotation: {
      mode: enumValue<RotationMode>(
        rotation.mode,
        [
          'fixed',
          'radialOutward',
          'radialInward',
          'tangentClockwise',
          'tangentCounterclockwise',
          'customFormulaSimple',
        ],
        DEFAULT_SETTINGS.rotation.mode,
      ),
      fixedRotationDeg: finiteNumber(rotation.fixedRotationDeg, DEFAULT_SETTINGS.rotation.fixedRotationDeg),
      rotationOffsetDeg: finiteNumber(rotation.rotationOffsetDeg, DEFAULT_SETTINGS.rotation.rotationOffsetDeg),
      normalize: enumValue<RotationNormalizeMode>(
        rotation.normalize,
        ['none', 'zeroTo360', 'minus180To180'],
        DEFAULT_SETTINGS.rotation.normalize,
      ),
      formulaA: finiteNumber(rotation.formulaA, DEFAULT_SETTINGS.rotation.formulaA),
      formulaB: finiteNumber(rotation.formulaB, DEFAULT_SETTINGS.rotation.formulaB),
    },
    export: {
      includeHeaders: booleanValue(exportSettings.includeHeaders, DEFAULT_SETTINGS.export.includeHeaders),
    },
  };
}

export function extractSettingsPayload(input: unknown): unknown {
  if (isRecord(input) && 'settings' in input) {
    return input.settings;
  }

  return input;
}
