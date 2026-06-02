import type { PlacementSettings, PresetRecord } from '../types';
import { normalizePlacementSettings, extractSettingsPayload } from './settings';

export const PRESETS_STORAGE_KEY = 'pcb-radial-placer:presets:v1';
export const RECENT_SETTINGS_STORAGE_KEY = 'pcb-radial-placer:recent-settings:v1';

export interface SavePresetRecordResult {
  records: PresetRecord[];
  saved: boolean;
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

function readStorageItem(key: string): string | null {
  try {
    return browserLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string): boolean {
  try {
    const storage = browserLocalStorage();
    if (!storage) {
      return false;
    }
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function createPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadPresetRecords(): PresetRecord[] {
  const raw = readStorageItem(PRESETS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((record, index) => {
      if (typeof record !== 'object' || record === null || Array.isArray(record)) {
        return [];
      }

      const candidate = record as Partial<PresetRecord>;
      return [
        {
          id: typeof candidate.id === 'string' ? candidate.id : `imported-${index}`,
          name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : `Imported ${index + 1}`,
          settings: normalizePlacementSettings(candidate.settings),
          savedAt:
            typeof candidate.savedAt === 'string' && candidate.savedAt
              ? candidate.savedAt
              : new Date(0).toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function storePresetRecords(records: PresetRecord[]): boolean {
  return writeStorageItem(PRESETS_STORAGE_KEY, JSON.stringify(records));
}

export function savePresetRecord(name: string, settings: PlacementSettings): SavePresetRecordResult {
  const records = loadPresetRecords();
  const trimmedName = name.trim();
  const existingIndex = records.findIndex((record) => record.name === trimmedName);
  const record: PresetRecord = {
    id: existingIndex >= 0 ? records[existingIndex].id : createPresetId(),
    name: trimmedName,
    settings,
    savedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }

  if (!storePresetRecords(records)) {
    return { records: loadPresetRecords(), saved: false };
  }
  return { records, saved: true };
}

export function deletePresetRecord(id: string): PresetRecord[] {
  const records = loadPresetRecords();
  const next = records.filter((record) => record.id !== id);
  return storePresetRecords(next) ? next : records;
}

export function loadRecentSettings(): PlacementSettings | null {
  const raw = readStorageItem(RECENT_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizePlacementSettings(extractSettingsPayload(JSON.parse(raw)));
  } catch {
    return null;
  }
}

export function storeRecentSettings(settings: PlacementSettings): boolean {
  return writeStorageItem(RECENT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function parsePresetImport(rawJson: string): PlacementSettings {
  return normalizePlacementSettings(extractSettingsPayload(JSON.parse(rawJson)));
}
