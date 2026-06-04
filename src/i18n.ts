import type { ValidationMessage } from './types';

export type Language = 'en' | 'ja';

const en = {
  languageLabel: 'Language',
  languageNames: {
    en: 'English',
    ja: '日本語',
  },
  header: {
    subtitle: 'Static coordinate calculator for radial ECAD placement tables.',
    linksLabel: 'Project links',
    github: 'GitHub repository',
    x: 'X profile',
    factsLabel: 'Current coordinate convention',
    zeroDeg: '0 deg = +X',
    yUp: '+Y up',
    yDown: '+Y down',
    ccw: 'CCW positive step',
    cw: 'CW negative step',
  },
  input: {
    heading: 'Placement Inputs',
    geometry: 'Geometry',
    count: 'Count',
    radius: 'Radius',
    centerX: 'Center X',
    centerY: 'Center Y',
    startAngle: 'Start angle',
    startAngleOffset: 'Start angle offset',
    startAngleOffsetHelp: 'Added to start angle before layout; use for half-pitch offsets.',
    direction: 'Direction',
    coordinateSystem: 'Coordinate system',
    unit: 'Unit',
    angleMode: 'Angle Mode',
    mode: 'Mode',
    stepAngle: 'Step angle',
    arcEndAngle: 'Arc end angle',
    arcEndHelp: 'Only used in Arc mode; it is the target endpoint of the arc.',
    individualAngles: 'Individual angles',
    individualAnglesHelp:
      'One angle per component. Commas, semicolons, or newlines are accepted; values support arithmetic expressions. Entry count must match Count.',
    notUsedInIndividualAngles: 'Not used in Individual angles mode.',
    includeArcEndpoint: 'Include arc endpoint',
    referenceDesignators: 'Reference Designators',
    prefix: 'Prefix',
    startNumber: 'Start number',
    padding: 'Padding',
    rotation: 'Rotation',
    fixedRotation: 'Fixed rotation',
    offset: 'Offset',
    rotationOffset: 'Rotation offset',
    rotationOffsetHelp: 'Added after the selected rotation mode.',
    formulaA: 'Formula a',
    formulaB: 'Formula b',
    normalize: 'Normalize',
    componentOriginOffset: 'Component Origin Offset',
    localOffsetX: 'Local offset X',
    localOffsetY: 'Local offset Y',
    output: 'Output',
    precisionMode: 'Precision mode',
    decimalPlaces: 'Decimal places',
    significantDigits: 'Significant digits',
    includeExportHeaders: 'Include export headers',
    directionOptions: {
      counterclockwise: 'Counterclockwise',
      clockwise: 'Clockwise',
    },
    coordinateOptions: {
      mathYUp: 'Mathematical Y-up',
      ecadYDown: 'Screen / ECAD Y-down',
    },
    unitOptions: {
      mm: 'mm',
      inch: 'inch',
      mil: 'mil',
      unitless: 'unitless',
    },
    angleModeOptions: {
      fullCircle: 'Full circle: 360 / count',
      customStep: 'Custom step',
      arc: 'Arc between effective start and end',
      individualAngles: 'Individual angles',
    },
    rotationOptions: {
      fixed: 'Fixed',
      radialOutward: 'Radial outward',
      radialInward: 'Radial inward',
      tangentClockwise: 'Tangent clockwise',
      tangentCounterclockwise: 'Tangent counterclockwise',
      customFormulaSimple: 'Custom: a * theta + b',
    },
    normalizeOptions: {
      zeroTo360: '0 to 360',
      minus180To180: '-180 to 180',
      none: 'None',
    },
    precisionModeOptions: {
      decimalPlaces: 'Decimal places',
      significantDigits: 'Significant digits',
    },
  },
  preset: {
    heading: 'Presets',
    presetName: 'Preset name',
    save: 'Save Preset',
    export: 'Export Preset',
    reset: 'Reset Defaults',
    savedPresetsLabel: 'Saved presets',
    none: 'No saved local presets yet.',
    load: 'Load',
    delete: 'Delete',
    details: 'Example presets and JSON import',
    importLabel: 'Import preset JSON',
    importButton: 'Import JSON',
    nameRequired: 'Preset name is required.',
    saved: (name: string) => `Saved ${name}.`,
    saveFailed: 'Could not save preset in this browser profile.',
    imported: 'Imported preset settings.',
    importFailed: 'Import failed. Paste a settings or preset JSON object.',
  },
  validation: {
    ok: 'Inputs are valid.',
    error: 'Error',
    warning: 'Warning',
  },
  summary: {
    label: 'Geometry summary',
    signedStep: 'Signed step',
    angularPitch: 'Angular pitch',
    chordLength: 'Chord length',
    arcLength: 'Arc length',
    circumference: 'Circumference',
  },
  preview: {
    heading: 'SVG Preview',
    yUp: '+Y is drawn upward to match mathematical output coordinates.',
    yDown: '+Y is drawn downward to match screen / ECAD output coordinates.',
    exportSvg: 'SVG',
    labels: 'Labels',
    axes: 'Axes',
    boardOutlineRadius: 'Board outline radius',
    boardRadiusError: 'Board outline radius must be non-negative.',
  },
  graph: {
    heading: 'Spacing Check',
    subtitle: (count: number, span: string) => `${count} points. Check ${span}, angle gaps, and X/Y drift.`,
    arcSpan: 'arc span',
    angleSpan: 'angle span',
    empty: 'No valid placements',
    aria: 'Spacing check graph',
    angleTitle: 'Angle by output index',
    profileTitle: 'Origin X/Y profile',
    adjacentStep: 'Adjacent angle step',
    stepTitle: (from: number, to: number, value: string) => `Step ${from} to ${to}: ${value} deg`,
  },
  outputTable: {
    heading: 'Placement Table',
    rowsSummary: (count: number, unit: string) => `${count} rows, ${unit}`,
    unitlessCoordinates: 'unitless coordinates',
    copyTsv: 'Copy TSV',
    copySucceeded: 'Copied TSV to clipboard.',
    copyFailed: 'Clipboard copy failed. Use the TSV download instead.',
    csv: 'CSV',
    tsv: 'TSV',
    json: 'JSON',
    columns: {
      index: 'Index',
      ref: 'Ref',
      angleDeg: 'Angle deg',
      originX: 'Origin X',
      originY: 'Origin Y',
      targetCenterX: 'Target center X',
      targetCenterY: 'Target center Y',
      appliedOffsetX: 'Applied offset X',
      appliedOffsetY: 'Applied offset Y',
      rotationDeg: 'Rotation deg',
      radius: 'Radius',
      centerX: 'Center X',
      centerY: 'Center Y',
    },
  },
  help: {
    summary: 'Coordinate conventions and ECAD assumptions',
    yUp: 'Mathematical Y-up: y = centerY + radius * sin(theta).',
    yDown: 'Screen / ECAD Y-down: y = centerY - radius * sin(theta).',
    conventions:
      'Center offset is applied as (centerX, centerY). Zero degrees points along +X. Angles are in degrees. Direction controls the sign of the angular step.',
    arc:
      'Arc end angle is only used in Arc mode. Start angle offset is added to start angle first, so the effective first angle is startAngle + startAngleOffset. In endpoint mode the directed arc targets the arc end angle.',
    individualAngles:
      'Individual angles mode uses the listed angle for each component index. Start angle, offset, step, end angle, direction, and endpoint settings do not modify those manual angles.',
    expressions:
      'Numeric fields accept arithmetic such as 2.54/2, 10 + 1.27, parentheses, unary signs, multiplication, and division. Invalid expressions block placement output instead of falling back to zero.',
    offset:
      'Component local offset is the vector from footprint/CAD origin to desired component center in component local coordinates. The radial point remains the target center; exported X/Y are the corrected footprint origin after rotating that offset by rotationDeg.',
    boundary:
      'This MVP generates coordinates and exports data only. It does not edit .kicad_pcb files, preserve or mutate footprints, inspect clearances, or modify locked component state.',
    formula: 'Formula: x = centerX + radius * cos(theta), theta = effectiveStartAngle + index * stepAngle.',
  },
};

export type UiText = typeof en;

const ja: UiText = {
  languageLabel: '言語',
  languageNames: {
    en: 'English',
    ja: '日本語',
  },
  header: {
    subtitle: 'ラジアル配置用のECAD座標テーブルを計算する静的ツールです。',
    linksLabel: 'プロジェクトリンク',
    github: 'GitHubリポジトリ',
    x: 'Xプロフィール',
    factsLabel: '現在の座標規約',
    zeroDeg: '0度 = +X',
    yUp: '+Y上向き',
    yDown: '+Y下向き',
    ccw: '反時計回りは正のステップ',
    cw: '時計回りは負のステップ',
  },
  input: {
    heading: '配置入力',
    geometry: 'ジオメトリ',
    count: '個数',
    radius: '半径',
    centerX: '中心X',
    centerY: '中心Y',
    startAngle: '開始角度',
    startAngleOffset: '開始角度オフセット',
    startAngleOffsetHelp: '配置前に開始角度へ加算します。半ピッチずらしに使えます。',
    direction: '方向',
    coordinateSystem: '座標系',
    unit: '単位',
    angleMode: '角度モード',
    mode: 'モード',
    stepAngle: 'ステップ角度',
    arcEndAngle: '円弧終端角度',
    arcEndHelp: 'Arcモードだけで使います。円弧の目標終点です。',
    individualAngles: '個別角度',
    individualAnglesHelp:
      '部品1個につき1つの角度を指定します。カンマ、セミコロン、改行で区切れます。値には数式を使えます。項目数は個数と一致させてください。',
    notUsedInIndividualAngles: '個別角度モードでは使いません。',
    includeArcEndpoint: '円弧の終点を含める',
    referenceDesignators: 'リファレンス',
    prefix: '接頭辞',
    startNumber: '開始番号',
    padding: 'ゼロ埋め桁数',
    rotation: '回転',
    fixedRotation: '固定回転',
    offset: 'オフセット',
    rotationOffset: '回転オフセット',
    rotationOffsetHelp: '選択した回転モードの後に加算します。',
    formulaA: '係数a',
    formulaB: '係数b',
    normalize: '正規化',
    componentOriginOffset: '部品原点オフセット',
    localOffsetX: 'ローカルオフセットX',
    localOffsetY: 'ローカルオフセットY',
    output: '出力',
    precisionMode: '精度モード',
    decimalPlaces: '小数点以下桁数',
    significantDigits: '有効桁数',
    includeExportHeaders: 'エクスポートにヘッダーを含める',
    directionOptions: {
      counterclockwise: '反時計回り',
      clockwise: '時計回り',
    },
    coordinateOptions: {
      mathYUp: '数学座標 Y上向き',
      ecadYDown: '画面 / ECAD Y下向き',
    },
    unitOptions: {
      mm: 'mm',
      inch: 'inch',
      mil: 'mil',
      unitless: '単位なし',
    },
    angleModeOptions: {
      fullCircle: '全周: 360 / 個数',
      customStep: 'カスタムステップ',
      arc: '有効開始角度から終端角度までの円弧',
      individualAngles: '個別角度',
    },
    rotationOptions: {
      fixed: '固定',
      radialOutward: '放射外向き',
      radialInward: '放射内向き',
      tangentClockwise: '接線 時計回り',
      tangentCounterclockwise: '接線 反時計回り',
      customFormulaSimple: 'カスタム: a * theta + b',
    },
    normalizeOptions: {
      zeroTo360: '0から360',
      minus180To180: '-180から180',
      none: 'なし',
    },
    precisionModeOptions: {
      decimalPlaces: '小数点以下桁数',
      significantDigits: '有効桁数',
    },
  },
  preset: {
    heading: 'プリセット',
    presetName: 'プリセット名',
    save: 'プリセット保存',
    export: 'プリセット出力',
    reset: '初期値に戻す',
    savedPresetsLabel: '保存済みプリセット',
    none: 'ローカル保存されたプリセットはまだありません。',
    load: '読み込み',
    delete: '削除',
    details: 'サンプルプリセットとJSON取り込み',
    importLabel: 'プリセットJSONを取り込み',
    importButton: 'JSON取り込み',
    nameRequired: 'プリセット名が必要です。',
    saved: (name: string) => `${name} を保存しました。`,
    saveFailed: 'このブラウザプロファイルではプリセットを保存できませんでした。',
    imported: 'プリセット設定を取り込みました。',
    importFailed: '取り込みに失敗しました。設定またはプリセットのJSONオブジェクトを貼り付けてください。',
  },
  validation: {
    ok: '入力は有効です。',
    error: 'エラー',
    warning: '警告',
  },
  summary: {
    label: 'ジオメトリ概要',
    signedStep: '符号付きステップ',
    angularPitch: '角度ピッチ',
    chordLength: '弦長',
    arcLength: '円弧長',
    circumference: '円周',
  },
  preview: {
    heading: 'SVGプレビュー',
    yUp: '+Yは数学座標の出力に合わせて上向きに描画されます。',
    yDown: '+Yは画面 / ECAD出力に合わせて下向きに描画されます。',
    exportSvg: 'SVG',
    labels: 'ラベル',
    axes: '軸',
    boardOutlineRadius: '基板外形半径',
    boardRadiusError: '基板外形半径は0以上にしてください。',
  },
  graph: {
    heading: '間隔チェック',
    subtitle: (count: number, span: string) => `${count}点。${span}、角度差、X/Yの変化を確認。`,
    arcSpan: '円弧スパン',
    angleSpan: '角度スパン',
    empty: '有効な配置がありません',
    aria: '間隔チェックグラフ',
    angleTitle: '出力インデックスごとの角度',
    profileTitle: '原点X/Yプロファイル',
    adjacentStep: '隣接角度ステップ',
    stepTitle: (from: number, to: number, value: string) => `ステップ ${from} から ${to}: ${value}度`,
  },
  outputTable: {
    heading: '配置テーブル',
    rowsSummary: (count: number, unit: string) => `${count}行、${unit}`,
    unitlessCoordinates: '単位なし座標',
    copyTsv: 'TSVをコピー',
    copySucceeded: 'TSVをクリップボードにコピーしました。',
    copyFailed: 'クリップボードへのコピーに失敗しました。TSVダウンロードを使用してください。',
    csv: 'CSV',
    tsv: 'TSV',
    json: 'JSON',
    columns: {
      index: 'インデックス',
      ref: 'Ref',
      angleDeg: '角度 deg',
      originX: '原点X',
      originY: '原点Y',
      targetCenterX: '目標中心X',
      targetCenterY: '目標中心Y',
      appliedOffsetX: '適用オフセットX',
      appliedOffsetY: '適用オフセットY',
      rotationDeg: '回転 deg',
      radius: '半径',
      centerX: '中心X',
      centerY: '中心Y',
    },
  },
  help: {
    summary: '座標規約とECAD前提',
    yUp: '数学座標 Y上向き: y = centerY + radius * sin(theta)。',
    yDown: '画面 / ECAD Y下向き: y = centerY - radius * sin(theta)。',
    conventions:
      '中心オフセットは (centerX, centerY) として適用されます。0度は+X方向です。角度は度数です。方向は角度ステップの符号を制御します。',
    arc:
      '円弧終端角度はArcモードだけで使います。開始角度オフセットを開始角度へ先に加算するため、有効な最初の角度は startAngle + startAngleOffset です。終点を含める場合、選択した方向で円弧終端角度を目標にします。',
    individualAngles:
      '個別角度モードでは、各部品インデックスに対してリスト内の角度をそのまま使います。開始角度、オフセット、ステップ、終端角度、方向、終点設定は手入力角度を変更しません。',
    expressions:
      '数値フィールドでは 2.54/2、10 + 1.27、括弧、単項符号、乗算、除算を使えます。無効な式は0へ丸めず、配置出力をブロックします。',
    offset:
      '部品ローカルオフセットは、フットプリント/CAD原点から目的の部品中心までのベクトルを部品ローカル座標で指定します。ラジアル点は目標中心のままで、出力X/Yはそのオフセットを rotationDeg で回転した後の補正済みフットプリント原点です。',
    boundary:
      'このMVPは座標生成とデータ出力だけを行います。.kicad_pcbファイルの編集、フットプリントの保持や変更、クリアランス検査、ロック部品状態の変更は行いません。',
    formula:
      '式: x = centerX + radius * cos(theta)、theta = effectiveStartAngle + index * stepAngle。',
  },
};

export const UI_TEXT: Record<Language, UiText> = { en, ja };

const validationMessageJa: Record<string, string> = {
  'Count must be a positive integer.': '個数は正の整数にしてください。',
  'Count must be 2000 or less.': '個数は2000以下にしてください。',
  'Radius must be a finite non-negative number.': '半径は有限の0以上の数値にしてください。',
  'Center X must be a finite number.': '中心Xは有限の数値にしてください。',
  'Center Y must be a finite number.': '中心Yは有限の数値にしてください。',
  'Start angle must be a finite number.': '開始角度は有限の数値にしてください。',
  'Start angle offset must be a finite number.': '開始角度オフセットは有限の数値にしてください。',
  'Arc end angle must be a finite number.': '円弧終端角度は有限の数値にしてください。',
  'Step angle must be a finite number.': 'ステップ角度は有限の数値にしてください。',
  'Step angle must be non-negative; Direction controls the sign.':
    'ステップ角度は0以上にしてください。方向が符号を制御します。',
  'Decimal places must be an integer from 0 to 9.': '小数点以下桁数は0から9の整数にしてください。',
  'Significant digits must be an integer from 1 to 12.': '有効桁数は1から12の整数にしてください。',
  'Reference start number must be an integer.': 'リファレンス開始番号は整数にしてください。',
  'Reference padding must be an integer from 0 to 8.': 'リファレンスのゼロ埋め桁数は0から8の整数にしてください。',
  'Fixed rotation must be a finite number.': '固定回転は有限の数値にしてください。',
  'Rotation offset must be a finite number.': '回転オフセットは有限の数値にしてください。',
  'Rotation formula coefficient a must be a finite number.': '回転式の係数aは有限の数値にしてください。',
  'Rotation formula coefficient b must be a finite number.': '回転式の係数bは有限の数値にしてください。',
  'Component local offset X must be a finite number.': '部品ローカルオフセットXは有限の数値にしてください。',
  'Component local offset Y must be a finite number.': '部品ローカルオフセットYは有限の数値にしてください。',
  'Arc mode with endpoint included requires count of at least 2.':
    '終点を含むArcモードでは、個数を2以上にしてください。',
  'Individual angles must contain one angle per component.':
    '個別角度は部品1個につき1つ指定してください。',
  'Individual angles must not contain empty list items.':
    '個別角度に空の項目を含めないでください。',
  'Individual angle entry count must match Count.':
    '個別角度の項目数は個数と一致させてください。',
  'Radius is 0, so multiple components will share one coordinate.':
    '半径が0のため、複数の部品が同じ座標になります。',
  'Step angle is effectively 0, so duplicate coordinates are likely.':
    'ステップ角度が実質0のため、重複座標になる可能性があります。',
  'Generated placements include duplicate target coordinates; check angle spacing and count.':
    '生成された配置に重複する目標座標があります。角度間隔と個数を確認してください。',
  'Adjacent chord length is below 0.1 selected units; check package clearance.':
    '隣接する弦長が選択単位で0.1未満です。部品クリアランスを確認してください。',
};

const expressionErrorJa: Record<string, string> = {
  'Enter a numeric value or expression.': '数値または数式を入力してください。',
  'Expression result must be a finite number.': '数式の結果は有限の数値にしてください。',
  'Invalid numeric expression.': '無効な数式です。',
  'Division by zero is not allowed.': '0で割ることはできません。',
  'Missing closing parenthesis.': '閉じ括弧がありません。',
  'Expected a number or parenthesized expression.': '数値または括弧付きの式が必要です。',
  'Number literal must be finite.': '数値リテラルは有限にしてください。',
};

export function translateExpressionError(error: string, language: Language): string {
  if (language === 'en') {
    return error;
  }

  const unexpected = error.match(/^Unexpected character "(.+)".$/);
  if (unexpected) {
    return `予期しない文字 "${unexpected[1]}" です。`;
  }

  return expressionErrorJa[error] ?? error;
}

export function translateValidationText(message: string, language: Language): string {
  if (language === 'en') {
    return message;
  }

  return validationMessageJa[message] ?? translateExpressionError(message, language);
}

export function translateValidationMessage(message: ValidationMessage, language: Language): string {
  return translateValidationText(message.message, language);
}
