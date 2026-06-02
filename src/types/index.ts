export type Direction = 'counterclockwise' | 'clockwise';

export type AngleMode = 'fullCircle' | 'customStep' | 'arc';

export type CoordinateSystem = 'mathYUp' | 'ecadYDown';

export type Unit = 'mm' | 'inch' | 'mil' | 'unitless';

export type RotationMode =
  | 'fixed'
  | 'radialOutward'
  | 'radialInward'
  | 'tangentClockwise'
  | 'tangentCounterclockwise'
  | 'customFormulaSimple';

export type RotationNormalizeMode = 'none' | 'zeroTo360' | 'minus180To180';

export interface RotationSettings {
  mode: RotationMode;
  fixedRotationDeg: number;
  rotationOffsetDeg: number;
  normalize: RotationNormalizeMode;
  formulaA: number;
  formulaB: number;
}

export interface ReferenceSettings {
  prefix: string;
  startNumber: number;
  padding: number;
}

export interface ExportSettings {
  includeHeaders: boolean;
}

export type OutputPrecisionMode = 'decimalPlaces' | 'significantDigits';

export type NumericExpressionField =
  | 'count'
  | 'radius'
  | 'centerX'
  | 'centerY'
  | 'startAngleDeg'
  | 'startAngleOffsetDeg'
  | 'endAngleDeg'
  | 'stepAngleDeg'
  | 'decimalPlaces'
  | 'significantDigits'
  | 'reference.startNumber'
  | 'reference.padding'
  | 'rotation.fixedRotationDeg'
  | 'rotation.rotationOffsetDeg'
  | 'rotation.formulaA'
  | 'rotation.formulaB'
  | 'componentOffset.x'
  | 'componentOffset.y';

export type NumericExpressionMap = Partial<Record<NumericExpressionField, string>>;

export interface ComponentOffsetSettings {
  x: number;
  y: number;
}

export interface PlacementSettings {
  count: number;
  radius: number;
  centerX: number;
  centerY: number;
  startAngleDeg: number;
  startAngleOffsetDeg: number;
  endAngleDeg: number;
  stepAngleDeg: number;
  direction: Direction;
  angleMode: AngleMode;
  includeEndpoint: boolean;
  unit: Unit;
  outputPrecisionMode: OutputPrecisionMode;
  decimalPlaces: number;
  significantDigits: number;
  coordinateSystem: CoordinateSystem;
  reference: ReferenceSettings;
  rotation: RotationSettings;
  componentOffset: ComponentOffsetSettings;
  export: ExportSettings;
  inputExpressions: NumericExpressionMap;
}

export interface Point {
  x: number;
  y: number;
}

export interface Placement extends Point {
  ref: string;
  index: number;
  angleDeg: number;
  rotationDeg: number;
  radius: number;
  centerX: number;
  centerY: number;
  targetCenterX: number;
  targetCenterY: number;
  appliedOffsetX: number;
  appliedOffsetY: number;
}

export interface DerivedGeometry {
  signedStepAngleDeg: number;
  angularPitchDeg: number;
  chordLength: number;
  arcLength: number;
  circumference: number;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationMessage {
  severity: ValidationSeverity;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  messages: ValidationMessage[];
}

export interface PresetRecord {
  id: string;
  name: string;
  settings: PlacementSettings;
  savedAt: string;
}

export interface ExportFormatOptions {
  includeHeaders: boolean;
  precisionMode: OutputPrecisionMode;
  decimalPlaces: number;
  significantDigits: number;
}
