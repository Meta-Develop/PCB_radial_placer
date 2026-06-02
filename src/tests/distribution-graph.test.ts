import { describe, expect, it } from 'vitest';
import { buildDistributionGraphSvg } from '../components/DistributionGraph';
import { DEFAULT_SETTINGS } from '../core/defaults';
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

    expect(doc.querySelector('[aria-label="Distribution insight graph"]')).not.toBeNull();
    expect(doc.querySelector('[data-series="origin-x"]')).not.toBeNull();
    expect(doc.querySelector('[data-series="origin-y"]')).not.toBeNull();
    expect(doc.querySelectorAll('.graph-angle-dot')).toHaveLength(5);
  });
});
