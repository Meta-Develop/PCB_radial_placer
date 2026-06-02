import { describe, expect, it } from 'vitest';
import { buildDistributionGraphSvg } from '../components/DistributionGraph';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { calculateDerivedGeometry } from '../core/geometry';
import { calculatePlacements } from '../core/placement';

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
});
