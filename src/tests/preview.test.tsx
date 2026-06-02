import { describe, expect, it } from 'vitest';
import { buildPreviewSvg } from '../components/PreviewSvg';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculatePlacements } from '../core/placement';

interface TextBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TEST_FONT_SIZE = 12;
const TEST_TEXT_PADDING = 3;
const TEST_WIDTH_FACTOR = 0.62;

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

function visibleTextBoxes(svg: string): TextBox[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

  return [...doc.querySelectorAll('text')].map((node) => {
    const text = node.textContent ?? '';
    const x = Number(node.getAttribute('x'));
    const y = Number(node.getAttribute('y'));
    const anchor = node.getAttribute('text-anchor') ?? 'start';
    const textWidth = Math.max(TEST_FONT_SIZE * 0.75, text.length * TEST_FONT_SIZE * TEST_WIDTH_FACTOR);
    const textHeight = TEST_FONT_SIZE * 1.25;
    const left = anchor === 'end' ? x - textWidth : anchor === 'middle' ? x - textWidth / 2 : x;

    return {
      text,
      x: left - TEST_TEXT_PADDING,
      y: y - TEST_FONT_SIZE - TEST_TEXT_PADDING,
      width: textWidth + TEST_TEXT_PADDING * 2,
      height: textHeight + TEST_TEXT_PADDING * 2,
    };
  });
}

function boxesOverlap(first: TextBox, second: TextBox): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function expectVisibleTextBoxesNotToOverlap(svg: string): TextBox[] {
  const boxes = visibleTextBoxes(svg);

  boxes.forEach((box, boxIndex) => {
    boxes.slice(boxIndex + 1).forEach((other) => {
      expect(boxesOverlap(box, other), `${box.text} overlaps ${other.text}`).toBe(false);
    });
  });

  return boxes;
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
    const boxes = expectVisibleTextBoxesNotToOverlap(svg);
    const yAxisBox = boxes.find((box) => box.text === '+Y output');
    const componentBoxes = boxes.filter((box) => /^D\d+$/.test(box.text));

    expect(yAxisLabel).not.toBeNull();
    expect(componentBoxes).toHaveLength(8);
    expect(yAxisBox).toBeDefined();
    expect(componentBoxes.every((box) => !boxesOverlap(box, yAxisBox!))).toBe(true);
  });

  it('omits dense component labels instead of overlapping visible preview text', () => {
    const settings = { ...DEFAULT_SETTINGS, count: 96, radius: 10, coordinateSystem: 'mathYUp' as const };
    const svg = buildPreviewSvg(calculatePlacements(settings), settings, true, true, 0);
    const boxes = expectVisibleTextBoxesNotToOverlap(svg);
    const componentBoxes = boxes.filter((box) => /^D\d+$/.test(box.text));

    expect(componentBoxes.length).toBeGreaterThan(0);
    expect(componentBoxes.length).toBeLessThan(settings.count);
  });
});
