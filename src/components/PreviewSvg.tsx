import { useState } from 'react';
import type { Placement, PlacementSettings } from '../types';
import { downloadTextFile } from '../core/download';
import { parseNumericExpression } from '../core/expression';
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
  const yAxisLabelX = axisEndY.x - 10;
  const yAxisLabelY = yDown ? Math.min(SVG_SIZE - 12, axisEndY.y + 22) : Math.max(16, axisEndY.y - 14);

  const pointMarkup = placements
    .map((placement) => {
      const origin = project(placement.x, placement.y);
      const targetCenter = project(placement.targetCenterX, placement.targetCenterY);
      const rotationRad = (placement.rotationDeg * Math.PI) / 180;
      const rotationEnd = {
        x: origin.x + 18 * Math.cos(rotationRad),
        y: origin.y + (yDown ? 18 : -18) * Math.sin(rotationRad),
      };
      const label = showLabels
        ? `<text x="${targetCenter.x + 8}" y="${targetCenter.y - 8}" class="svg-label">${escapeXml(placement.ref)}</text>`
        : '';
      const offsetMarkup =
        Math.hypot(placement.appliedOffsetX, placement.appliedOffsetY) > 1e-9
          ? `<line class="svg-offset" x1="${origin.x}" y1="${origin.y}" x2="${targetCenter.x}" y2="${targetCenter.y}"/><rect class="svg-origin" x="${origin.x - 4}" y="${origin.y - 4}" width="8" height="8" rx="1"/>`
          : '';
      return `<g>${offsetMarkup}<circle class="svg-point" cx="${targetCenter.x}" cy="${targetCenter.y}" r="5"/><line class="svg-rotation" x1="${origin.x}" y1="${origin.y}" x2="${rotationEnd.x}" y2="${rotationEnd.y}"/>${label}</g>`;
    })
    .join('');

  const axisMarkup = showAxes
    ? `<line class="svg-axis" x1="${axisStartX.x}" y1="${axisStartX.y}" x2="${axisEndX.x}" y2="${axisEndX.y}"/><line class="svg-axis" x1="${axisStartY.x}" y1="${axisStartY.y}" x2="${axisEndY.x}" y2="${axisEndY.y}"/><text class="svg-axis-label" x="${axisEndX.x - 18}" y="${axisEndX.y - 8}">+X</text><text class="svg-axis-label" x="${yAxisLabelX}" y="${yAxisLabelY}" text-anchor="end">+Y output</text>`
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
  const svgMarkup = buildPreviewSvg(placements, settings, showLabels, showAxes, boardOutlineRadius);
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
