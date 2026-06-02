import type { Placement, PlacementSettings, ValidationResult } from '../types';
import { downloadTextFile } from '../core/download';
import { formatPlacementsAsCsv, formatPlacementsAsJson, formatPlacementsAsTsv } from '../core/export';
import { formatNumber, outputFormatOptions } from '../core/format';
import type { UiText } from '../i18n';

interface OutputTableProps {
  placements: Placement[];
  settings: PlacementSettings;
  validation: ValidationResult;
  text: UiText['outputTable'];
}

function exportOptions(settings: PlacementSettings) {
  return {
    includeHeaders: settings.export.includeHeaders,
    precisionMode: settings.outputPrecisionMode,
    decimalPlaces: settings.decimalPlaces,
    significantDigits: settings.significantDigits,
  };
}

export function OutputTable({ placements, settings, validation, text }: OutputTableProps) {
  const options = exportOptions(settings);
  const precision = outputFormatOptions(options);
  const csv = formatPlacementsAsCsv(placements, options);
  const tsv = formatPlacementsAsTsv(placements, options);
  const json = formatPlacementsAsJson(settings, placements, options);

  const copyTable = async () => {
    await navigator.clipboard.writeText(tsv);
  };

  const disabled = !validation.valid || placements.length === 0;

  return (
    <section className="panel table-panel" aria-labelledby="output-heading">
      <div className="section-heading table-heading">
        <div>
          <h2 id="output-heading">{text.heading}</h2>
          <p>
            {text.rowsSummary(
              placements.length,
              settings.unit === 'unitless' ? text.unitlessCoordinates : settings.unit,
            )}
          </p>
        </div>
        <div className="button-row">
          <button type="button" onClick={copyTable} disabled={disabled}>
            {text.copyTsv}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.csv', csv, 'text/csv;charset=utf-8')}
            disabled={disabled}
          >
            {text.csv}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.tsv', tsv, 'text/tab-separated-values;charset=utf-8')}
            disabled={disabled}
          >
            {text.tsv}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.json', json, 'application/json;charset=utf-8')}
            disabled={disabled}
          >
            {text.json}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{text.columns.index}</th>
              <th>{text.columns.ref}</th>
              <th>{text.columns.angleDeg}</th>
              <th>{text.columns.originX}</th>
              <th>{text.columns.originY}</th>
              <th>{text.columns.targetCenterX}</th>
              <th>{text.columns.targetCenterY}</th>
              <th>{text.columns.appliedOffsetX}</th>
              <th>{text.columns.appliedOffsetY}</th>
              <th>{text.columns.rotationDeg}</th>
              <th>{text.columns.radius}</th>
              <th>{text.columns.centerX}</th>
              <th>{text.columns.centerY}</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={`${placement.ref}-${placement.index}`}>
                <td>{placement.index}</td>
                <td>{placement.ref}</td>
                <td>{formatNumber(placement.angleDeg, precision)}</td>
                <td>{formatNumber(placement.x, precision)}</td>
                <td>{formatNumber(placement.y, precision)}</td>
                <td>{formatNumber(placement.targetCenterX, precision)}</td>
                <td>{formatNumber(placement.targetCenterY, precision)}</td>
                <td>{formatNumber(placement.appliedOffsetX, precision)}</td>
                <td>{formatNumber(placement.appliedOffsetY, precision)}</td>
                <td>{formatNumber(placement.rotationDeg, precision)}</td>
                <td>{formatNumber(placement.radius, precision)}</td>
                <td>{formatNumber(placement.centerX, precision)}</td>
                <td>{formatNumber(placement.centerY, precision)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
