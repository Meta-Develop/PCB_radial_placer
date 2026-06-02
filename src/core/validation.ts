import type { NumericExpressionField, PlacementSettings, ValidationMessage, ValidationResult } from '../types';
import { calculateDerivedGeometry, calculateStepAngle } from './geometry';
import { parseIndividualAngles } from './individualAngles';
import { parseNumericExpression } from './expression';
import { NUMERIC_EXPRESSION_FIELDS } from './numericFields';

function finiteNumber(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function add(
  messages: ValidationMessage[],
  severity: ValidationMessage['severity'],
  field: string,
  message: string,
): void {
  messages.push({ severity, field, message });
}

function rotationModeUsesOffset(settings: PlacementSettings): boolean {
  return settings.rotation.mode !== 'fixed' && settings.rotation.mode !== 'customFormulaSimple';
}

function isNumericFieldRelevant(settings: PlacementSettings, field: NumericExpressionField): boolean {
  switch (field) {
    case 'startAngleDeg':
    case 'startAngleOffsetDeg':
      return settings.angleMode !== 'individualAngles';
    case 'endAngleDeg':
      return settings.angleMode === 'arc';
    case 'stepAngleDeg':
      return settings.angleMode === 'customStep';
    case 'decimalPlaces':
      return settings.outputPrecisionMode === 'decimalPlaces';
    case 'significantDigits':
      return settings.outputPrecisionMode === 'significantDigits';
    case 'rotation.fixedRotationDeg':
      return settings.rotation.mode === 'fixed';
    case 'rotation.rotationOffsetDeg':
      return rotationModeUsesOffset(settings);
    case 'rotation.formulaA':
    case 'rotation.formulaB':
      return settings.rotation.mode === 'customFormulaSimple';
    default:
      return true;
  }
}

export function validateSettings(settings: PlacementSettings): ValidationResult {
  const messages: ValidationMessage[] = [];

  if (!Number.isInteger(settings.count) || settings.count <= 0) {
    add(messages, 'error', 'count', 'Count must be a positive integer.');
  }

  if (!finiteNumber(settings.radius) || settings.radius < 0) {
    add(messages, 'error', 'radius', 'Radius must be a finite non-negative number.');
  }

  if (!finiteNumber(settings.centerX)) {
    add(messages, 'error', 'centerX', 'Center X must be a finite number.');
  }

  if (!finiteNumber(settings.centerY)) {
    add(messages, 'error', 'centerY', 'Center Y must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'startAngleDeg') && !finiteNumber(settings.startAngleDeg)) {
    add(messages, 'error', 'startAngleDeg', 'Start angle must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'startAngleOffsetDeg') && !finiteNumber(settings.startAngleOffsetDeg)) {
    add(messages, 'error', 'startAngleOffsetDeg', 'Start angle offset must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'endAngleDeg') && !finiteNumber(settings.endAngleDeg)) {
    add(messages, 'error', 'endAngleDeg', 'Arc end angle must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'stepAngleDeg') && !finiteNumber(settings.stepAngleDeg)) {
    add(messages, 'error', 'stepAngleDeg', 'Step angle must be a finite number.');
  }

  if (
    isNumericFieldRelevant(settings, 'decimalPlaces') &&
    (!Number.isInteger(settings.decimalPlaces) || settings.decimalPlaces < 0 || settings.decimalPlaces > 9)
  ) {
    add(messages, 'error', 'decimalPlaces', 'Decimal places must be an integer from 0 to 9.');
  }

  if (
    isNumericFieldRelevant(settings, 'significantDigits') &&
    (!Number.isInteger(settings.significantDigits) ||
      settings.significantDigits < 1 ||
      settings.significantDigits > 12)
  ) {
    add(messages, 'error', 'significantDigits', 'Significant digits must be an integer from 1 to 12.');
  }

  if (!Number.isInteger(settings.reference.startNumber)) {
    add(messages, 'error', 'refStartNumber', 'Reference start number must be an integer.');
  }

  if (!Number.isInteger(settings.reference.padding) || settings.reference.padding < 0 || settings.reference.padding > 8) {
    add(messages, 'error', 'refPadding', 'Reference padding must be an integer from 0 to 8.');
  }

  if (
    isNumericFieldRelevant(settings, 'rotation.fixedRotationDeg') &&
    !finiteNumber(settings.rotation.fixedRotationDeg)
  ) {
    add(messages, 'error', 'fixedRotationDeg', 'Fixed rotation must be a finite number.');
  }

  if (
    isNumericFieldRelevant(settings, 'rotation.rotationOffsetDeg') &&
    !finiteNumber(settings.rotation.rotationOffsetDeg)
  ) {
    add(messages, 'error', 'rotationOffsetDeg', 'Rotation offset must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'rotation.formulaA') && !finiteNumber(settings.rotation.formulaA)) {
    add(messages, 'error', 'formulaA', 'Rotation formula coefficient a must be a finite number.');
  }

  if (isNumericFieldRelevant(settings, 'rotation.formulaB') && !finiteNumber(settings.rotation.formulaB)) {
    add(messages, 'error', 'formulaB', 'Rotation formula coefficient b must be a finite number.');
  }

  if (!finiteNumber(settings.componentOffset.x)) {
    add(messages, 'error', 'componentOffsetX', 'Component local offset X must be a finite number.');
  }

  if (!finiteNumber(settings.componentOffset.y)) {
    add(messages, 'error', 'componentOffsetY', 'Component local offset Y must be a finite number.');
  }

  for (const field of NUMERIC_EXPRESSION_FIELDS) {
    const expression = settings.inputExpressions[field];
    if (expression === undefined || !isNumericFieldRelevant(settings, field)) {
      continue;
    }

    const parsed = parseNumericExpression(expression);
    if (!parsed.ok) {
      add(messages, 'error', field, parsed.error);
    }
  }

  if (settings.angleMode === 'arc' && settings.includeEndpoint && settings.count < 2) {
    add(messages, 'error', 'includeEndpoint', 'Arc mode with endpoint included requires count of at least 2.');
  }

  if (settings.angleMode === 'individualAngles') {
    const parsed = parseIndividualAngles(settings.individualAnglesText);

    if (parsed.errors.length > 0) {
      for (const error of parsed.errors) {
        add(messages, 'error', 'individualAnglesText', error.message);
      }
    }

    if (parsed.angles.length === 0 && parsed.errors.length === 0) {
      add(messages, 'error', 'individualAnglesText', 'Individual angles must contain one angle per component.');
    }

    if (parsed.angles.length !== settings.count) {
      add(messages, 'error', 'individualAnglesText', 'Individual angle entry count must match Count.');
    }
  }

  const hasErrors = messages.some((message) => message.severity === 'error');
  if (!hasErrors) {
    const stepAngleDeg = calculateStepAngle(settings);
    const geometry = calculateDerivedGeometry(settings);

    if (settings.radius === 0 && settings.count > 1) {
      add(messages, 'warning', 'radius', 'Radius is 0, so multiple components will share one coordinate.');
    }

    if (settings.count > 1 && Math.abs(stepAngleDeg) < 1e-9) {
      add(
        messages,
        'warning',
        settings.angleMode === 'individualAngles' ? 'individualAnglesText' : 'stepAngleDeg',
        'Step angle is effectively 0, so duplicate coordinates are likely.',
      );
    }

    if (settings.count > 1 && geometry.chordLength > 0 && geometry.chordLength < 0.1) {
      add(messages, 'warning', 'radius', 'Adjacent chord length is below 0.1 selected units; check package clearance.');
    }
  }

  return {
    valid: !messages.some((message) => message.severity === 'error'),
    messages,
  };
}
