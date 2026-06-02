import { useMemo } from 'react';
import type { Placement, PlacementSettings } from '../types';
import { formatNumber, outputFormatOptions } from '../core/format';
import type { UiText } from '../i18n';
import { UI_TEXT } from '../i18n';

interface DistributionGraphProps {
  placements: Placement[];
  settings: PlacementSettings;
  text: UiText['graph'];
}

const GRAPH_WIDTH = 720;
const GRAPH_HEIGHT = 324;
const LEFT = 56;
const RIGHT = 24;
const TOP = 26;
const ANGLE_Y = 62;
const ANGLE_VALUE_Y = 92;
const PROFILE_TITLE_Y = 126;
const PROFILE_LEGEND_Y = 150;
const PROFILE_TOP = 168;
const PROFILE_BOTTOM = 236;
const PROFILE_INDEX_Y = 258;
const STEP_TITLE_Y = 286;
const STEP_TOP = 300;
const STEP_BOTTOM = 318;

function scaleValue(value: number, min: number, max: number, start: number, end: number): number {
  if (Math.abs(max - min) < 1e-12) {
    return (start + end) / 2;
  }
  return start + ((value - min) / (max - min)) * (end - start);
}

function indexX(index: number, count: number): number {
  if (count <= 1) {
    return (LEFT + GRAPH_WIDTH - RIGHT) / 2;
  }
  return scaleValue(index, 0, count - 1, LEFT, GRAPH_WIDTH - RIGHT);
}

function polyline(values: number[], min: number, max: number): string {
  return values
    .map((value, index) => {
      const x = indexX(index, values.length);
      const y = scaleValue(value, min, max, PROFILE_BOTTOM, PROFILE_TOP);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function emptySvg(text: UiText['graph']): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}" role="img" aria-label="${escapeXml(text.aria)}">
  <rect class="graph-bg" width="${GRAPH_WIDTH}" height="${GRAPH_HEIGHT}"/>
  <text class="graph-muted" x="${GRAPH_WIDTH / 2}" y="${GRAPH_HEIGHT / 2}" text-anchor="middle">${escapeXml(text.empty)}</text>
</svg>`;
}

export function buildDistributionGraphSvg(
  placements: Placement[],
  settings: PlacementSettings,
  text: UiText['graph'] = UI_TEXT.en.graph,
): string {
  if (placements.length === 0) {
    return emptySvg(text);
  }

  const precision = outputFormatOptions({
    precisionMode: settings.outputPrecisionMode,
    decimalPlaces: settings.decimalPlaces,
    significantDigits: settings.significantDigits,
  });
  const angles = placements.map((placement) => placement.angleDeg);
  const originXs = placements.map((placement) => placement.x);
  const originYs = placements.map((placement) => placement.y);
  const profileValues = [...originXs, ...originYs];
  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);
  const minProfile = Math.min(...profileValues);
  const maxProfile = Math.max(...profileValues);
  const angleDots = placements
    .map((placement) => {
      const x = scaleValue(placement.angleDeg, minAngle, maxAngle, LEFT, GRAPH_WIDTH - RIGHT);
      const title = `${placement.ref}: ${formatNumber(placement.angleDeg, precision)} deg`;
      return `<circle class="graph-angle-dot" cx="${x.toFixed(2)}" cy="${ANGLE_Y}" r="4"><title>${escapeXml(title)}</title></circle>`;
    })
    .join('');
  const angleConnectors = placements
    .slice(1)
    .map((placement, index) => {
      const previous = placements[index];
      const x1 = scaleValue(previous.angleDeg, minAngle, maxAngle, LEFT, GRAPH_WIDTH - RIGHT);
      const x2 = scaleValue(placement.angleDeg, minAngle, maxAngle, LEFT, GRAPH_WIDTH - RIGHT);
      return `<line class="graph-angle-gap" x1="${x1.toFixed(2)}" y1="${ANGLE_Y}" x2="${x2.toFixed(2)}" y2="${ANGLE_Y}"/>`;
    })
    .join('');
  const steps = placements.slice(1).map((placement, index) => Math.abs(placement.angleDeg - placements[index].angleDeg));
  const maxStep = Math.max(...steps, 1);
  const stepBars = steps
    .map((step, index) => {
      const slotWidth = (GRAPH_WIDTH - LEFT - RIGHT) / Math.max(steps.length, 1);
      const barWidth = Math.max(4, slotWidth * 0.68);
      const x = LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
      const height = scaleValue(step, 0, maxStep, 0, STEP_BOTTOM - STEP_TOP);
      const y = STEP_BOTTOM - height;
      return `<rect class="graph-step-bar" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}"><title>${escapeXml(text.stepTitle(index, index + 1, formatNumber(step, precision)))}</title></rect>`;
    })
    .join('');

  const xLine = polyline(originXs, minProfile, maxProfile);
  const yLine = polyline(originYs, minProfile, maxProfile);
  const last = placements[placements.length - 1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}" role="img" aria-label="${escapeXml(text.aria)}">
  <style>
    .graph-bg{fill:#f8fafc}.graph-axis{stroke:#cbd5e1;stroke-width:1}.graph-grid{stroke:#e2e8f0;stroke-width:1}.graph-label{font:12px system-ui,sans-serif;fill:#344256}.graph-muted{font:13px system-ui,sans-serif;fill:#657386}.graph-angle-gap{stroke:#94a3b8;stroke-width:2;stroke-linecap:round}.graph-angle-dot{fill:#f97316;stroke:#7c2d12;stroke-width:1.2}.graph-x{fill:none;stroke:#0f766e;stroke-width:2.4}.graph-y{fill:none;stroke:#7c3aed;stroke-width:2.4}.graph-step-bar{fill:#14b8a6;opacity:.72}.graph-legend-chip{fill:#ffffff;stroke:#cbd5e1;stroke-width:1}.graph-legend-swatch{stroke-linecap:round;stroke-width:2.4}
  </style>
  <rect class="graph-bg" width="${GRAPH_WIDTH}" height="${GRAPH_HEIGHT}"/>
  <text class="graph-label" data-graph-label="angle-title" x="${LEFT}" y="${TOP}">${escapeXml(text.angleTitle)}</text>
  <line class="graph-axis" x1="${LEFT}" y1="${ANGLE_Y}" x2="${GRAPH_WIDTH - RIGHT}" y2="${ANGLE_Y}"/>
  ${angleConnectors}
  ${angleDots}
  <text class="graph-muted" data-graph-label="angle-min" x="${LEFT}" y="${ANGLE_VALUE_Y}">${formatNumber(minAngle, precision)} deg</text>
  <text class="graph-muted" data-graph-label="angle-max" x="${GRAPH_WIDTH - RIGHT}" y="${ANGLE_VALUE_Y}" text-anchor="end">${formatNumber(maxAngle, precision)} deg</text>
  <text class="graph-label" data-graph-label="profile-title" x="${LEFT}" y="${PROFILE_TITLE_Y}">${escapeXml(text.profileTitle)}</text>
  <g class="graph-legend" data-graph-section="xy-legend">
    <rect class="graph-legend-chip" x="${LEFT}" y="${PROFILE_LEGEND_Y - 14}" width="54" height="20" rx="4"/>
    <line class="graph-x graph-legend-swatch" x1="${LEFT + 9}" y1="${PROFILE_LEGEND_Y - 6}" x2="${LEFT + 25}" y2="${PROFILE_LEGEND_Y - 6}"/>
    <text class="graph-label" data-graph-label="legend-x" x="${LEFT + 34}" y="${PROFILE_LEGEND_Y - 2}">X</text>
    <rect class="graph-legend-chip" x="${LEFT + 62}" y="${PROFILE_LEGEND_Y - 14}" width="54" height="20" rx="4"/>
    <line class="graph-y graph-legend-swatch" x1="${LEFT + 71}" y1="${PROFILE_LEGEND_Y - 6}" x2="${LEFT + 87}" y2="${PROFILE_LEGEND_Y - 6}"/>
    <text class="graph-label" data-graph-label="legend-y" x="${LEFT + 96}" y="${PROFILE_LEGEND_Y - 2}">Y</text>
  </g>
  <line class="graph-grid" x1="${LEFT}" y1="${PROFILE_TOP}" x2="${GRAPH_WIDTH - RIGHT}" y2="${PROFILE_TOP}"/>
  <line class="graph-grid" x1="${LEFT}" y1="${(PROFILE_TOP + PROFILE_BOTTOM) / 2}" x2="${GRAPH_WIDTH - RIGHT}" y2="${(PROFILE_TOP + PROFILE_BOTTOM) / 2}"/>
  <line class="graph-grid" x1="${LEFT}" y1="${PROFILE_BOTTOM}" x2="${GRAPH_WIDTH - RIGHT}" y2="${PROFILE_BOTTOM}"/>
  <polyline class="graph-x" data-series="origin-x" points="${xLine}"/>
  <polyline class="graph-y" data-series="origin-y" points="${yLine}"/>
  <text class="graph-muted" data-graph-label="profile-index-start" x="${LEFT}" y="${PROFILE_INDEX_Y}">0</text>
  <text class="graph-muted" data-graph-label="profile-index-end" x="${GRAPH_WIDTH - RIGHT}" y="${PROFILE_INDEX_Y}" text-anchor="end">${last.index}</text>
  <text class="graph-label" data-graph-label="step-title" x="${LEFT}" y="${STEP_TITLE_Y}">${escapeXml(text.adjacentStep)}</text>
  ${stepBars}
</svg>`;
}

export function DistributionGraph({ placements, settings, text }: DistributionGraphProps) {
  const svgMarkup = useMemo(() => buildDistributionGraphSvg(placements, settings, text), [placements, settings, text]);

  return (
    <section className="panel graph-panel" aria-labelledby="graph-heading">
      <div className="section-heading">
        <div>
          <h2 id="graph-heading">{text.heading}</h2>
          <p>{text.subtitle(placements.length, settings.angleMode === 'arc' ? text.arcSpan : text.angleSpan)}</p>
        </div>
      </div>
      <div className="graph-frame" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
    </section>
  );
}
