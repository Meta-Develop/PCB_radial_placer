import { useEffect, useMemo, useState } from 'react';
import { HelpPanel } from './components/HelpPanel';
import { InputPanel } from './components/InputPanel';
import { OutputTable } from './components/OutputTable';
import { PresetPanel } from './components/PresetPanel';
import { PreviewSvg } from './components/PreviewSvg';
import { ValidationPanel } from './components/ValidationPanel';
import { calculateDerivedGeometry } from './core/geometry';
import { calculatePlacements } from './core/placement';
import { loadPresetRecords, loadRecentSettings, storeRecentSettings } from './core/presets';
import { validateSettings } from './core/validation';
import { formatNumber } from './core/format';
import type { PlacementSettings, PresetRecord } from './types';
import './styles.css';
import { normalizePlacementSettings } from './core/settings';

export function App() {
  const [settings, setSettings] = useState<PlacementSettings>(() => normalizePlacementSettings(loadRecentSettings()));
  const [presets, setPresets] = useState<PresetRecord[]>(() => loadPresetRecords());
  const [showLabels, setShowLabels] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [boardOutlineRadius, setBoardOutlineRadius] = useState(0);

  useEffect(() => {
    storeRecentSettings(settings);
  }, [settings]);

  const validation = useMemo(() => validateSettings(settings), [settings]);
  const placements = useMemo(
    () => (validation.valid ? calculatePlacements(settings) : []),
    [settings, validation.valid],
  );
  const derived = useMemo(() => calculateDerivedGeometry(settings), [settings]);

  return (
    <main>
      <header className="app-header">
        <div>
          <h1>PCB Radial Placer</h1>
          <p>Static coordinate calculator for radial ECAD placement tables.</p>
        </div>
        <div className="header-facts" aria-label="Current coordinate convention">
          <span>0 deg = +X</span>
          <span>{settings.coordinateSystem === 'mathYUp' ? '+Y up' : '+Y down'}</span>
          <span>{settings.direction === 'counterclockwise' ? 'CCW positive step' : 'CW negative step'}</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="left-column">
          <InputPanel settings={settings} onChange={setSettings} />
          <PresetPanel
            settings={settings}
            presets={presets}
            onPresetsChange={setPresets}
            onLoadSettings={(nextSettings) => setSettings(normalizePlacementSettings(nextSettings))}
          />
          <HelpPanel settings={settings} />
        </aside>

        <section className="right-column">
          <section className="panel summary-panel" aria-label="Geometry summary">
            <ValidationPanel validation={validation} />
            <dl className="summary-grid">
              <div>
                <dt>Signed step</dt>
                <dd>{formatNumber(derived.signedStepAngleDeg, settings.decimalPlaces)} deg</dd>
              </div>
              <div>
                <dt>Angular pitch</dt>
                <dd>{formatNumber(derived.angularPitchDeg, settings.decimalPlaces)} deg</dd>
              </div>
              <div>
                <dt>Chord length</dt>
                <dd>
                  {formatNumber(derived.chordLength, settings.decimalPlaces)} {settings.unit}
                </dd>
              </div>
              <div>
                <dt>Arc length</dt>
                <dd>
                  {formatNumber(derived.arcLength, settings.decimalPlaces)} {settings.unit}
                </dd>
              </div>
              <div>
                <dt>Circumference</dt>
                <dd>
                  {formatNumber(derived.circumference, settings.decimalPlaces)} {settings.unit}
                </dd>
              </div>
            </dl>
          </section>

          <PreviewSvg
            placements={placements}
            settings={settings}
            showLabels={showLabels}
            showAxes={showAxes}
            boardOutlineRadius={boardOutlineRadius}
            onShowLabelsChange={setShowLabels}
            onShowAxesChange={setShowAxes}
            onBoardOutlineRadiusChange={setBoardOutlineRadius}
          />
          <OutputTable placements={placements} settings={settings} validation={validation} />
        </section>
      </div>
    </main>
  );
}
