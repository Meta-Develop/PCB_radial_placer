import type { ExportFormatOptions, Placement, PlacementSettings } from '../types';
import { formatNumber, outputFormatOptions, roundedPlacement } from './format';

const HEADERS = [
  'Ref',
  'Index',
  'AngleDeg',
  'X',
  'Y',
  'TargetCenterX',
  'TargetCenterY',
  'AppliedOffsetX',
  'AppliedOffsetY',
  'RotationDeg',
  'Radius',
  'CenterX',
  'CenterY',
];

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

function rowValues(placement: Placement, options: ExportFormatOptions): Array<string | number> {
  const precision = outputFormatOptions(options);

  return [
    placement.ref,
    placement.index,
    formatNumber(placement.angleDeg, precision),
    formatNumber(placement.x, precision),
    formatNumber(placement.y, precision),
    formatNumber(placement.targetCenterX, precision),
    formatNumber(placement.targetCenterY, precision),
    formatNumber(placement.appliedOffsetX, precision),
    formatNumber(placement.appliedOffsetY, precision),
    formatNumber(placement.rotationDeg, precision),
    formatNumber(placement.radius, precision),
    formatNumber(placement.centerX, precision),
    formatNumber(placement.centerY, precision),
  ];
}

export function formatPlacementsAsDelimited(
  placements: Placement[],
  options: ExportFormatOptions,
  delimiter: ',' | '\t',
): string {
  const rows = placements.map((placement) =>
    rowValues(placement, options)
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
        precisionMode: options.precisionMode,
        decimalPlaces: options.decimalPlaces,
        significantDigits: options.significantDigits,
        coordinateConvention:
          settings.coordinateSystem === 'mathYUp'
            ? '0 degrees is +X; positive angles are counterclockwise; +Y is up.'
            : '0 degrees is +X; positive mathematical sine is flipped so +Y is down.',
      },
      placements: placements.map((placement) => roundedPlacement(placement, outputFormatOptions(options))),
    },
    null,
    2,
  )}\n`;
}
