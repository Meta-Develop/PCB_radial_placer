import type { NumericExpressionField, PlacementSettings } from '../types';

export const NUMERIC_EXPRESSION_FIELDS: NumericExpressionField[] = [
  'count',
  'radius',
  'centerX',
  'centerY',
  'startAngleDeg',
  'startAngleOffsetDeg',
  'endAngleDeg',
  'stepAngleDeg',
  'decimalPlaces',
  'significantDigits',
  'reference.startNumber',
  'reference.padding',
  'rotation.fixedRotationDeg',
  'rotation.rotationOffsetDeg',
  'rotation.formulaA',
  'rotation.formulaB',
  'componentOffset.x',
  'componentOffset.y',
];

export function getNumericFieldValue(settings: PlacementSettings, field: NumericExpressionField): number {
  switch (field) {
    case 'count':
      return settings.count;
    case 'radius':
      return settings.radius;
    case 'centerX':
      return settings.centerX;
    case 'centerY':
      return settings.centerY;
    case 'startAngleDeg':
      return settings.startAngleDeg;
    case 'startAngleOffsetDeg':
      return settings.startAngleOffsetDeg;
    case 'endAngleDeg':
      return settings.endAngleDeg;
    case 'stepAngleDeg':
      return settings.stepAngleDeg;
    case 'decimalPlaces':
      return settings.decimalPlaces;
    case 'significantDigits':
      return settings.significantDigits;
    case 'reference.startNumber':
      return settings.reference.startNumber;
    case 'reference.padding':
      return settings.reference.padding;
    case 'rotation.fixedRotationDeg':
      return settings.rotation.fixedRotationDeg;
    case 'rotation.rotationOffsetDeg':
      return settings.rotation.rotationOffsetDeg;
    case 'rotation.formulaA':
      return settings.rotation.formulaA;
    case 'rotation.formulaB':
      return settings.rotation.formulaB;
    case 'componentOffset.x':
      return settings.componentOffset.x;
    case 'componentOffset.y':
      return settings.componentOffset.y;
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

export function setNumericFieldValue(
  settings: PlacementSettings,
  field: NumericExpressionField,
  value: number,
): PlacementSettings {
  switch (field) {
    case 'count':
      return { ...settings, count: value };
    case 'radius':
      return { ...settings, radius: value };
    case 'centerX':
      return { ...settings, centerX: value };
    case 'centerY':
      return { ...settings, centerY: value };
    case 'startAngleDeg':
      return { ...settings, startAngleDeg: value };
    case 'startAngleOffsetDeg':
      return { ...settings, startAngleOffsetDeg: value };
    case 'endAngleDeg':
      return { ...settings, endAngleDeg: value };
    case 'stepAngleDeg':
      return { ...settings, stepAngleDeg: value };
    case 'decimalPlaces':
      return { ...settings, decimalPlaces: value };
    case 'significantDigits':
      return { ...settings, significantDigits: value };
    case 'reference.startNumber':
      return { ...settings, reference: { ...settings.reference, startNumber: value } };
    case 'reference.padding':
      return { ...settings, reference: { ...settings.reference, padding: value } };
    case 'rotation.fixedRotationDeg':
      return { ...settings, rotation: { ...settings.rotation, fixedRotationDeg: value } };
    case 'rotation.rotationOffsetDeg':
      return { ...settings, rotation: { ...settings.rotation, rotationOffsetDeg: value } };
    case 'rotation.formulaA':
      return { ...settings, rotation: { ...settings.rotation, formulaA: value } };
    case 'rotation.formulaB':
      return { ...settings, rotation: { ...settings.rotation, formulaB: value } };
    case 'componentOffset.x':
      return { ...settings, componentOffset: { ...settings.componentOffset, x: value } };
    case 'componentOffset.y':
      return { ...settings, componentOffset: { ...settings.componentOffset, y: value } };
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}
