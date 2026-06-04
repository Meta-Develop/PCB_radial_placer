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

      expect(screen.getByRole('textbox', { name: new RegExp(UI_TEXT.en.input.rotationOffset) })).not.toBeNull();

      cleanup();
    }
  });

  it('accepts numeric expressions for rotation offset', () => {
    const onChange = renderInputPanel({
      ...DEFAULT_SETTINGS,
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(UI_TEXT.en.input.rotationOffset) }), {
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

describe('InputPanel reset controls', () => {
  it('resets the whole form to default settings from a changed state', () => {
    const onChange = renderInputPanel({
      ...DEFAULT_SETTINGS,
      count: 12,
      coordinateSystem: 'ecadYDown',
      inputExpressions: { radius: '5*2' },
      reference: { ...DEFAULT_SETTINGS.reference, prefix: 'SW' },
    });

    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.input.resetAll }));

    expect(onChange).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it('resets one numeric field and clears only that stale expression', () => {
    const settings: PlacementSettings = {
      ...DEFAULT_SETTINGS,
      radius: 5,
      centerX: 2,
      inputExpressions: {
        radius: '20/4',
        centerX: '1+1',
      },
    };
    const onChange = renderInputPanel(settings);

    fireEvent.click(screen.getByRole('button', { name: /reset radius/i }));

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      radius: DEFAULT_SETTINGS.radius,
      inputExpressions: {
        centerX: '1+1',
      },
    });
  });

  it('resets one non-numeric control without wiping another changed value', () => {
    const settings: PlacementSettings = {
      ...DEFAULT_SETTINGS,
      coordinateSystem: 'ecadYDown',
      reference: { ...DEFAULT_SETTINGS.reference, prefix: 'SW' },
    };
    const onChange = renderInputPanel(settings);

    fireEvent.click(screen.getByRole('button', { name: /reset coordinate system/i }));

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      coordinateSystem: DEFAULT_SETTINGS.coordinateSystem,
    });
  });
});
