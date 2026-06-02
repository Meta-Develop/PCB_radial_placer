import { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, EXAMPLE_PRESETS } from '../core/defaults';
import { downloadTextFile } from '../core/download';
import { deletePresetRecord, parsePresetImport, savePresetRecord } from '../core/presets';
import type { UiText } from '../i18n';
import type { PlacementSettings, PresetRecord } from '../types';

interface PresetPanelProps {
  settings: PlacementSettings;
  presets: PresetRecord[];
  onPresetsChange: (presets: PresetRecord[]) => void;
  onLoadSettings: (settings: PlacementSettings) => void;
  text: UiText['preset'];
}

export function PresetPanel({ settings, presets, onPresetsChange, onLoadSettings, text }: PresetPanelProps) {
  const [presetName, setPresetName] = useState('My radial layout');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('');

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => a.name.localeCompare(b.name)),
    [presets],
  );

  const savePreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) {
      setStatus(text.nameRequired);
      return;
    }
    onPresetsChange(savePresetRecord(trimmedName, settings));
    setStatus(text.saved(trimmedName));
  };

  const importPreset = () => {
    try {
      onLoadSettings(parsePresetImport(importText));
      setImportText('');
      setStatus(text.imported);
    } catch {
      setStatus(text.importFailed);
    }
  };

  return (
    <section className="panel preset-panel" aria-labelledby="preset-heading">
      <div className="section-heading">
        <h2 id="preset-heading">{text.heading}</h2>
      </div>
      <div className="preset-grid">
        <label>
          {text.presetName}
          <input type="text" value={presetName} onChange={(event) => setPresetName(event.target.value)} />
        </label>
        <button type="button" onClick={savePreset}>
          {text.save}
        </button>
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              'radial-placement-preset.json',
              `${JSON.stringify({ name: presetName, settings }, null, 2)}\n`,
              'application/json;charset=utf-8',
            )
          }
        >
          {text.export}
        </button>
        <button type="button" onClick={() => onLoadSettings(DEFAULT_SETTINGS)}>
          {text.reset}
        </button>
      </div>

      <div className="preset-list" aria-label={text.savedPresetsLabel}>
        {sortedPresets.length === 0 ? (
          <p className="muted">{text.none}</p>
        ) : (
          sortedPresets.map((preset) => (
            <div className="preset-row" key={preset.id}>
              <span>
                <strong>{preset.name}</strong>
                <small>{new Date(preset.savedAt).toLocaleString()}</small>
              </span>
              <button type="button" onClick={() => onLoadSettings(preset.settings)}>
                {text.load}
              </button>
              <button type="button" onClick={() => onPresetsChange(deletePresetRecord(preset.id))}>
                {text.delete}
              </button>
            </div>
          ))
        )}
      </div>

      <details>
        <summary>{text.details}</summary>
        <div className="example-presets">
          {EXAMPLE_PRESETS.map((preset) => (
            <button type="button" key={preset.name} onClick={() => onLoadSettings(preset.settings)}>
              {preset.name}
            </button>
          ))}
        </div>
        <label>
          {text.importLabel}
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={5} />
        </label>
        <button type="button" onClick={importPreset} disabled={!importText.trim()}>
          {text.importButton}
        </button>
      </details>
      {status && <p className="status-line">{status}</p>}
    </section>
  );
}
