import type { ChangeEvent, ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../core/defaults';
import { parseNumericExpression } from '../core/expression';
import { parseIndividualAngles } from '../core/individualAngles';
import { getNumericFieldValue, setNumericFieldValue } from '../core/numericFields';
import type { Language, UiText } from '../i18n';
import { translateExpressionError, translateValidationText } from '../i18n';
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
  resetText: string;
  settings: PlacementSettings;
  onChange: (settings: PlacementSettings) => void;
  language: Language;
  help?: string;
}

interface ResettableFieldProps {
  children: ReactNode;
  controlId: string;
  label: string;
  onReset: () => void;
  resetDisabled: boolean;
  resetText: string;
  className?: string;
}

interface ResettableCheckboxFieldProps {
  checked: boolean;
  controlId: string;
  label: string;
  onChange: (checked: boolean) => void;
  onReset: () => void;
  resetDisabled: boolean;
  resetText: string;
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

function createDefaultSettings(): PlacementSettings {
  return {
    ...DEFAULT_SETTINGS,
    reference: { ...DEFAULT_SETTINGS.reference },
    rotation: { ...DEFAULT_SETTINGS.rotation },
    componentOffset: { ...DEFAULT_SETTINGS.componentOffset },
    export: { ...DEFAULT_SETTINGS.export },
    inputExpressions: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function areSettingsValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => areSettingsValuesEqual(value, right[index]));
  }

  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(right, key) && areSettingsValuesEqual(left[key], right[key]),
  );
}

function controlIdForField(field: string): string {
  return `input-${field.replace(/\./g, '-')}`;
}

function isNumericFieldDefault(settings: PlacementSettings, field: NumericExpressionField): boolean {
  return (
    Object.is(getNumericFieldValue(settings, field), getNumericFieldValue(DEFAULT_SETTINGS, field)) &&
    settings.inputExpressions[field] === undefined
  );
}

function ResettableField({
  children,
  controlId,
  label,
  onReset,
  resetDisabled,
  resetText,
  className,
}: ResettableFieldProps) {
  return (
    <div className={['resettable-field input-field', className].filter(Boolean).join(' ')}>
      <div className="field-header">
        <label className="field-label" htmlFor={controlId}>
          {label}
        </label>
        <button
          type="button"
          className="field-reset-button"
          onClick={onReset}
          disabled={resetDisabled}
          aria-label={`${resetText} ${label}`}
        >
          {resetText}
        </button>
      </div>
      {children}
    </div>
  );
}

function ResettableCheckboxField({
  checked,
  controlId,
  label,
  onChange,
  onReset,
  resetDisabled,
  resetText,
}: ResettableCheckboxFieldProps) {
  return (
    <div className="resettable-field inline-resettable-field">
      <label className="inline-control" htmlFor={controlId}>
        <input
          id={controlId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
      <button
        type="button"
        className="field-reset-button"
        onClick={onReset}
        disabled={resetDisabled}
        aria-label={`${resetText} ${label}`}
      >
        {resetText}
      </button>
    </div>
  );
}

function NumericExpressionInput({
  field,
  label,
  resetText,
  settings,
  onChange,
  language,
  help,
}: NumericInputProps) {
  const controlId = controlIdForField(field);
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

  const resetField = () => {
    const nextExpressions = { ...settings.inputExpressions };
    delete nextExpressions[field];
    const nextSettings = setNumericFieldValue(settings, field, getNumericFieldValue(DEFAULT_SETTINGS, field));

    onChange({ ...nextSettings, inputExpressions: nextExpressions });
  };

  return (
    <ResettableField
      controlId={controlId}
      label={label}
      onReset={resetField}
      resetDisabled={isNumericFieldDefault(settings, field)}
      resetText={resetText}
    >
      <input
        id={controlId}
        type="text"
        inputMode="decimal"
        spellCheck={false}
        value={rawValue}
        aria-invalid={invalid ? 'true' : undefined}
        onChange={(event) => updateRawValue(event.target.value)}
      />
      <span className="field-meta" aria-live="polite">
        {metadata}
      </span>
    </ResettableField>
  );
}

export function InputPanel({ settings, onChange, language, text }: InputPanelProps) {
  const isIndividualAngles = settings.angleMode === 'individualAngles';
  const rotationUsesCustomFormula = settings.rotation.mode === 'customFormulaSimple';
  const individualAngles = parseIndividualAngles(settings.individualAnglesText);
  const individualAnglesInvalid = isIndividualAngles && individualAngles.errors.length > 0;

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

  const updateExport = <K extends keyof PlacementSettings['export']>(
    key: K,
    value: PlacementSettings['export'][K],
  ) => {
    onChange({ ...settings, export: { ...settings.export, [key]: value } });
  };

  const resetSetting = <K extends keyof PlacementSettings>(key: K) => {
    onChange({ ...settings, [key]: DEFAULT_SETTINGS[key] });
  };

  const resetReference = <K extends keyof PlacementSettings['reference']>(key: K) => {
    onChange({ ...settings, reference: { ...settings.reference, [key]: DEFAULT_SETTINGS.reference[key] } });
  };

  const resetRotation = <K extends keyof PlacementSettings['rotation']>(key: K) => {
    onChange({ ...settings, rotation: { ...settings.rotation, [key]: DEFAULT_SETTINGS.rotation[key] } });
  };

  const resetExport = <K extends keyof PlacementSettings['export']>(key: K) => {
    onChange({ ...settings, export: { ...settings.export, [key]: DEFAULT_SETTINGS.export[key] } });
  };

  const settingIsDefault = <K extends keyof PlacementSettings>(key: K) =>
    areSettingsValuesEqual(settings[key], DEFAULT_SETTINGS[key]);
  const referenceIsDefault = <K extends keyof PlacementSettings['reference']>(key: K) =>
    areSettingsValuesEqual(settings.reference[key], DEFAULT_SETTINGS.reference[key]);
  const rotationIsDefault = <K extends keyof PlacementSettings['rotation']>(key: K) =>
    areSettingsValuesEqual(settings.rotation[key], DEFAULT_SETTINGS.rotation[key]);
  const exportIsDefault = <K extends keyof PlacementSettings['export']>(key: K) =>
    areSettingsValuesEqual(settings.export[key], DEFAULT_SETTINGS.export[key]);

  const numericInput = (field: NumericExpressionField, label: string, help?: string) => (
    <NumericExpressionInput
      field={field}
      label={label}
      resetText={text.reset}
      settings={settings}
      onChange={onChange}
      language={language}
      help={help}
    />
  );

  return (
    <section className="panel input-panel" aria-labelledby="input-heading">
      <div className="section-heading">
        <h2 id="input-heading">{text.heading}</h2>
        <button
          type="button"
          className="reset-all-button"
          onClick={() => onChange(createDefaultSettings())}
          disabled={areSettingsValuesEqual(settings, DEFAULT_SETTINGS)}
        >
          {text.resetAll}
        </button>
      </div>

      <fieldset>
        <legend>{text.geometry}</legend>
        {numericInput('count', text.count)}
        {numericInput('radius', text.radius)}
        {numericInput('centerX', text.centerX)}
        {numericInput('centerY', text.centerY)}
        {!isIndividualAngles ? (
          <>
            {numericInput('startAngleDeg', text.startAngle)}
            {numericInput('startAngleOffsetDeg', text.startAngleOffset, text.startAngleOffsetHelp)}
            <ResettableField
              controlId="input-direction"
              label={text.direction}
              onReset={() => resetSetting('direction')}
              resetDisabled={settingIsDefault('direction')}
              resetText={text.reset}
            >
              <select
                id="input-direction"
                value={settings.direction}
                onChange={(event) => update('direction', event.target.value as Direction)}
              >
                <option value="counterclockwise">{text.directionOptions.counterclockwise}</option>
                <option value="clockwise">{text.directionOptions.clockwise}</option>
              </select>
            </ResettableField>
          </>
        ) : null}
        <ResettableField
          controlId="input-coordinate-system"
          label={text.coordinateSystem}
          onReset={() => resetSetting('coordinateSystem')}
          resetDisabled={settingIsDefault('coordinateSystem')}
          resetText={text.reset}
        >
          <select
            id="input-coordinate-system"
            value={settings.coordinateSystem}
            onChange={(event) => update('coordinateSystem', event.target.value as CoordinateSystem)}
          >
            <option value="mathYUp">{text.coordinateOptions.mathYUp}</option>
            <option value="ecadYDown">{text.coordinateOptions.ecadYDown}</option>
          </select>
        </ResettableField>
        <ResettableField
          controlId="input-unit"
          label={text.unit}
          onReset={() => resetSetting('unit')}
          resetDisabled={settingIsDefault('unit')}
          resetText={text.reset}
        >
          <select id="input-unit" value={settings.unit} onChange={(event) => update('unit', event.target.value as Unit)}>
            <option value="mm">{text.unitOptions.mm}</option>
            <option value="inch">{text.unitOptions.inch}</option>
            <option value="mil">{text.unitOptions.mil}</option>
            <option value="unitless">{text.unitOptions.unitless}</option>
          </select>
        </ResettableField>
      </fieldset>

      <fieldset className="angle-mode-fieldset">
        <legend>{text.angleMode}</legend>
        <ResettableField
          className="field-wide"
          controlId="input-angle-mode"
          label={text.mode}
          onReset={() => resetSetting('angleMode')}
          resetDisabled={settingIsDefault('angleMode')}
          resetText={text.reset}
        >
          <select
            id="input-angle-mode"
            value={settings.angleMode}
            onChange={(event) => update('angleMode', event.target.value as AngleMode)}
          >
            <option value="fullCircle">{text.angleModeOptions.fullCircle}</option>
            <option value="customStep">{text.angleModeOptions.customStep}</option>
            <option value="arc">{text.angleModeOptions.arc}</option>
            <option value="individualAngles">{text.angleModeOptions.individualAngles}</option>
          </select>
        </ResettableField>
        {settings.angleMode === 'customStep' ? numericInput('stepAngleDeg', text.stepAngle) : null}
        {settings.angleMode === 'arc' ? (
          <>
            {numericInput('endAngleDeg', text.arcEndAngle, text.arcEndHelp)}
            <ResettableCheckboxField
              checked={settings.includeEndpoint}
              controlId="input-include-endpoint"
              label={text.includeArcEndpoint}
              onChange={(checked) => update('includeEndpoint', checked)}
              onReset={() => resetSetting('includeEndpoint')}
              resetDisabled={settingIsDefault('includeEndpoint')}
              resetText={text.reset}
            />
          </>
        ) : null}
        {isIndividualAngles ? (
          <ResettableField
            className="field-wide individual-angles-field"
            controlId="input-individual-angles"
            label={text.individualAngles}
            onReset={() => resetSetting('individualAnglesText')}
            resetDisabled={settingIsDefault('individualAnglesText')}
            resetText={text.reset}
          >
            <textarea
              id="input-individual-angles"
              rows={3}
              spellCheck={false}
              value={settings.individualAnglesText}
              aria-invalid={individualAnglesInvalid ? 'true' : undefined}
              onChange={(event) => update('individualAnglesText', event.target.value)}
            />
            <span className="field-meta" aria-live="polite">
              <span className="field-help">{text.individualAnglesHelp}</span>
              {individualAnglesInvalid ? (
                <span className="field-error">
                  {translateValidationText(individualAngles.errors[0].message, language)}
                </span>
              ) : null}
            </span>
          </ResettableField>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>{text.referenceDesignators}</legend>
        <ResettableField
          controlId="input-reference-prefix"
          label={text.prefix}
          onReset={() => resetReference('prefix')}
          resetDisabled={referenceIsDefault('prefix')}
          resetText={text.reset}
        >
          <input
            id="input-reference-prefix"
            type="text"
            value={settings.reference.prefix}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateReference('prefix', event.target.value)}
          />
        </ResettableField>
        {numericInput('reference.startNumber', text.startNumber)}
        {numericInput('reference.padding', text.padding)}
      </fieldset>

      <fieldset>
        <legend>{text.rotation}</legend>
        <ResettableField
          controlId="input-rotation-mode"
          label={text.mode}
          onReset={() => resetRotation('mode')}
          resetDisabled={rotationIsDefault('mode')}
          resetText={text.reset}
        >
          <select
            id="input-rotation-mode"
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
        </ResettableField>
        {settings.rotation.mode === 'fixed'
          ? numericInput('rotation.fixedRotationDeg', text.fixedRotation)
          : null}
        {rotationUsesCustomFormula ? (
          <>
            {numericInput('rotation.formulaA', text.formulaA)}
            {numericInput('rotation.formulaB', text.formulaB)}
          </>
        ) : null}
        {numericInput('rotation.rotationOffsetDeg', text.rotationOffset, text.rotationOffsetHelp)}
        <ResettableField
          controlId="input-rotation-normalize"
          label={text.normalize}
          onReset={() => resetRotation('normalize')}
          resetDisabled={rotationIsDefault('normalize')}
          resetText={text.reset}
        >
          <select
            id="input-rotation-normalize"
            value={settings.rotation.normalize}
            onChange={(event) => updateRotation('normalize', event.target.value as RotationNormalizeMode)}
          >
            <option value="zeroTo360">{text.normalizeOptions.zeroTo360}</option>
            <option value="minus180To180">{text.normalizeOptions.minus180To180}</option>
            <option value="none">{text.normalizeOptions.none}</option>
          </select>
        </ResettableField>
      </fieldset>

      <fieldset>
        <legend>{text.componentOriginOffset}</legend>
        {numericInput('componentOffset.x', text.localOffsetX)}
        {numericInput('componentOffset.y', text.localOffsetY)}
      </fieldset>

      <fieldset>
        <legend>{text.output}</legend>
        <ResettableField
          controlId="input-precision-mode"
          label={text.precisionMode}
          onReset={() => resetSetting('outputPrecisionMode')}
          resetDisabled={settingIsDefault('outputPrecisionMode')}
          resetText={text.reset}
        >
          <select
            id="input-precision-mode"
            value={settings.outputPrecisionMode}
            onChange={(event) => update('outputPrecisionMode', event.target.value as OutputPrecisionMode)}
          >
            <option value="decimalPlaces">{text.precisionModeOptions.decimalPlaces}</option>
            <option value="significantDigits">{text.precisionModeOptions.significantDigits}</option>
          </select>
        </ResettableField>
        {settings.outputPrecisionMode === 'decimalPlaces'
          ? numericInput('decimalPlaces', text.decimalPlaces)
          : null}
        {settings.outputPrecisionMode === 'significantDigits'
          ? numericInput('significantDigits', text.significantDigits)
          : null}
        <ResettableCheckboxField
          checked={settings.export.includeHeaders}
          controlId="input-include-export-headers"
          label={text.includeExportHeaders}
          onChange={(checked) => updateExport('includeHeaders', checked)}
          onReset={() => resetExport('includeHeaders')}
          resetDisabled={exportIsDefault('includeHeaders')}
          resetText={text.reset}
        />
      </fieldset>
    </section>
  );
}
