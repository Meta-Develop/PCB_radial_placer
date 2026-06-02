import type { ChangeEvent } from 'react';
import { parseNumericExpression } from '../core/expression';
import { getNumericFieldValue, setNumericFieldValue } from '../core/numericFields';
import type { Language, UiText } from '../i18n';
import { translateExpressionError } from '../i18n';
import type {
  AngleMode,
  CoordinateSystem,
  Direction,
  NumericExpressionField,
  OutputPrecisionMode,
  PlacementSettings,
  RotationMode,
  RotationNormalizeMode,
  Unit,
} from '../types';

interface InputPanelProps {
  settings: PlacementSettings;
  onChange: (settings: PlacementSettings) => void;
  language: Language;
  text: UiText['input'];
}

interface NumericInputProps {
  field: NumericExpressionField;
  label: string;
  settings: PlacementSettings;
  onChange: (settings: PlacementSettings) => void;
  language: Language;
  disabled?: boolean;
  help?: string;
}

function formatInputNumber(value: number): string {
  return Number.isFinite(value) ? String(value) : '';
}

function formatResolvedNumber(value: number): string {
  if (Object.is(value, -0)) {
    return '0';
  }
  if (Math.abs(value) >= 1e6 || (Math.abs(value) > 0 && Math.abs(value) < 1e-5)) {
    return Number(value.toPrecision(12)).toString();
  }
  return Number(value.toFixed(12)).toString();
}

function shouldKeepRawExpression(rawValue: string, parsedValue: number, isExpression: boolean): boolean {
  return isExpression || rawValue.trim() !== String(parsedValue);
}

function NumericExpressionInput({
  field,
  label,
  settings,
  onChange,
  language,
  disabled = false,
  help,
}: NumericInputProps) {
  const rawValue = settings.inputExpressions[field] ?? formatInputNumber(getNumericFieldValue(settings, field));
  const parsed = parseNumericExpression(rawValue);
  const showResult = parsed.ok && parsed.isExpression;
  const invalid = !parsed.ok;
  const metadata = [
    help ? <span className="field-help" key="help">{help}</span> : null,
    showResult ? (
      <span className="field-evaluation" key="evaluation">
        = {formatResolvedNumber(parsed.value)}
      </span>
    ) : null,
    invalid ? (
      <span className="field-error" key="error">
        {translateExpressionError(parsed.error, language)}
      </span>
    ) : null,
  ].filter(Boolean);

  const updateRawValue = (value: string) => {
    const nextExpressions = { ...settings.inputExpressions };
    const nextParsed = parseNumericExpression(value);
    let nextSettings = settings;

    if (nextParsed.ok) {
      nextSettings = setNumericFieldValue(nextSettings, field, nextParsed.value);
      if (shouldKeepRawExpression(value, nextParsed.value, nextParsed.isExpression)) {
        nextExpressions[field] = value;
      } else {
        delete nextExpressions[field];
      }
    } else {
      nextExpressions[field] = value;
    }

    onChange({ ...nextSettings, inputExpressions: nextExpressions });
  };

  return (
    <label className="input-field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        spellCheck={false}
        disabled={disabled}
        value={rawValue}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(event) => updateRawValue(event.target.value)}
      />
      <span className="field-meta" aria-live="polite">
        {metadata}
      </span>
    </label>
  );
}

export function InputPanel({ settings, onChange, language, text }: InputPanelProps) {
  const update = <K extends keyof PlacementSettings>(key: K, value: PlacementSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const updateReference = <K extends keyof PlacementSettings['reference']>(
    key: K,
    value: PlacementSettings['reference'][K],
  ) => {
    onChange({ ...settings, reference: { ...settings.reference, [key]: value } });
  };

  const updateRotation = <K extends keyof PlacementSettings['rotation']>(
    key: K,
    value: PlacementSettings['rotation'][K],
  ) => {
    onChange({ ...settings, rotation: { ...settings.rotation, [key]: value } });
  };

  const numericInput = (field: NumericExpressionField, label: string, disabled = false, help?: string) => (
    <NumericExpressionInput
      field={field}
      label={label}
      settings={settings}
      onChange={onChange}
      language={language}
      disabled={disabled}
      help={help}
    />
  );

  return (
    <section className="panel input-panel" aria-labelledby="input-heading">
      <div className="section-heading">
        <h2 id="input-heading">{text.heading}</h2>
      </div>

      <fieldset>
        <legend>{text.geometry}</legend>
        {numericInput('count', text.count)}
        {numericInput('radius', text.radius)}
        {numericInput('centerX', text.centerX)}
        {numericInput('centerY', text.centerY)}
        {numericInput('startAngleDeg', text.startAngle)}
        {numericInput('startAngleOffsetDeg', text.startAngleOffset, false, text.startAngleOffsetHelp)}
        <label>
          {text.direction}
          <select
            value={settings.direction}
            onChange={(event) => update('direction', event.target.value as Direction)}
          >
            <option value="counterclockwise">{text.directionOptions.counterclockwise}</option>
            <option value="clockwise">{text.directionOptions.clockwise}</option>
          </select>
        </label>
        <label>
          {text.coordinateSystem}
          <select
            value={settings.coordinateSystem}
            onChange={(event) => update('coordinateSystem', event.target.value as CoordinateSystem)}
          >
            <option value="mathYUp">{text.coordinateOptions.mathYUp}</option>
            <option value="ecadYDown">{text.coordinateOptions.ecadYDown}</option>
          </select>
        </label>
        <label>
          {text.unit}
          <select value={settings.unit} onChange={(event) => update('unit', event.target.value as Unit)}>
            <option value="mm">{text.unitOptions.mm}</option>
            <option value="inch">{text.unitOptions.inch}</option>
            <option value="mil">{text.unitOptions.mil}</option>
            <option value="unitless">{text.unitOptions.unitless}</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="angle-mode-fieldset">
        <legend>{text.angleMode}</legend>
        <label className="field-wide">
          {text.mode}
          <select
            value={settings.angleMode}
            onChange={(event) => update('angleMode', event.target.value as AngleMode)}
          >
            <option value="fullCircle">{text.angleModeOptions.fullCircle}</option>
            <option value="customStep">{text.angleModeOptions.customStep}</option>
            <option value="arc">{text.angleModeOptions.arc}</option>
          </select>
        </label>
        {numericInput('stepAngleDeg', text.stepAngle, settings.angleMode !== 'customStep')}
        {numericInput('endAngleDeg', text.arcEndAngle, settings.angleMode !== 'arc', text.arcEndHelp)}
        <label className="inline-control">
          <input
            type="checkbox"
            disabled={settings.angleMode !== 'arc'}
            checked={settings.includeEndpoint}
            onChange={(event) => update('includeEndpoint', event.target.checked)}
          />
          {text.includeArcEndpoint}
        </label>
      </fieldset>

      <fieldset>
        <legend>{text.referenceDesignators}</legend>
        <label>
          {text.prefix}
          <input
            type="text"
            value={settings.reference.prefix}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateReference('prefix', event.target.value)}
          />
        </label>
        {numericInput('reference.startNumber', text.startNumber)}
        {numericInput('reference.padding', text.padding)}
      </fieldset>

      <fieldset>
        <legend>{text.rotation}</legend>
        <label>
          {text.mode}
          <select
            value={settings.rotation.mode}
            onChange={(event) => updateRotation('mode', event.target.value as RotationMode)}
          >
            <option value="fixed">{text.rotationOptions.fixed}</option>
            <option value="radialOutward">{text.rotationOptions.radialOutward}</option>
            <option value="radialInward">{text.rotationOptions.radialInward}</option>
            <option value="tangentClockwise">{text.rotationOptions.tangentClockwise}</option>
            <option value="tangentCounterclockwise">{text.rotationOptions.tangentCounterclockwise}</option>
            <option value="customFormulaSimple">{text.rotationOptions.customFormulaSimple}</option>
          </select>
        </label>
        {numericInput('rotation.fixedRotationDeg', text.fixedRotation, settings.rotation.mode !== 'fixed')}
        {numericInput(
          'rotation.rotationOffsetDeg',
          text.offset,
          settings.rotation.mode === 'fixed' || settings.rotation.mode === 'customFormulaSimple',
        )}
        {numericInput('rotation.formulaA', text.formulaA, settings.rotation.mode !== 'customFormulaSimple')}
        {numericInput('rotation.formulaB', text.formulaB, settings.rotation.mode !== 'customFormulaSimple')}
        <label>
          {text.normalize}
          <select
            value={settings.rotation.normalize}
            onChange={(event) => updateRotation('normalize', event.target.value as RotationNormalizeMode)}
          >
            <option value="zeroTo360">{text.normalizeOptions.zeroTo360}</option>
            <option value="minus180To180">{text.normalizeOptions.minus180To180}</option>
            <option value="none">{text.normalizeOptions.none}</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>{text.componentOriginOffset}</legend>
        {numericInput('componentOffset.x', text.localOffsetX)}
        {numericInput('componentOffset.y', text.localOffsetY)}
      </fieldset>

      <fieldset>
        <legend>{text.output}</legend>
        <label>
          {text.precisionMode}
          <select
            value={settings.outputPrecisionMode}
            onChange={(event) => update('outputPrecisionMode', event.target.value as OutputPrecisionMode)}
          >
            <option value="decimalPlaces">{text.precisionModeOptions.decimalPlaces}</option>
            <option value="significantDigits">{text.precisionModeOptions.significantDigits}</option>
          </select>
        </label>
        {numericInput('decimalPlaces', text.decimalPlaces, settings.outputPrecisionMode !== 'decimalPlaces')}
        {numericInput(
          'significantDigits',
          text.significantDigits,
          settings.outputPrecisionMode !== 'significantDigits',
        )}
        <label className="inline-control">
          <input
            type="checkbox"
            checked={settings.export.includeHeaders}
            onChange={(event) =>
              onChange({ ...settings, export: { ...settings.export, includeHeaders: event.target.checked } })
            }
          />
          {text.includeExportHeaders}
        </label>
      </fieldset>
    </section>
  );
}
