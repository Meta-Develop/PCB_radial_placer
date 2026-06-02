import type { PlacementSettings } from '../types';
import type { UiText } from '../i18n';

interface HelpPanelProps {
  settings: PlacementSettings;
  text: UiText['help'];
}

export function HelpPanel({ settings, text }: HelpPanelProps) {
  const coordinateText =
    settings.coordinateSystem === 'mathYUp'
      ? text.yUp
      : text.yDown;

  return (
    <section className="panel help-panel" aria-labelledby="help-heading">
      <details open>
        <summary id="help-heading">{text.summary}</summary>
        <div className="help-content">
          <p>
            {text.conventions}
          </p>
          <p>{coordinateText}</p>
          <p>
            {text.arc}
          </p>
          <p>
            {text.individualAngles}
          </p>
          <p>
            {text.expressions}
          </p>
          <p>
            {text.offset}
          </p>
          <p>
            {text.boundary}
          </p>
          <p>{text.formula}</p>
        </div>
      </details>
    </section>
  );
}
