import { describe, expect, it } from 'vitest';
import { buildPreviewSvg } from '../components/PreviewSvg';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculatePlacements } from '../core/placement';

function yAttributeForText(svg: string, textValue: string): number {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const text = [...doc.querySelectorAll('text')].find((node) => node.textContent === textValue);
  if (!text) {
    throw new Error(`Missing text node: ${textValue}`);
  }
  return Number(text.getAttribute('y'));
}

function centerY(svg: string): number {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const center = doc.querySelector('circle.svg-center');
  if (!center) {
    throw new Error('Missing center marker');
  }
  return Number(center.getAttribute('cy'));
}

function rotationLine(svg: string): Element {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const line = doc.querySelector('line.svg-rotation');
  if (!line) {
    throw new Error('Missing rotation line');
  }
  return line;
}

function textNode(svg: string, textValue: string): Element {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const text = [...doc.querySelectorAll('text')].find((node) => node.textContent === textValue);
  if (!text) {
    throw new Error(`Missing text node: ${textValue}`);
  }
  return text;
}

describe('PreviewSvg coordinate convention', () => {
  it('draws +Y upward for mathematical Y-up mode', () => {
    const settings = { ...DEFAULT_SETTINGS, count: 4, radius: 10, coordinateSystem: 'mathYUp' as const };
    const svg = buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0);

    expect(yAttributeForText(svg, '+Y output')).toBeLessThan(centerY(svg));
  });

  it('draws +Y downward for screen / ECAD Y-down mode', () => {
    const settings = { ...DEFAULT_SETTINGS, count: 4, radius: 10, coordinateSystem: 'ecadYDown' as const };
    const svg = buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0);

    expect(yAttributeForText(svg, '+Y output')).toBeGreaterThan(centerY(svg));
  });

  it('draws +90 degree rotation upward in mathematical Y-up mode', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      radius: 10,
      coordinateSystem: 'mathYUp' as const,
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' as const, fixedRotationDeg: 90 },
    };
    const line = rotationLine(buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0));

    expect(Number(line.getAttribute('y2'))).toBeLessThan(Number(line.getAttribute('y1')));
  });

  it('draws +90 degree rotation along the flipped radial direction in screen / ECAD Y-down mode', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      radius: 10,
      coordinateSystem: 'ecadYDown' as const,
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'fixed' as const, fixedRotationDeg: 90 },
    };
    const line = rotationLine(buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0));

    expect(Number(line.getAttribute('y2'))).toBeLessThan(Number(line.getAttribute('y1')));
  });

  it('places the +Y axis label away from the top placement label', () => {
    const settings = { ...DEFAULT_SETTINGS, count: 8, radius: 10, coordinateSystem: 'mathYUp' as const };
    const svg = buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0);
    const yAxisLabel = textNode(svg, '+Y output');
    const topPlacementLabel = textNode(svg, 'D3');

    expect(yAxisLabel.getAttribute('text-anchor')).toBe('end');
    expect(Number(yAxisLabel.getAttribute('x'))).toBeLessThan(Number(topPlacementLabel.getAttribute('x')));
  });
});
