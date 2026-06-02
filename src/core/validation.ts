import type { PlacementSettings, ValidationMessage, ValidationResult } from '../types';
import { calculateDerivedGeometry, calculateStepAngle } from './geometry';

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

  if (!finiteNumber(settings.startAngleDeg)) {
    add(messages, 'error', 'startAngleDeg', 'Start angle must be a finite number.');
  }

  if (!finiteNumber(settings.endAngleDeg)) {
    add(messages, 'error', 'endAngleDeg', 'End angle must be a finite number.');
  }

  if (!finiteNumber(settings.stepAngleDeg)) {
    add(messages, 'error', 'stepAngleDeg', 'Step angle must be a finite number.');
  }

  if (!Number.isInteger(settings.decimalPlaces) || settings.decimalPlaces < 0 || settings.decimalPlaces > 9) {
    add(messages, 'error', 'decimalPlaces', 'Decimal places must be an integer from 0 to 9.');
  }

  if (!Number.isInteger(settings.reference.startNumber)) {
    add(messages, 'error', 'refStartNumber', 'Reference start number must be an integer.');
  }

  if (!Number.isInteger(settings.reference.padding) || settings.reference.padding < 0 || settings.reference.padding > 8) {
    add(messages, 'error', 'refPadding', 'Reference padding must be an integer from 0 to 8.');
  }

  if (!finiteNumber(settings.rotation.fixedRotationDeg)) {
    add(messages, 'error', 'fixedRotationDeg', 'Fixed rotation must be a finite number.');
  }

  if (!finiteNumber(settings.rotation.rotationOffsetDeg)) {
    add(messages, 'error', 'rotationOffsetDeg', 'Rotation offset must be a finite number.');
  }

  if (!finiteNumber(settings.rotation.formulaA)) {
    add(messages, 'error', 'formulaA', 'Rotation formula coefficient a must be a finite number.');
  }

  if (!finiteNumber(settings.rotation.formulaB)) {
    add(messages, 'error', 'formulaB', 'Rotation formula coefficient b must be a finite number.');
  }

  if (settings.angleMode === 'arc' && settings.includeEndpoint && settings.count < 2) {
    add(messages, 'error', 'includeEndpoint', 'Arc mode with endpoint included requires count of at least 2.');
  }

  const hasErrors = messages.some((message) => message.severity === 'error');
  if (!hasErrors) {
    const stepAngleDeg = calculateStepAngle(settings);
    const geometry = calculateDerivedGeometry(settings);

    if (settings.radius === 0 && settings.count > 1) {
      add(messages, 'warning', 'radius', 'Radius is 0, so multiple components will share one coordinate.');
    }

    if (settings.count > 1 && Math.abs(stepAngleDeg) < 1e-9) {
      add(messages, 'warning', 'stepAngleDeg', 'Step angle is effectively 0, so duplicate coordinates are likely.');
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
