import { describe, expect, it } from 'vitest';
import { buildDistributionGraphSvg } from '../components/DistributionGraph';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculateDerivedGeometry } from '../core/geometry';
import { calculatePlacements } from '../core/placement';
import { UI_TEXT } from '../i18n';

function yForGraphLabel(doc: Document, label: string): number {
  const node = doc.querySelector(`[data-graph-label="${label}"]`);
  if (!node) {
    throw new Error(`Missing graph label: ${label}`);
  }
  return Number(node.getAttribute('y'));
}

describe('DistributionGraph', () => {
  it('renders compact angle and coordinate profile SVG series', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 5,
      radius: 10,
      angleMode: 'arc' as const,
      startAngleDeg: 0,
      endAngleDeg: 120,
      includeEndpoint: true,
    };
    const svg = buildDistributionGraphSvg(calculatePlacements(settings), settings);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(doc.querySelector('[aria-label="Spacing check graph"]')).not.toBeNull();
    expect(doc.querySelector('[data-series="origin-x"]')).not.toBeNull();
    expect(doc.querySelector('[data-series="origin-y"]')).not.toBeNull();
    expect(doc.querySelectorAll('.graph-angle-dot')).toHaveLength(5);
  });

  it('escapes placement refs before injecting graph SVG markup', () => {
    const maliciousPrefix = '</title><image onerror="alert(1)"><script>alert(2)</script>';
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 1,
      reference: {
        ...DEFAULT_SETTINGS.reference,
        prefix: maliciousPrefix,
      },
    };
    const svg = buildDistributionGraphSvg(calculatePlacements(settings), settings);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('<script');
    expect(doc.querySelector('image')).toBeNull();
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('title')?.textContent).toContain(maliciousPrefix);
  });

  it('keeps derived spacing finite for individual angle mode', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 4,
      radius: 10,
      angleMode: 'individualAngles' as const,
      individualAnglesText: '0, 60, 120, 210',
    };
    const geometry = calculateDerivedGeometry(settings);

    expect(Number.isFinite(geometry.signedStepAngleDeg)).toBe(true);
    expect(Number.isFinite(geometry.angularPitchDeg)).toBe(true);
    expect(Number.isFinite(geometry.chordLength)).toBe(true);
    expect(geometry.signedStepAngleDeg).toBe(70);
  });

  it('separates graph section labels and keeps the X/Y legend out of the profile title band', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      count: 12,
      radius: 10,
      angleMode: 'arc' as const,
      startAngleDeg: -45,
      endAngleDeg: 225,
      includeEndpoint: true,
    };
    const svg = buildDistributionGraphSvg(calculatePlacements(settings), settings, UI_TEXT.ja.graph);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const angleTitleY = yForGraphLabel(doc, 'angle-title');
    const angleMinY = yForGraphLabel(doc, 'angle-min');
    const profileTitleY = yForGraphLabel(doc, 'profile-title');
    const legendXTextY = yForGraphLabel(doc, 'legend-x');
    const legendYTextY = yForGraphLabel(doc, 'legend-y');
    const profileIndexY = yForGraphLabel(doc, 'profile-index-start');
    const stepTitleY = yForGraphLabel(doc, 'step-title');
    const firstStepBar = doc.querySelector('.graph-step-bar');

    if (!firstStepBar) {
      throw new Error('Missing adjacent-step bar');
    }

    expect(angleMinY - angleTitleY).toBeGreaterThanOrEqual(60);
    expect(profileTitleY - angleMinY).toBeGreaterThanOrEqual(28);
    expect(legendXTextY - profileTitleY).toBeGreaterThanOrEqual(18);
    expect(legendYTextY).toBe(legendXTextY);
    expect(profileIndexY - legendXTextY).toBeGreaterThanOrEqual(100);
    expect(stepTitleY - profileIndexY).toBeGreaterThanOrEqual(24);
    expect(Number(firstStepBar.getAttribute('y')) - stepTitleY).toBeGreaterThanOrEqual(6);
    expect(doc.querySelector('[data-graph-section="xy-legend"]')).not.toBeNull();
  });
});
