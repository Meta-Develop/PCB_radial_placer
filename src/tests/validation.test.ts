import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { validateSettings } from '../core/validation';

const hasField = (result: ReturnType<typeof validateSettings>, field: string): boolean =>
  result.messages.some((message) => message.field === field);

describe('validateSettings', () => {
  it('rejects invalid core inputs', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 0,
      radius: -1,
      decimalPlaces: 12,
      significantDigits: 0,
    });

    expect(result.valid).toBe(false);
    expect(hasField(result, 'count')).toBe(true);
    expect(hasField(result, 'radius')).toBe(true);
    expect(hasField(result, 'decimalPlaces')).toBe(true);
    expect(hasField(result, 'significantDigits')).toBe(false);
  });

  it('rejects invalid significant digits when significant-digits precision is active', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      outputPrecisionMode: 'significantDigits',
      significantDigits: 0,
    });

    expect(result.valid).toBe(false);
    expect(hasField(result, 'significantDigits')).toBe(true);
  });

  it('warns about duplicate coordinates with zero radius', () => {
    const result = validateSettings({ ...DEFAULT_SETTINGS, count: 4, radius: 0 });

    expect(result.valid).toBe(true);
    expect(result.messages.some((message) => message.severity === 'warning')).toBe(true);
  });

  it('requires two points for arc endpoint mode', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 1,
      angleMode: 'arc',
      includeEndpoint: true,
    });

    expect(result.valid).toBe(false);
  });

  it('reports invalid expression text instead of silently coercing it', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      radius: 5,
      inputExpressions: {
        radius: '10 +',
      },
    });

    expect(result.valid).toBe(false);
    expect(hasField(result, 'radius')).toBe(true);
  });

  it('validates generated-angle raw expressions only when their angle mode uses them', () => {
    const inputExpressions = {
      startAngleDeg: '0 +',
      startAngleOffsetDeg: '10 +',
      stepAngleDeg: '45 +',
      endAngleDeg: '180 +',
    };

    const individualAngles = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 2,
      angleMode: 'individualAngles',
      individualAnglesText: '0, 90',
      inputExpressions,
    });
    const fullCircle = validateSettings({
      ...DEFAULT_SETTINGS,
      inputExpressions,
    });
    const customStep = validateSettings({
      ...DEFAULT_SETTINGS,
      angleMode: 'customStep',
      inputExpressions,
    });
    const arc = validateSettings({
      ...DEFAULT_SETTINGS,
      angleMode: 'arc',
      inputExpressions,
    });

    expect(individualAngles.valid).toBe(true);
    expect(hasField(individualAngles, 'startAngleDeg')).toBe(false);
    expect(hasField(individualAngles, 'startAngleOffsetDeg')).toBe(false);
    expect(hasField(individualAngles, 'stepAngleDeg')).toBe(false);
    expect(hasField(individualAngles, 'endAngleDeg')).toBe(false);

    expect(fullCircle.valid).toBe(false);
    expect(hasField(fullCircle, 'startAngleDeg')).toBe(true);
    expect(hasField(fullCircle, 'startAngleOffsetDeg')).toBe(true);
    expect(hasField(fullCircle, 'stepAngleDeg')).toBe(false);
    expect(hasField(fullCircle, 'endAngleDeg')).toBe(false);

    expect(customStep.valid).toBe(false);
    expect(hasField(customStep, 'stepAngleDeg')).toBe(true);
    expect(hasField(customStep, 'endAngleDeg')).toBe(false);

    expect(arc.valid).toBe(false);
    expect(hasField(arc, 'stepAngleDeg')).toBe(false);
    expect(hasField(arc, 'endAngleDeg')).toBe(true);
  });

  it('validates rotation and precision raw expressions only for active selections', () => {
    const inputExpressions = {
      decimalPlaces: '3 +',
      significantDigits: '4 +',
      'rotation.fixedRotationDeg': '0 +',
      'rotation.rotationOffsetDeg': '5 +',
      'rotation.formulaA': '1 +',
      'rotation.formulaB': '0 +',
    };

    const fixedDecimal = validateSettings({
      ...DEFAULT_SETTINGS,
      outputPrecisionMode: 'decimalPlaces',
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' },
      inputExpressions,
    });
    const radialSignificant = validateSettings({
      ...DEFAULT_SETTINGS,
      outputPrecisionMode: 'significantDigits',
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'radialOutward' },
      inputExpressions,
    });
    const customFormulaDecimal = validateSettings({
      ...DEFAULT_SETTINGS,
      outputPrecisionMode: 'decimalPlaces',
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'customFormulaSimple' },
      inputExpressions,
    });

    expect(fixedDecimal.valid).toBe(false);
    expect(hasField(fixedDecimal, 'decimalPlaces')).toBe(true);
    expect(hasField(fixedDecimal, 'significantDigits')).toBe(false);
    expect(hasField(fixedDecimal, 'rotation.fixedRotationDeg')).toBe(true);
    expect(hasField(fixedDecimal, 'rotation.rotationOffsetDeg')).toBe(false);
    expect(hasField(fixedDecimal, 'rotation.formulaA')).toBe(false);
    expect(hasField(fixedDecimal, 'rotation.formulaB')).toBe(false);

    expect(radialSignificant.valid).toBe(false);
    expect(hasField(radialSignificant, 'decimalPlaces')).toBe(false);
    expect(hasField(radialSignificant, 'significantDigits')).toBe(true);
    expect(hasField(radialSignificant, 'rotation.fixedRotationDeg')).toBe(false);
    expect(hasField(radialSignificant, 'rotation.rotationOffsetDeg')).toBe(true);
    expect(hasField(radialSignificant, 'rotation.formulaA')).toBe(false);
    expect(hasField(radialSignificant, 'rotation.formulaB')).toBe(false);

    expect(customFormulaDecimal.valid).toBe(false);
    expect(hasField(customFormulaDecimal, 'decimalPlaces')).toBe(true);
    expect(hasField(customFormulaDecimal, 'significantDigits')).toBe(false);
    expect(hasField(customFormulaDecimal, 'rotation.fixedRotationDeg')).toBe(false);
    expect(hasField(customFormulaDecimal, 'rotation.rotationOffsetDeg')).toBe(false);
    expect(hasField(customFormulaDecimal, 'rotation.formulaA')).toBe(true);
    expect(hasField(customFormulaDecimal, 'rotation.formulaB')).toBe(true);
  });

  it('requires individual angle entry count to match Count', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 3,
      angleMode: 'individualAngles',
      individualAnglesText: '0, 90',
    });

    expect(result.valid).toBe(false);
    expect(
      result.messages.some(
        (message) =>
          message.field === 'individualAnglesText' &&
          message.message === 'Individual angle entry count must match Count.',
      ),
    ).toBe(true);
  });

  it('accepts expressions in individual angle lists', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 3,
      angleMode: 'individualAngles',
      individualAnglesText: '360/8; (90 + 45)\n-90',
    });

    expect(result.valid).toBe(true);
  });

  it('reports missing individual angles for whitespace-only input', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 2,
      angleMode: 'individualAngles',
      individualAnglesText: ' \n\t ',
    });

    expect(result.valid).toBe(false);
    expect(
      result.messages.some(
        (message) =>
          message.field === 'individualAnglesText' &&
          message.message === 'Individual angles must contain one angle per component.',
      ),
    ).toBe(true);
  });

  it('blocks invalid and divide-by-zero individual angle expressions', () => {
    const invalidExpression = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 2,
      angleMode: 'individualAngles',
      individualAnglesText: '0, 90 +',
    });
    const divideByZero = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 2,
      angleMode: 'individualAngles',
      individualAnglesText: '0, 1/0',
    });

    expect(invalidExpression.valid).toBe(false);
    expect(invalidExpression.messages.some((message) => message.field === 'individualAnglesText')).toBe(true);
    expect(divideByZero.valid).toBe(false);
    expect(divideByZero.messages.some((message) => message.message === 'Division by zero is not allowed.')).toBe(true);
  });

  it('blocks empty individual angle list items', () => {
    const result = validateSettings({
      ...DEFAULT_SETTINGS,
      count: 2,
      angleMode: 'individualAngles',
      individualAnglesText: '0,,90',
    });

    expect(result.valid).toBe(false);
    expect(
      result.messages.some((message) => message.message === 'Individual angles must not contain empty list items.'),
    ).toBe(true);
  });
});
