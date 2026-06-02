import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OutputTable } from '../components/OutputTable';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculatePlacements } from '../core/placement';
import { UI_TEXT } from '../i18n';

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function restoreClipboard() {
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
}

function replaceClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });
}

afterEach(() => {
  cleanup();
  restoreClipboard();
  vi.restoreAllMocks();
});

function renderOutputTable() {
  const settings = {
    ...DEFAULT_SETTINGS,
    count: 2,
  };
  render(
    <OutputTable
      placements={calculatePlacements(settings)}
      settings={settings}
      validation={{ valid: true, messages: [] }}
      text={UI_TEXT.en.outputTable}
    />,
  );
}

describe('OutputTable clipboard handling', () => {
  it('reports failure when the Clipboard API is unavailable', () => {
    replaceClipboard(undefined);
    renderOutputTable();

    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.outputTable.copyTsv }));

    expect(screen.queryByText(UI_TEXT.en.outputTable.copyFailed)).not.toBeNull();
  });

  it('catches Clipboard API write rejections', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('clipboard denied');
    });
    replaceClipboard({ writeText });
    renderOutputTable();

    fireEvent.click(screen.getByRole('button', { name: UI_TEXT.en.outputTable.copyTsv }));

    expect(await screen.findByText(UI_TEXT.en.outputTable.copyFailed)).not.toBeNull();
    expect(writeText).toHaveBeenCalled();
  });
});
