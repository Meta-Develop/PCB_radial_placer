import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { validateSettings } from '../core/validation';

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
    expect(result.messages.some((message) => message.field === 'count')).toBe(true);
    expect(result.messages.some((message) => message.field === 'radius')).toBe(true);
    expect(result.messages.some((message) => message.field === 'decimalPlaces')).toBe(true);
    expect(result.messages.some((message) => message.field === 'significantDigits')).toBe(true);
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
    expect(result.messages.some((message) => message.field === 'radius')).toBe(true);
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
