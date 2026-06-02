import type { ExportFormatOptions, Placement, PlacementSettings } from '../types';
import { formatNumber, roundedPlacement } from './format';

const HEADERS = ['Ref', 'Index', 'AngleDeg', 'X', 'Y', 'RotationDeg', 'Radius', 'CenterX', 'CenterY'];

function escapeDelimitedCell(value: string | number, delimiter: ',' | '\t'): string {
  const text = String(value);
  if (delimiter === '\t') {
    return text.replace(/\t/g, ' ');
  }
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowValues(placement: Placement, decimalPlaces: number): Array<string | number> {
  return [
    placement.ref,
    placement.index,
    formatNumber(placement.angleDeg, decimalPlaces),
    formatNumber(placement.x, decimalPlaces),
    formatNumber(placement.y, decimalPlaces),
    formatNumber(placement.rotationDeg, decimalPlaces),
    formatNumber(placement.radius, decimalPlaces),
    formatNumber(placement.centerX, decimalPlaces),
    formatNumber(placement.centerY, decimalPlaces),
  ];
}

export function formatPlacementsAsDelimited(
  placements: Placement[],
  options: ExportFormatOptions,
  delimiter: ',' | '\t',
): string {
  const rows = placements.map((placement) =>
    rowValues(placement, options.decimalPlaces)
      .map((value) => escapeDelimitedCell(value, delimiter))
      .join(delimiter),
  );

  if (options.includeHeaders) {
    rows.unshift(HEADERS.join(delimiter));
  }

  return `${rows.join('\n')}\n`;
}

export function formatPlacementsAsCsv(
  placements: Placement[],
  options: ExportFormatOptions,
): string {
  return formatPlacementsAsDelimited(placements, options, ',');
}

export function formatPlacementsAsTsv(
  placements: Placement[],
  options: ExportFormatOptions,
): string {
  return formatPlacementsAsDelimited(placements, options, '\t');
}

export function formatPlacementsAsJson(
  settings: PlacementSettings,
  placements: Placement[],
  options: ExportFormatOptions,
): string {
  return `${JSON.stringify(
    {
      settings,
      export: {
        decimalPlaces: options.decimalPlaces,
        coordinateConvention:
          settings.coordinateSystem === 'mathYUp'
            ? '0 degrees is +X; positive angles are counterclockwise; +Y is up.'
            : '0 degrees is +X; positive mathematical sine is flipped so +Y is down.',
      },
      placements: placements.map((placement) => roundedPlacement(placement, options.decimalPlaces)),
    },
    null,
    2,
  )}\n`;
}
