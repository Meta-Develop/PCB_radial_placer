import { DEFAULT_SETTINGS } from './defaults';
import { parseNumericExpression } from './expression';
import { NUMERIC_EXPRESSION_FIELDS, setNumericFieldValue } from './numericFields';
import type {
  AngleMode,
  CoordinateSystem,
  Direction,
  OutputPrecisionMode,
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

function expressionMap(value: unknown): PlacementSettings['inputExpressions'] {
  if (!isRecord(value)) {
    return {};
  }

  const expressions: PlacementSettings['inputExpressions'] = {};
  for (const field of NUMERIC_EXPRESSION_FIELDS) {
    const expression = value[field];
    if (typeof expression === 'string') {
      expressions[field] = expression;
    }
  }
  return expressions;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizePlacementSettings(input: unknown): PlacementSettings {
  const raw = isRecord(input) ? input : {};
  const reference = isRecord(raw.reference) ? raw.reference : {};
  const rotation = isRecord(raw.rotation) ? raw.rotation : {};
  const componentOffset = isRecord(raw.componentOffset) ? raw.componentOffset : {};
  const exportSettings = isRecord(raw.export) ? raw.export : {};
  const inputExpressions = expressionMap(raw.inputExpressions);

  let normalized: PlacementSettings = {
    count: integerNumber(raw.count, DEFAULT_SETTINGS.count),
    radius: finiteNumber(raw.radius, DEFAULT_SETTINGS.radius),
    centerX: finiteNumber(raw.centerX, DEFAULT_SETTINGS.centerX),
    centerY: finiteNumber(raw.centerY, DEFAULT_SETTINGS.centerY),
    startAngleDeg: finiteNumber(raw.startAngleDeg, DEFAULT_SETTINGS.startAngleDeg),
    startAngleOffsetDeg: finiteNumber(raw.startAngleOffsetDeg, DEFAULT_SETTINGS.startAngleOffsetDeg),
    endAngleDeg: finiteNumber(raw.endAngleDeg, DEFAULT_SETTINGS.endAngleDeg),
    stepAngleDeg: finiteNumber(raw.stepAngleDeg, DEFAULT_SETTINGS.stepAngleDeg),
    direction: enumValue<Direction>(
      raw.direction,
      ['counterclockwise', 'clockwise'],
      DEFAULT_SETTINGS.direction,
    ),
    angleMode: enumValue<AngleMode>(
      raw.angleMode,
      ['fullCircle', 'customStep', 'arc', 'individualAngles'],
      DEFAULT_SETTINGS.angleMode,
    ),
    individualAnglesText: stringValue(raw.individualAnglesText, DEFAULT_SETTINGS.individualAnglesText),
    includeEndpoint: booleanValue(raw.includeEndpoint, DEFAULT_SETTINGS.includeEndpoint),
    unit: enumValue<Unit>(raw.unit, ['mm', 'inch', 'mil', 'unitless'], DEFAULT_SETTINGS.unit),
    outputPrecisionMode: enumValue<OutputPrecisionMode>(
      raw.outputPrecisionMode,
      ['decimalPlaces', 'significantDigits'],
      DEFAULT_SETTINGS.outputPrecisionMode,
    ),
    decimalPlaces: integerNumber(raw.decimalPlaces, DEFAULT_SETTINGS.decimalPlaces),
    significantDigits: integerNumber(raw.significantDigits, DEFAULT_SETTINGS.significantDigits),
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
    componentOffset: {
      x: finiteNumber(componentOffset.x, DEFAULT_SETTINGS.componentOffset.x),
      y: finiteNumber(componentOffset.y, DEFAULT_SETTINGS.componentOffset.y),
    },
    export: {
      includeHeaders: booleanValue(exportSettings.includeHeaders, DEFAULT_SETTINGS.export.includeHeaders),
    },
    inputExpressions,
  };

  for (const field of NUMERIC_EXPRESSION_FIELDS) {
    const expression = inputExpressions[field];
    if (expression === undefined) {
      continue;
    }

    const parsed = parseNumericExpression(expression);
    if (parsed.ok) {
      normalized = setNumericFieldValue(normalized, field, parsed.value);
    }
  }

  return normalized;
}

export function extractSettingsPayload(input: unknown): unknown {
  if (isRecord(input) && 'settings' in input) {
    return input.settings;
  }

  return input;
}
