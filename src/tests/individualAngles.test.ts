import { describe, expect, it } from 'vitest';
import { parseIndividualAngles } from '../core/individualAngles';

describe('parseIndividualAngles', () => {
  it('ignores trailing textarea newlines and separators', () => {
    expect(parseIndividualAngles('0\n45\n180\n270\n315\n90\n135\n225\n')).toEqual({
      angles: [0, 45, 180, 270, 315, 90, 135, 225],
      errors: [],
    });
    expect(parseIndividualAngles('0, 90,')).toEqual({ angles: [0, 90], errors: [] });
    expect(parseIndividualAngles('0; 90; \n')).toEqual({ angles: [0, 90], errors: [] });
  });

  it('returns no parsed angles for whitespace-only input', () => {
    expect(parseIndividualAngles(' \n\t ')).toEqual({ angles: [], errors: [] });
  });

  it('rejects internal empty list items', () => {
    expect(parseIndividualAngles('0,,90').errors).toContainEqual({
      index: 1,
      raw: '',
      message: 'Individual angles must not contain empty list items.',
    });
    expect(parseIndividualAngles('0; ;90').errors).toContainEqual({
      index: 1,
      raw: '',
      message: 'Individual angles must not contain empty list items.',
    });
    expect(parseIndividualAngles('0\n\n90').errors).toContainEqual({
      index: 1,
      raw: '',
      message: 'Individual angles must not contain empty list items.',
    });
  });
});
