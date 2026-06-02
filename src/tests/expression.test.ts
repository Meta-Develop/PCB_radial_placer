import { describe, expect, it } from 'vitest';
import { parseNumericExpression } from '../core/expression';

function value(input: string): number {
  const parsed = parseNumericExpression(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return parsed.value;
}

describe('parseNumericExpression', () => {
  it('evaluates deterministic arithmetic expressions', () => {
    expect(value('2.54/2')).toBeCloseTo(1.27, 12);
    expect(value('10 + 1.27')).toBeCloseTo(11.27, 12);
    expect(value('(10 + 2) * -3 / 2')).toBeCloseTo(-18, 12);
    expect(value('1e-3 * 2')).toBeCloseTo(0.002, 12);
  });

  it('marks operator and parenthesized values as expressions', () => {
    expect(parseNumericExpression('2.54/2')).toMatchObject({ ok: true, isExpression: true });
    expect(parseNumericExpression('(5)')).toMatchObject({ ok: true, isExpression: true });
    expect(parseNumericExpression('5')).toMatchObject({ ok: true, isExpression: false });
  });

  it('rejects invalid expressions without falling back to zero', () => {
    expect(parseNumericExpression('2/0')).toMatchObject({ ok: false });
    expect(parseNumericExpression('10 +')).toMatchObject({ ok: false });
    expect(parseNumericExpression('Math.max(1, 2)')).toMatchObject({ ok: false });
    expect(parseNumericExpression('2**3')).toMatchObject({ ok: false });
  });
});
