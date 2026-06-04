import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputPanel } from '../components/InputPanel';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { UI_TEXT } from '../i18n';
import type { PlacementSettings, RotationMode } from '../types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderInputPanel(settings: PlacementSettings = DEFAULT_SETTINGS) {
  const onChange = vi.fn();

  render(
    <InputPanel
      settings={settings}
      onChange={onChange}
      language="en"
      text={UI_TEXT.en.input}
    />,
  );

  return onChange;
}

describe('InputPanel rotation offset control', () => {
  it('shows rotation offset for every rotation mode', () => {
    const modes: RotationMode[] = [
      'fixed',
      'radialOutward',
      'radialInward',
      'tangentClockwise',
      'tangentCounterclockwise',
      'customFormulaSimple',
    ];

    for (const mode of modes) {
      renderInputPanel({ ...DEFAULT_SETTINGS, rotation: { ...DEFAULT_SETTINGS.rotation, mode } });

      expect(screen.getByLabelText(new RegExp(UI_TEXT.en.input.rotationOffset))).not.toBeNull();

      cleanup();
    }
  });

  it('accepts numeric expressions for rotation offset', () => {
    const onChange = renderInputPanel({
      ...DEFAULT_SETTINGS,
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' },
    });

    fireEvent.change(screen.getByLabelText(new RegExp(UI_TEXT.en.input.rotationOffset)), {
      target: { value: '360/8' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        rotation: expect.objectContaining({ rotationOffsetDeg: 45 }),
        inputExpressions: expect.objectContaining({ 'rotation.rotationOffsetDeg': '360/8' }),
      }),
    );
  });
});
