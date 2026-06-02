import type { Placement, PlacementSettings, ValidationResult } from '../types';
import { downloadTextFile } from '../core/download';
import { formatPlacementsAsCsv, formatPlacementsAsJson, formatPlacementsAsTsv } from '../core/export';
import { formatNumber } from '../core/format';

interface OutputTableProps {
  placements: Placement[];
  settings: PlacementSettings;
  validation: ValidationResult;
}

function exportOptions(settings: PlacementSettings) {
  return {
    includeHeaders: settings.export.includeHeaders,
    decimalPlaces: settings.decimalPlaces,
  };
}

export function OutputTable({ placements, settings, validation }: OutputTableProps) {
  const options = exportOptions(settings);
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
          <h2 id="output-heading">Placement Table</h2>
          <p>
            {placements.length} rows, {settings.unit === 'unitless' ? 'unitless coordinates' : settings.unit}
          </p>
        </div>
        <div className="button-row">
          <button type="button" onClick={copyTable} disabled={disabled}>
            Copy TSV
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.csv', csv, 'text/csv;charset=utf-8')}
            disabled={disabled}
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.tsv', tsv, 'text/tab-separated-values;charset=utf-8')}
            disabled={disabled}
          >
            TSV
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement.json', json, 'application/json;charset=utf-8')}
            disabled={disabled}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Ref</th>
              <th>Angle deg</th>
              <th>X</th>
              <th>Y</th>
              <th>Rotation deg</th>
              <th>Radius</th>
              <th>Center X</th>
              <th>Center Y</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={`${placement.ref}-${placement.index}`}>
                <td>{placement.index}</td>
                <td>{placement.ref}</td>
                <td>{formatNumber(placement.angleDeg, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.x, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.y, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.rotationDeg, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.radius, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.centerX, settings.decimalPlaces)}</td>
                <td>{formatNumber(placement.centerY, settings.decimalPlaces)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
