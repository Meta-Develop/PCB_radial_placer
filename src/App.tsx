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

export const LANGUAGE_STORAGE_KEY = 'pcb-radial-placer:language:v1';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.19-3.37-1.19-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.35 1.08 2.92.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M13.7 10.47 21.07 2h-1.75l-6.4 7.35L7.82 2H2l7.73 11.13L2 22h1.75l6.75-7.75L15.9 22H21.72l-8.02-11.53Zm-2.39 2.75-.78-1.11L4.3 3.3h2.68l5.02 7.1.78 1.1 6.54 9.25h-2.68l-5.33-7.54Z"
      />
    </svg>
  );
}

function browserLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadLanguage(): Language {
  try {
    return browserLocalStorage()?.getItem(LANGUAGE_STORAGE_KEY) === 'ja' ? 'ja' : 'en';
  } catch {
    return 'en';
  }
}

export function storeLanguage(language: Language): void {
  try {
    browserLocalStorage()?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // localStorage may be unavailable in private mode, sandboxed iframes, or locked-down profiles.
  }
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
    storeLanguage(language);
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
            <a
              href="https://github.com/Meta-Develop/PCB_radial_placer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={text.header.github}
              title={text.header.github}
            >
              <GitHubIcon />
            </a>
            <a
              href="https://x.com/Meta_for_Life"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={text.header.x}
              title={text.header.x}
            >
              <XIcon />
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
