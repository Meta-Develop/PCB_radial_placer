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
    });

    expect(result.valid).toBe(false);
    expect(result.messages.some((message) => message.field === 'count')).toBe(true);
    expect(result.messages.some((message) => message.field === 'radius')).toBe(true);
    expect(result.messages.some((message) => message.field === 'decimalPlaces')).toBe(true);
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
});
