# PCB Radial Placer

PCB Radial Placer is a static TypeScript web app for calculating component
coordinates in circular, arc, and radial PCB layouts.

Live app: <https://meta-develop.github.io/PCB_radial_placer/>

![Example radial preview](public/example-preview.svg)

## Key Behavior

- Calculates radial placement tables for repeated PCB components such as LED
  rings, switch rings, rotary controls, and sensor arrays.
- Keeps ECAD coordinate assumptions explicit: units, center offset, axis
  direction, angle direction, rotation convention, and footprint-origin offset.
- Supports full-circle, custom-step, arc, and per-component individual-angle
  placement modes.
- In Arc mode, `Arc end angle` is the arc target endpoint. `Start angle offset`
  is applied first, so the effective first angle is:

```text
effectiveStartAngle = startAngleDeg + startAngleOffsetDeg
theta = effectiveStartAngle + index * stepAngle
```

- Direction controls the step sign. Counterclockwise uses positive angular
  steps; clockwise uses negative angular steps.
- Individual angles mode uses one manually listed angle per component. Entries
  can be separated with commas, semicolons, or newlines, and each entry accepts
  the same deterministic numeric expression syntax as other numeric fields.
  `Count` remains authoritative and must match the number of angle entries.
- Rotation modes first calculate their base rotation: fixed angle, radial
  outward/inward, tangent clockwise/counterclockwise, or custom
  `formulaA * theta + formulaB`. `Rotation offset` is then added once after the
  selected mode, and the result is normalized according to the rotation
  normalize setting.
- Output formatting can use fixed decimal places or significant digits.
- The app exports coordinate data only. It does not edit native ECAD board
  files.

## Coordinate Convention

- `0 deg` points along `+X`.
- All angles and rotations are in degrees.
- Center offset is applied as `(centerX, centerY)`.
- Mathematical Y-up mode uses:

```text
x = centerX + radius * cos(theta)
y = centerY + radius * sin(theta)
```

- Screen / ECAD Y-down mode flips the sine term:

```text
y = centerY - radius * sin(theta)
```

- `rotationDeg` is an output/CAD coordinate angle. `0 deg` points along `+X`.
  In mathematical Y-up mode, `+90 deg` points toward output `+Y`. In screen /
  ECAD Y-down mode, the same flipped sine convention means `+90 deg` points
  toward output `-Y`.

## Numeric Expressions

Numeric fields accept deterministic arithmetic expressions:

```text
2.54/2
10 + 1.27
(12 - 2) / 4
-90
360/16/2
```

Supported syntax is addition, subtraction, multiplication, division,
parentheses, unary signs, and finite number literals. The parser is implemented
without `eval` or `Function`. Invalid expressions and division by zero block
placement output instead of silently coercing to `0`.

## Component Origin Offset

Component local offset is:

```text
offset = desiredComponentCenter - footprintCadOrigin
```

The offset vector is entered in the component's local coordinate frame. The
radial placement target remains the desired component center. Exported `X` and
`Y` are the corrected footprint/CAD origin coordinates:

```text
rotatedOffset = rotateOutput(offset, rotationDeg, selectedOutputCoordinateSystem)
exportedOrigin = targetCenter - rotatedOffset
```

With zero offset `(0, 0)`, exported `X` and `Y` match the target radial center.

## Export Columns

CSV and TSV exports use these columns:

```csv
Ref,Index,AngleDeg,X,Y,TargetCenterX,TargetCenterY,AppliedOffsetX,AppliedOffsetY,RotationDeg,Radius,CenterX,CenterY
D1,0,0.000,10.000,0.000,10.000,0.000,0.000,0.000,0.000,10.000,0.000,0.000
```

`X` and `Y` are footprint/CAD origin coordinates. `TargetCenterX` and
`TargetCenterY` are the radial center points before component-origin
correction. `AppliedOffsetX` and `AppliedOffsetY` expose the rotated correction
that was subtracted from the target center.

JSON exports include the settings, precision metadata, coordinate convention,
and rounded placement objects.

## PWA / Offline

Production builds register `public/service-worker.js` after page load. After
the first successful online load, the app shell and same-origin build assets can
be served offline from the browser cache. Presets stay local to the current
browser profile through `localStorage`; there is no backend sync or analytics.

## Deployment

The Vite config uses `base: './'`, so the built `dist/` directory can be served
from a repository subpath such as GitHub Pages. No backend server is required.
