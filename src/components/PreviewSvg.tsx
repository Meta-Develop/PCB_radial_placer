import { useMemo, useState } from 'react';
import type { Placement, PlacementSettings } from '../types';
import { downloadTextFile } from '../core/download';
import { parseNumericExpression } from '../core/expression';
import { rotateLocalOffset } from '../core/geometry';
import type { Language, UiText } from '../i18n';
import { translateExpressionError } from '../i18n';

interface PreviewSvgProps {
  placements: Placement[];
  settings: PlacementSettings;
  showLabels: boolean;
  showAxes: boolean;
  boardOutlineRadius: number;
  onShowLabelsChange: (value: boolean) => void;
  onShowAxesChange: (value: boolean) => void;
  onBoardOutlineRadiusChange: (value: number) => void;
  language: Language;
  text: UiText['preview'];
}

const SVG_SIZE = 520;
const SVG_PADDING = 44;
const LABEL_FONT_SIZE = 12;
const LABEL_BOX_PADDING = 3;
const LABEL_BOUNDS_MARGIN = 4;
const LABEL_WIDTH_FACTOR = 0.62;

type TextAnchor = 'start' | 'middle' | 'end';

interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextCandidate {
  x: number;
  y: number;
  anchor: TextAnchor;
}

interface PlacedText extends TextCandidate {
  text: string;
  box: TextBox;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function coordinateExtents(placements: Placement[], settings: PlacementSettings, boardOutlineRadius: number) {
  const radii = [settings.radius, boardOutlineRadius].filter((value) => Number.isFinite(value) && value > 0);
  const baseRadius = Math.max(1, ...radii);
  const xs = [
    settings.centerX - baseRadius,
    settings.centerX + baseRadius,
    ...placements.flatMap((item) => [item.x, item.targetCenterX]),
  ];
  const ys = [
    settings.centerY - baseRadius,
    settings.centerY + baseRadius,
    ...placements.flatMap((item) => [item.y, item.targetCenterY]),
  ];

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function estimateTextBox(text: string, x: number, y: number, anchor: TextAnchor, fontSize = LABEL_FONT_SIZE): TextBox {
  const textWidth = Math.max(fontSize * 0.75, text.length * fontSize * LABEL_WIDTH_FACTOR);
  const textHeight = fontSize * 1.25;
  const textX = anchor === 'end' ? x - textWidth : anchor === 'middle' ? x - textWidth / 2 : x;

  return {
    x: textX - LABEL_BOX_PADDING,
    y: y - fontSize - LABEL_BOX_PADDING,
    width: textWidth + LABEL_BOX_PADDING * 2,
    height: textHeight + LABEL_BOX_PADDING * 2,
  };
}

function boxesOverlap(first: TextBox, second: TextBox): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function boxFitsSvg(box: TextBox): boolean {
  return (
    box.x >= LABEL_BOUNDS_MARGIN &&
    box.y >= LABEL_BOUNDS_MARGIN &&
    box.x + box.width <= SVG_SIZE - LABEL_BOUNDS_MARGIN &&
    box.y + box.height <= SVG_SIZE - LABEL_BOUNDS_MARGIN
  );
}

function anchorForOffset(offsetX: number): TextAnchor {
  if (offsetX < -2) {
    return 'end';
  }
  if (offsetX > 2) {
    return 'start';
  }
  return 'middle';
}

function candidateFromOffset(point: { x: number; y: number }, offsetX: number, offsetY: number): TextCandidate {
  const anchor = anchorForOffset(offsetX);
  const y =
    offsetY > 2
      ? point.y + offsetY + LABEL_FONT_SIZE
      : offsetY < -2
        ? point.y + offsetY
        : point.y + LABEL_FONT_SIZE * 0.35;

  return {
    x: point.x + offsetX,
    y,
    anchor,
  };
}

function uniqueCandidates(candidates: TextCandidate[]): TextCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.x.toFixed(2)}:${candidate.y.toFixed(2)}:${candidate.anchor}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function tryPlaceText(text: string, candidates: TextCandidate[], occupied: TextBox[]): PlacedText | null {
  for (const candidate of candidates) {
    const box = estimateTextBox(text, candidate.x, candidate.y, candidate.anchor);
    if (boxFitsSvg(box) && !occupied.some((existing) => boxesOverlap(box, existing))) {
      occupied.push(box);
      return {
        ...candidate,
        text,
        box,
      };
    }
  }

  return null;
}

function componentLabelCandidates(point: { x: number; y: number }, center: { x: number; y: number }): TextCandidate[] {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const distance = Math.hypot(dx, dy);
  const outward = distance > 1e-6 ? { x: dx / distance, y: dy / distance } : { x: 1, y: -1 };
  const radialGap = 16;
  const radial = candidateFromOffset(point, outward.x * radialGap, outward.y * radialGap);
  const fallbacks = [
    candidateFromOffset(point, 18, -10),
    candidateFromOffset(point, -18, -10),
    candidateFromOffset(point, 18, 8),
    candidateFromOffset(point, -18, 8),
    candidateFromOffset(point, 0, -18),
    candidateFromOffset(point, 0, 18),
    candidateFromOffset(point, 28, 0),
    candidateFromOffset(point, -28, 0),
    candidateFromOffset(point, 24, -24),
    candidateFromOffset(point, -24, -24),
    candidateFromOffset(point, 24, 24),
    candidateFromOffset(point, -24, 24),
    candidateFromOffset(point, 0, -34),
    candidateFromOffset(point, 0, 34),
  ];

  return uniqueCandidates([radial, ...fallbacks]);
}

function xAxisLabelCandidates(point: { x: number; y: number }): TextCandidate[] {
  return [
    candidateFromOffset(point, -10, -10),
    candidateFromOffset(point, -10, 10),
    candidateFromOffset(point, 10, -10),
    candidateFromOffset(point, 10, 10),
    candidateFromOffset(point, -34, -10),
    candidateFromOffset(point, 0, -24),
    candidateFromOffset(point, 0, 24),
  ];
}

function yAxisLabelCandidates(point: { x: number; y: number }, yDown: boolean): TextCandidate[] {
  const preferred = yDown
    ? [candidateFromOffset(point, -10, 14), candidateFromOffset(point, 10, 14)]
    : [candidateFromOffset(point, -10, -10), candidateFromOffset(point, 10, -10)];
  const fallback = yDown
    ? [
        candidateFromOffset(point, -10, -10),
        candidateFromOffset(point, 10, -10),
        candidateFromOffset(point, 0, -24),
        candidateFromOffset(point, 0, 24),
      ]
    : [
        candidateFromOffset(point, -10, 14),
        candidateFromOffset(point, 10, 14),
        candidateFromOffset(point, 0, 24),
        candidateFromOffset(point, 0, -24),
      ];

  return uniqueCandidates([...preferred, ...fallback]);
}

function renderText(className: string, placed: PlacedText): string {
  const anchorAttribute = placed.anchor === 'start' ? '' : ` text-anchor="${placed.anchor}"`;
  return `<text class="${className}" x="${placed.x.toFixed(2)}" y="${placed.y.toFixed(2)}"${anchorAttribute}>${escapeXml(placed.text)}</text>`;
}

export function buildPreviewSvg(
  placements: Placement[],
  settings: PlacementSettings,
  showLabels: boolean,
  showAxes: boolean,
  boardOutlineRadius: number,
): string {
  const { minX, maxX, minY, maxY } = coordinateExtents(placements, settings, boardOutlineRadius);
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const scale = (SVG_SIZE - SVG_PADDING * 2) / Math.max(width, height);
  const offsetX = SVG_PADDING + (SVG_SIZE - SVG_PADDING * 2 - width * scale) / 2;
  const offsetY = SVG_PADDING + (SVG_SIZE - SVG_PADDING * 2 - height * scale) / 2;
  const yDown = settings.coordinateSystem === 'ecadYDown';

  const project = (x: number, y: number) => ({
    x: offsetX + (x - minX) * scale,
    y: yDown ? offsetY + (y - minY) * scale : offsetY + (maxY - y) * scale,
  });

  const center = project(settings.centerX, settings.centerY);
  const radiusPx = settings.radius * scale;
  const boardRadiusPx = boardOutlineRadius * scale;
  const axisStartX = project(minX, 0);
  const axisEndX = project(maxX, 0);
  const axisStartY = project(0, minY);
  const axisEndY = project(0, maxY);
  const occupiedLabelBoxes: TextBox[] = [];
  const xAxisLabel = showAxes ? tryPlaceText('+X', xAxisLabelCandidates(axisEndX), occupiedLabelBoxes) : null;
  const yAxisLabel = showAxes ? tryPlaceText('+Y output', yAxisLabelCandidates(axisEndY, yDown), occupiedLabelBoxes) : null;
  const axisLabelMarkup = [xAxisLabel, yAxisLabel]
    .filter((label): label is PlacedText => label !== null)
    .map((label) => renderText('svg-axis-label', label))
    .join('');

  const pointMarkup = placements
    .map((placement) => {
      const origin = project(placement.x, placement.y);
      const targetCenter = project(placement.targetCenterX, placement.targetCenterY);
      const rotationVector = rotateLocalOffset(18, 0, placement.rotationDeg, settings.coordinateSystem);
      const rotationEnd = {
        x: origin.x + rotationVector.x,
        y: origin.y + (yDown ? rotationVector.y : -rotationVector.y),
      };
      const placedLabel = showLabels
        ? tryPlaceText(placement.ref, componentLabelCandidates(targetCenter, center), occupiedLabelBoxes)
        : null;
      const label = placedLabel ? renderText('svg-label', placedLabel) : '';
      const offsetMarkup =
        Math.hypot(placement.appliedOffsetX, placement.appliedOffsetY) > 1e-9
          ? `<line class="svg-offset" x1="${origin.x}" y1="${origin.y}" x2="${targetCenter.x}" y2="${targetCenter.y}"/><rect class="svg-origin" x="${origin.x - 4}" y="${origin.y - 4}" width="8" height="8" rx="1"/>`
          : '';
      return `<g>${offsetMarkup}<circle class="svg-point" cx="${targetCenter.x}" cy="${targetCenter.y}" r="5"/><line class="svg-rotation" x1="${origin.x}" y1="${origin.y}" x2="${rotationEnd.x}" y2="${rotationEnd.y}"/>${label}</g>`;
    })
    .join('');

  const axisMarkup = showAxes
    ? `<line class="svg-axis" x1="${axisStartX.x}" y1="${axisStartX.y}" x2="${axisEndX.x}" y2="${axisEndX.y}"/><line class="svg-axis" x1="${axisStartY.x}" y1="${axisStartY.y}" x2="${axisEndY.x}" y2="${axisEndY.y}"/>${axisLabelMarkup}`
    : '';

  const boardMarkup =
    Number.isFinite(boardOutlineRadius) && boardOutlineRadius > 0
      ? `<circle class="svg-board" cx="${center.x}" cy="${center.y}" r="${boardRadiusPx}"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" role="img" aria-label="PCB radial placement preview">
  <style>
    .svg-bg{fill:#f8fafc}.svg-board{fill:none;stroke:#64748b;stroke-width:1.5;stroke-dasharray:8 7}.svg-radius{fill:none;stroke:#0f766e;stroke-width:2}.svg-axis{stroke:#94a3b8;stroke-width:1.2}.svg-axis-label,.svg-label{font:12px system-ui,sans-serif;fill:#0f172a}.svg-point{fill:#f97316;stroke:#7c2d12;stroke-width:1.5}.svg-origin{fill:#14b8a6;stroke:#115e59;stroke-width:1}.svg-center{fill:#0f766e}.svg-offset{stroke:#0f766e;stroke-width:1.2;stroke-dasharray:4 4}.svg-rotation{stroke:#7c2d12;stroke-width:1.4;stroke-linecap:round}
  </style>
  <rect class="svg-bg" width="${SVG_SIZE}" height="${SVG_SIZE}" rx="0"/>
  ${axisMarkup}
  ${boardMarkup}
  <circle class="svg-radius" cx="${center.x}" cy="${center.y}" r="${radiusPx}"/>
  <circle class="svg-center" cx="${center.x}" cy="${center.y}" r="4"/>
  ${pointMarkup}
</svg>`;
}

export function PreviewSvg({
  placements,
  settings,
  showLabels,
  showAxes,
  boardOutlineRadius,
  onShowLabelsChange,
  onShowAxesChange,
  onBoardOutlineRadiusChange,
  language,
  text,
}: PreviewSvgProps) {
  const svgMarkup = useMemo(
    () => buildPreviewSvg(placements, settings, showLabels, showAxes, boardOutlineRadius),
    [boardOutlineRadius, placements, settings, showAxes, showLabels],
  );
  const [boardRadiusText, setBoardRadiusText] = useState(String(boardOutlineRadius));
  const parsedBoardRadius = parseNumericExpression(boardRadiusText);
  const boardRadiusError =
    parsedBoardRadius.ok && parsedBoardRadius.value < 0 ? text.boardRadiusError : null;
  const boardRadiusInvalid = !parsedBoardRadius.ok || boardRadiusError !== null;

  const updateBoardRadius = (value: string) => {
    setBoardRadiusText(value);
    const parsed = parseNumericExpression(value);
    if (parsed.ok && parsed.value >= 0) {
      onBoardOutlineRadiusChange(parsed.value);
    }
  };

  return (
    <section className="panel preview-panel" aria-labelledby="preview-heading">
      <div className="section-heading preview-heading">
        <div>
          <h2 id="preview-heading">{text.heading}</h2>
          <p>
            {settings.coordinateSystem === 'mathYUp'
              ? text.yUp
              : text.yDown}
          </p>
        </div>
        <div className="button-row">
          <button
            type="button"
            onClick={() => downloadTextFile('radial-placement-preview.svg', svgMarkup, 'image/svg+xml;charset=utf-8')}
            disabled={placements.length === 0}
          >
            {text.exportSvg}
          </button>
        </div>
      </div>
      <div className="preview-controls">
        <label className="inline-control">
          <input type="checkbox" checked={showLabels} onChange={(event) => onShowLabelsChange(event.target.checked)} />
          {text.labels}
        </label>
        <label className="inline-control">
          <input type="checkbox" checked={showAxes} onChange={(event) => onShowAxesChange(event.target.checked)} />
          {text.axes}
        </label>
        <label className="input-field preview-radius-field">
          <span className="field-label">{text.boardOutlineRadius}</span>
          <input
            type="text"
            inputMode="decimal"
            spellCheck={false}
            value={boardRadiusText}
            aria-invalid={boardRadiusInvalid ? 'true' : undefined}
            onChange={(event) => updateBoardRadius(event.target.value)}
          />
          <span className="field-meta" aria-live="polite">
            {parsedBoardRadius.ok && parsedBoardRadius.isExpression ? (
              <span className="field-evaluation">= {parsedBoardRadius.value}</span>
            ) : null}
            {boardRadiusInvalid ? (
              <span className="field-error">
                {boardRadiusError ??
                  (!parsedBoardRadius.ok ? translateExpressionError(parsedBoardRadius.error, language) : '')}
              </span>
            ) : null}
          </span>
        </label>
      </div>
      <div className="svg-frame" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
    </section>
  );
}
