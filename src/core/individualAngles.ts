import { parseNumericExpression } from './expression';

export interface IndividualAngleEntryError {
  index: number;
  raw: string;
  message: string;
}

export interface ParsedIndividualAngles {
  angles: number[];
  errors: IndividualAngleEntryError[];
}

export function parseIndividualAngles(input: string): ParsedIndividualAngles {
  const listText = input.trim().replace(/[\s,;]+$/, '');
  if (listText === '') {
    return { angles: [], errors: [] };
  }

  const tokens = listText.split(/[\n,;]/);
  const errors: IndividualAngleEntryError[] = [];
  const angles: number[] = [];

  tokens.forEach((token, index) => {
    const raw = token.trim();
    if (raw === '') {
      errors.push({
        index,
        raw,
        message: 'Individual angles must not contain empty list items.',
      });
      return;
    }

    const parsed = parseNumericExpression(raw);
    if (!parsed.ok) {
      errors.push({ index, raw, message: parsed.error });
      return;
    }

    angles.push(parsed.value);
  });

  return { angles, errors };
}

export function representativeIndividualStep(angles: number[]): number {
  if (angles.length < 2) {
    return 0;
  }

  const deltas = angles.slice(1).map((angle, index) => angle - angles[index]);
  const sum = deltas.reduce((total, delta) => total + delta, 0);
  return sum / deltas.length;
}
