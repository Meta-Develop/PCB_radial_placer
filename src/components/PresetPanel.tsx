import { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, EXAMPLE_PRESETS } from '../core/defaults';
import { downloadTextFile } from '../core/download';
import { deletePresetRecord, parsePresetImport, savePresetRecord } from '../core/presets';
import type { PlacementSettings, PresetRecord } from '../types';

interface PresetPanelProps {
  settings: PlacementSettings;
  presets: PresetRecord[];
  onPresetsChange: (presets: PresetRecord[]) => void;
  onLoadSettings: (settings: PlacementSettings) => void;
}

export function PresetPanel({ settings, presets, onPresetsChange, onLoadSettings }: PresetPanelProps) {
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
      setStatus('Preset name is required.');
      return;
    }
    onPresetsChange(savePresetRecord(trimmedName, settings));
    setStatus(`Saved ${trimmedName}.`);
  };

  const importPreset = () => {
    try {
      onLoadSettings(parsePresetImport(importText));
      setImportText('');
      setStatus('Imported preset settings.');
    } catch {
      setStatus('Import failed. Paste a settings or preset JSON object.');
    }
  };

  return (
    <section className="panel preset-panel" aria-labelledby="preset-heading">
      <div className="section-heading">
        <h2 id="preset-heading">Presets</h2>
      </div>
      <div className="preset-grid">
        <label>
          Preset name
          <input type="text" value={presetName} onChange={(event) => setPresetName(event.target.value)} />
        </label>
        <button type="button" onClick={savePreset}>
          Save Preset
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
          Export Preset
        </button>
        <button type="button" onClick={() => onLoadSettings(DEFAULT_SETTINGS)}>
          Reset Defaults
        </button>
      </div>

      <div className="preset-list" aria-label="Saved presets">
        {sortedPresets.length === 0 ? (
          <p className="muted">No saved local presets yet.</p>
        ) : (
          sortedPresets.map((preset) => (
            <div className="preset-row" key={preset.id}>
              <span>
                <strong>{preset.name}</strong>
                <small>{new Date(preset.savedAt).toLocaleString()}</small>
              </span>
              <button type="button" onClick={() => onLoadSettings(preset.settings)}>
                Load
              </button>
              <button type="button" onClick={() => onPresetsChange(deletePresetRecord(preset.id))}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <details>
        <summary>Example presets and JSON import</summary>
        <div className="example-presets">
          {EXAMPLE_PRESETS.map((preset) => (
            <button type="button" key={preset.name} onClick={() => onLoadSettings(preset.settings)}>
              {preset.name}
            </button>
          ))}
        </div>
        <label>
          Import preset JSON
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={5} />
        </label>
        <button type="button" onClick={importPreset} disabled={!importText.trim()}>
          Import JSON
        </button>
      </details>
      {status && <p className="status-line">{status}</p>}
    </section>
  );
}
