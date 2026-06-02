import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTextFile } from '../core/download';

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

function restoreUrlMethod(name: 'createObjectURL' | 'revokeObjectURL', descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(URL, name, descriptor);
  } else {
    Reflect.deleteProperty(URL, name);
  }
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreUrlMethod('createObjectURL', originalCreateObjectUrl);
  restoreUrlMethod('revokeObjectURL', originalRevokeObjectUrl);
});

describe('downloadTextFile', () => {
  it('clicks an attached anchor and defers object URL revocation', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:placement');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });

    const clickedAnchors: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
      clickedAnchors.push(this);
      expect(document.body.contains(this)).toBe(true);
      expect(revokeObjectURL).not.toHaveBeenCalled();
    });

    downloadTextFile('placement.csv', 'Ref,Index\nD1,0\n', 'text/csv;charset=utf-8');

    const clickedAnchor = clickedAnchors[0];
    expect(clickedAnchor?.download).toBe('placement.csv');
    expect(clickedAnchor ? document.body.contains(clickedAnchor) : true).toBe(false);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:placement');
  });
});
