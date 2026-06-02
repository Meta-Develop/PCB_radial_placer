import type { PlacementSettings } from '../types';

export const DEFAULT_SETTINGS: PlacementSettings = {
  count: 8,
  radius: 10,
  centerX: 0,
  centerY: 0,
  startAngleDeg: 0,
  startAngleOffsetDeg: 0,
  endAngleDeg: 180,
  stepAngleDeg: 45,
  individualAnglesText: '',
  direction: 'counterclockwise',
  angleMode: 'fullCircle',
  includeEndpoint: true,
  unit: 'mm',
  outputPrecisionMode: 'decimalPlaces',
  decimalPlaces: 3,
  significantDigits: 4,
  coordinateSystem: 'mathYUp',
  reference: {
    prefix: 'D',
    startNumber: 1,
    padding: 0,
  },
  rotation: {
    mode: 'radialOutward',
    fixedRotationDeg: 0,
    rotationOffsetDeg: 0,
    normalize: 'zeroTo360',
    formulaA: 1,
    formulaB: 0,
  },
  componentOffset: {
    x: 0,
    y: 0,
  },
  export: {
    includeHeaders: true,
  },
  inputExpressions: {},
};

export const EXAMPLE_PRESETS: Array<{ name: string; settings: PlacementSettings }> = [
  {
    name: '8 LEDs on 10 mm radius',
    settings: DEFAULT_SETTINGS,
  },
  {
    name: '12 switches on 30 mm radius',
    settings: {
      ...DEFAULT_SETTINGS,
      count: 12,
      radius: 30,
      reference: { prefix: 'SW', startNumber: 1, padding: 2 },
      rotation: { ...DEFAULT_SETTINGS.rotation, mode: 'tangentClockwise' },
    },
  },
  {
    name: '16 components on 180 degree arc',
    settings: {
      ...DEFAULT_SETTINGS,
      count: 16,
      radius: 25,
      angleMode: 'arc',
      startAngleDeg: 0,
      endAngleDeg: 180,
      includeEndpoint: true,
      reference: { prefix: 'U', startNumber: 1, padding: 2 },
    },
  },
];
