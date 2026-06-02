import type { ChangeEvent } from 'react';
import type { AngleMode, CoordinateSystem, Direction, PlacementSettings, RotationMode, RotationNormalizeMode, Unit } from '../types';

interface InputPanelProps {
  settings: PlacementSettings;
  onChange: (settings: PlacementSettings) => void;
}

function toNumber(event: ChangeEvent<HTMLInputElement>): number {
  return event.target.value === '' ? Number.NaN : Number(event.target.value);
}

export function InputPanel({ settings, onChange }: InputPanelProps) {
  const update = <K extends keyof PlacementSettings>(key: K, value: PlacementSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateReference = <K extends keyof PlacementSettings['reference']>(
    key: K,
    value: PlacementSettings['reference'][K],
  ) => {
    onChange({ ...settings, reference: { ...settings.reference, [key]: value } });
  };

  const updateRotation = <K extends keyof PlacementSettings['rotation']>(
    key: K,
    value: PlacementSettings['rotation'][K],
  ) => {
    onChange({ ...settings, rotation: { ...settings.rotation, [key]: value } });
  };

  return (
    <section className="panel input-panel" aria-labelledby="input-heading">
      <div className="section-heading">
        <h2 id="input-heading">Placement Inputs</h2>
      </div>

      <fieldset>
        <legend>Geometry</legend>
        <label>
          Count
          <input
            type="number"
            min={1}
            step={1}
            value={Number.isFinite(settings.count) ? settings.count : ''}
            onChange={(event) => update('count', Math.trunc(toNumber(event)))}
          />
        </label>
        <label>
          Radius
          <input
            type="number"
            step="any"
            min={0}
            value={Number.isFinite(settings.radius) ? settings.radius : ''}
            onChange={(event) => update('radius', toNumber(event))}
          />
        </label>
        <label>
          Center X
          <input
            type="number"
            step="any"
            value={Number.isFinite(settings.centerX) ? settings.centerX : ''}
            onChange={(event) => update('centerX', toNumber(event))}
          />
        </label>
        <label>
          Center Y
          <input
            type="number"
            step="any"
            value={Number.isFinite(settings.centerY) ? settings.centerY : ''}
            onChange={(event) => update('centerY', toNumber(event))}
          />
        </label>
        <label>
          Start angle
          <input
            type="number"
            step="any"
            value={Number.isFinite(settings.startAngleDeg) ? settings.startAngleDeg : ''}
            onChange={(event) => update('startAngleDeg', toNumber(event))}
          />
        </label>
        <label>
          Direction
          <select
            value={settings.direction}
            onChange={(event) => update('direction', event.target.value as Direction)}
          >
            <option value="counterclockwise">Counterclockwise</option>
            <option value="clockwise">Clockwise</option>
          </select>
        </label>
        <label>
          Coordinate system
          <select
            value={settings.coordinateSystem}
            onChange={(event) => update('coordinateSystem', event.target.value as CoordinateSystem)}
          >
            <option value="mathYUp">Mathematical Y-up</option>
            <option value="ecadYDown">Screen / ECAD Y-down</option>
          </select>
        </label>
        <label>
          Unit
          <select value={settings.unit} onChange={(event) => update('unit', event.target.value as Unit)}>
            <option value="mm">mm</option>
            <option value="inch">inch</option>
            <option value="mil">mil</option>
            <option value="unitless">unitless</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="angle-mode-fieldset">
        <legend>Angle Mode</legend>
        <label className="field-wide">
          Mode
          <select
            value={settings.angleMode}
            onChange={(event) => update('angleMode', event.target.value as AngleMode)}
          >
            <option value="fullCircle">Full circle: 360 / count</option>
            <option value="customStep">Custom step</option>
            <option value="arc">Arc between start and end</option>
          </select>
        </label>
        <label>
          Step angle
          <input
            type="number"
            step="any"
            disabled={settings.angleMode !== 'customStep'}
            value={Number.isFinite(settings.stepAngleDeg) ? settings.stepAngleDeg : ''}
            onChange={(event) => update('stepAngleDeg', toNumber(event))}
          />
        </label>
        <label>
          End angle
          <input
            type="number"
            step="any"
            disabled={settings.angleMode !== 'arc'}
            value={Number.isFinite(settings.endAngleDeg) ? settings.endAngleDeg : ''}
            onChange={(event) => update('endAngleDeg', toNumber(event))}
          />
        </label>
        <label className="inline-control">
          <input
            type="checkbox"
            disabled={settings.angleMode !== 'arc'}
            checked={settings.includeEndpoint}
            onChange={(event) => update('includeEndpoint', event.target.checked)}
          />
          Include arc endpoint
        </label>
      </fieldset>

      <fieldset>
        <legend>Reference Designators</legend>
        <label>
          Prefix
          <input
            type="text"
            value={settings.reference.prefix}
            onChange={(event) => updateReference('prefix', event.target.value)}
          />
        </label>
        <label>
          Start number
          <input
            type="number"
            step={1}
            value={Number.isFinite(settings.reference.startNumber) ? settings.reference.startNumber : ''}
            onChange={(event) => updateReference('startNumber', Math.trunc(toNumber(event)))}
          />
        </label>
        <label>
          Padding
          <input
            type="number"
            min={0}
            max={8}
            step={1}
            value={Number.isFinite(settings.reference.padding) ? settings.reference.padding : ''}
            onChange={(event) => updateReference('padding', Math.trunc(toNumber(event)))}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Rotation</legend>
        <label>
          Mode
          <select
            value={settings.rotation.mode}
            onChange={(event) => updateRotation('mode', event.target.value as RotationMode)}
          >
            <option value="fixed">Fixed</option>
            <option value="radialOutward">Radial outward</option>
            <option value="radialInward">Radial inward</option>
            <option value="tangentClockwise">Tangent clockwise</option>
            <option value="tangentCounterclockwise">Tangent counterclockwise</option>
            <option value="customFormulaSimple">Custom: a * theta + b</option>
          </select>
        </label>
        <label>
          Fixed rotation
          <input
            type="number"
            step="any"
            disabled={settings.rotation.mode !== 'fixed'}
            value={Number.isFinite(settings.rotation.fixedRotationDeg) ? settings.rotation.fixedRotationDeg : ''}
            onChange={(event) => updateRotation('fixedRotationDeg', toNumber(event))}
          />
        </label>
        <label>
          Offset
          <input
            type="number"
            step="any"
            disabled={settings.rotation.mode === 'fixed' || settings.rotation.mode === 'customFormulaSimple'}
            value={Number.isFinite(settings.rotation.rotationOffsetDeg) ? settings.rotation.rotationOffsetDeg : ''}
            onChange={(event) => updateRotation('rotationOffsetDeg', toNumber(event))}
          />
        </label>
        <label>
          Formula a
          <input
            type="number"
            step="any"
            disabled={settings.rotation.mode !== 'customFormulaSimple'}
            value={Number.isFinite(settings.rotation.formulaA) ? settings.rotation.formulaA : ''}
            onChange={(event) => updateRotation('formulaA', toNumber(event))}
          />
        </label>
        <label>
          Formula b
          <input
            type="number"
            step="any"
            disabled={settings.rotation.mode !== 'customFormulaSimple'}
            value={Number.isFinite(settings.rotation.formulaB) ? settings.rotation.formulaB : ''}
            onChange={(event) => updateRotation('formulaB', toNumber(event))}
          />
        </label>
        <label>
          Normalize
          <select
            value={settings.rotation.normalize}
            onChange={(event) => updateRotation('normalize', event.target.value as RotationNormalizeMode)}
          >
            <option value="zeroTo360">0 to 360</option>
            <option value="minus180To180">-180 to 180</option>
            <option value="none">None</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Output</legend>
        <label>
          Decimal places
          <input
            type="number"
            min={0}
            max={9}
            step={1}
            value={Number.isFinite(settings.decimalPlaces) ? settings.decimalPlaces : ''}
            onChange={(event) => update('decimalPlaces', Math.trunc(toNumber(event)))}
          />
        </label>
        <label className="inline-control">
          <input
            type="checkbox"
            checked={settings.export.includeHeaders}
            onChange={(event) =>
              onChange({ ...settings, export: { ...settings.export, includeHeaders: event.target.checked } })
            }
          />
          Include export headers
        </label>
      </fieldset>
    </section>
  );
}
