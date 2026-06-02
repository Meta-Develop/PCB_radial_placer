import { useEffect, useMemo, useState } from 'react';
import { HelpPanel } from './components/HelpPanel';
import { InputPanel } from './components/InputPanel';
import { DistributionGraph } from './components/DistributionGraph';
import { OutputTable } from './components/OutputTable';
import { PresetPanel } from './components/PresetPanel';
import { PreviewSvg } from './components/PreviewSvg';
import { ValidationPanel } from './components/ValidationPanel';
import { calculateDerivedGeometry } from './core/geometry';
import { calculatePlacements } from './core/placement';
import { loadPresetRecords, loadRecentSettings, storeRecentSettings } from './core/presets';
import { validateSettings } from './core/validation';
import { formatNumber, outputFormatOptions } from './core/format';
import type { Language } from './i18n';
import { UI_TEXT } from './i18n';
import type { PlacementSettings, PresetRecord } from './types';
import './styles.css';
import { normalizePlacementSettings } from './core/settings';

const LANGUAGE_STORAGE_KEY = 'pcb-radial-placer:language:v1';

function loadLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ja' ? 'ja' : 'en';
}

export function App() {
  const [settings, setSettings] = useState<PlacementSettings>(() => normalizePlacementSettings(loadRecentSettings()));
  const [presets, setPresets] = useState<PresetRecord[]>(() => loadPresetRecords());
  const [language, setLanguage] = useState<Language>(() => loadLanguage());
  const [showLabels, setShowLabels] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [boardOutlineRadius, setBoardOutlineRadius] = useState(0);
  const text = UI_TEXT[language];

  useEffect(() => {
    storeRecentSettings(settings);
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const validation = useMemo(() => validateSettings(settings), [settings]);
  const placements = useMemo(
    () => (validation.valid ? calculatePlacements(settings) : []),
    [settings, validation.valid],
  );
  const derived = useMemo(() => calculateDerivedGeometry(settings), [settings]);
  const precision = useMemo(
    () =>
      outputFormatOptions({
        precisionMode: settings.outputPrecisionMode,
        decimalPlaces: settings.decimalPlaces,
        significantDigits: settings.significantDigits,
      }),
    [settings.decimalPlaces, settings.outputPrecisionMode, settings.significantDigits],
  );

  return (
    <main>
      <header className="app-header">
        <div>
          <h1>PCB Radial Placer</h1>
          <p>{text.header.subtitle}</p>
        </div>
        <div className="header-right">
          <nav className="header-links" aria-label={text.header.linksLabel}>
            <a href="https://github.com/Meta-Develop" target="_blank" rel="noopener noreferrer" aria-label={text.header.github}>
              GitHub
            </a>
            <a href="https://x.com/Meta_for_Life" target="_blank" rel="noopener noreferrer" aria-label={text.header.x}>
              X
            </a>
          </nav>
          <label className="language-switch">
            {text.languageLabel}
            <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              <option value="en">{text.languageNames.en}</option>
              <option value="ja">{text.languageNames.ja}</option>
            </select>
          </label>
          <div className="header-facts" aria-label={text.header.factsLabel}>
            <span>{text.header.zeroDeg}</span>
            <span>{settings.coordinateSystem === 'mathYUp' ? text.header.yUp : text.header.yDown}</span>
            <span>{settings.direction === 'counterclockwise' ? text.header.ccw : text.header.cw}</span>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="left-column">
          <InputPanel settings={settings} onChange={setSettings} language={language} text={text.input} />
          <PresetPanel
            settings={settings}
            presets={presets}
            onPresetsChange={setPresets}
            onLoadSettings={(nextSettings) => setSettings(normalizePlacementSettings(nextSettings))}
            text={text.preset}
          />
          <HelpPanel settings={settings} text={text.help} />
        </aside>

        <section className="right-column">
          <section className="panel summary-panel" aria-label={text.summary.label}>
            <ValidationPanel validation={validation} language={language} text={text.validation} />
            <dl className="summary-grid">
              <div>
                <dt>{text.summary.signedStep}</dt>
                <dd>{formatNumber(derived.signedStepAngleDeg, precision)} deg</dd>
              </div>
              <div>
                <dt>{text.summary.angularPitch}</dt>
                <dd>{formatNumber(derived.angularPitchDeg, precision)} deg</dd>
              </div>
              <div>
                <dt>{text.summary.chordLength}</dt>
                <dd>
                  {formatNumber(derived.chordLength, precision)} {settings.unit}
                </dd>
              </div>
              <div>
                <dt>{text.summary.arcLength}</dt>
                <dd>
                  {formatNumber(derived.arcLength, precision)} {settings.unit}
                </dd>
              </div>
              <div>
                <dt>{text.summary.circumference}</dt>
                <dd>
                  {formatNumber(derived.circumference, precision)} {settings.unit}
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
            language={language}
            text={text.preview}
          />
          <DistributionGraph placements={placements} settings={settings} text={text.graph} />
          <OutputTable placements={placements} settings={settings} validation={validation} text={text.outputTable} />
        </section>
      </div>
    </main>
  );
}
