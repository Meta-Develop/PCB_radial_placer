import type { PlacementSettings } from '../types';

interface HelpPanelProps {
  settings: PlacementSettings;
}

export function HelpPanel({ settings }: HelpPanelProps) {
  const coordinateText =
    settings.coordinateSystem === 'mathYUp'
      ? 'Mathematical Y-up: y = centerY + radius * sin(theta).'
      : 'Screen / ECAD Y-down: y = centerY - radius * sin(theta).';

  return (
    <section className="panel help-panel" aria-labelledby="help-heading">
      <details open>
        <summary id="help-heading">Coordinate conventions and ECAD assumptions</summary>
        <div className="help-content">
          <p>
            Center offset is applied as <code>(centerX, centerY)</code>. Zero degrees points along +X.
            Angles are in degrees. Direction controls the sign of the angular step.
          </p>
          <p>{coordinateText}</p>
          <p>
            This MVP generates coordinates and exports data only. It does not edit <code>.kicad_pcb</code> files,
            preserve or mutate footprints, inspect clearances, or modify locked component state.
          </p>
          <p>
            Formula: <code>x = centerX + radius * cos(theta)</code>,{' '}
            <code>theta = startAngle + index * stepAngle</code>.
          </p>
        </div>
      </details>
    </section>
  );
}
