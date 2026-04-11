# Linelive

A real-time, canvas-based charting library for React. Renders smooth, animated line and candlestick charts using `requestAnimationFrame` with frame-rate-independent interpolation. Originally from [benjitaylor/liveline](https://github.com/benjitaylor/liveline).

**This library has been modified to support drawing freehand lines on the chart.**

---

## Quick Start

```tsx
import { Liveline } from '@/lib/linelive'
import type { LivelinePoint } from '@/lib/linelive'

const data: LivelinePoint[] = [
  { time: 1700000000, value: 42.5 },
  { time: 1700000001, value: 43.1 },
  // ...
]

<Liveline data={data} value={43.1} />
```

---

## Architecture Overview

```
linelive/
├── index.ts                  # Public exports
├── liveline.tsx              # <Liveline> React component (props → engine)
├── liveline-transition.tsx   # <LivelineTransition> cross-fade wrapper
├── use-liveline-engine.ts    # Core rAF loop: state machine, lerps, draw dispatch
├── types.ts                  # All TypeScript interfaces
├── theme.ts                  # Palette derivation from accent color + theme mode
├── canvas/
│   └── dpr.ts                # Device pixel ratio helpers
├── math/
│   ├── lerp.ts               # Frame-rate-independent exponential lerp
│   ├── range.ts              # Y-axis range computation with margins
│   ├── momentum.ts           # Up/down/flat momentum detection
│   ├── interpolate.ts        # Binary-search value interpolation at time
│   ├── intervals.ts          # Nice time interval picker for axis labels
│   └── spline.ts             # Fritsch-Carlson monotone cubic spline
└── draw/
    ├── index.ts              # Master draw orchestrators (line, candle, multi-series)
    ├── line.ts               # Line stroke + gradient fill + morph from loading shape
    ├── dot.ts                # Live dot, pulse ring, momentum arrows
    ├── grid.ts               # Y-axis grid lines + labels (fading, hysteresis)
    ├── time-axis.ts          # X-axis time ticks + labels (fading, overlap resolution)
    ├── crosshair.ts          # Hover crosshair + tooltip (single + multi-series)
    ├── candlestick.ts        # OHLC candlestick rendering + candle crosshair
    ├── badge.ts              # SVG badge pill geometry (tail + pill path)
    ├── reference-line.ts     # Horizontal reference line with optional label
    ├── orderbook.ts          # Kalshi-style streaming orderbook labels
    ├── particles.ts          # Burst particles on momentum swings (degen mode)
    ├── loading.ts            # Loading state: breathing accent-colored squiggly
    ├── loading-shape.ts      # Shared squiggly shape + breath alpha (loading ↔ chart morph)
    └── empty.ts              # Empty state: grey squiggly + "No data" text with gradient gap
```

---

## Core Data Flow

```
Props (data, value, series, candles...)
  │
  ▼
<Liveline>          ← React component: resolves palette, manages UI controls
  │
  ▼
useLivelineEngine() ← rAF loop: delta-time lerps, state transitions, draw dispatch
  │
  ├─ Line mode      → drawFrame()       → drawGrid, drawLine, drawDot, drawCrosshair...
  ├─ Candle mode    → drawCandleFrame() → drawGrid, drawCandlesticks, drawClosePrice...
  └─ Multi-series   → drawMultiFrame()  → drawGrid, drawLine × N, drawMultiDot...
```

---

## Render Modes

### 1. Line Mode (default)

Single time-series rendered as a smooth monotone cubic spline with optional gradient fill.

**Key props:** `data`, `value`, `color`, `fill`, `momentum`, `badge`

### 2. Candlestick Mode

OHLC candlestick bars with smooth live-candle lerping, wick rendering, and bull/bear coloring.

**Key props:** `mode="candle"`, `candles`, `candleWidth`, `liveCandle`

Supports morphing between line and candle via `lineMode` + `onModeChange`. The transition uses OHLC collapse (candle bodies shrink to close-line), cross-fading candle alpha with line opacity, and a density transition that blends candle-close resolution into tick-level data.

### 3. Multi-Series Mode

Multiple overlapping lines sharing the same Y-axis. No fill, no badge, no momentum arrows — just colored lines with endpoint dots and optional labels.

**Key props:** `series` (array of `LivelineSeries`)

---

## Component API

### `<Liveline>`

The main chart component. All rendering happens on a `<canvas>` element managed by `useLivelineEngine`.

#### Data Props

| Prop          | Type               | Description                                          |
| ------------- | ------------------ | ---------------------------------------------------- |
| `data`        | `LivelinePoint[]`  | Array of `{ time, value }` points (unix seconds)     |
| `value`       | `number`           | Current live value (lerped smoothly to avoid jumps)  |
| `series`      | `LivelineSeries[]` | Multi-series mode — overrides `data`/`value`/`color` |
| `candles`     | `CandlePoint[]`    | OHLC candle data (when `mode="candle"`)              |
| `liveCandle`  | `CandlePoint`      | Current live candle with real-time OHLC              |
| `candleWidth` | `number`           | Seconds per candle                                   |
| `lineData`    | `LivelinePoint[]`  | Tick-level data for line↔candle density transition   |
| `lineValue`   | `number`           | Current tick value for density transition            |

#### Appearance Props

| Prop           | Type                     | Default       | Description                                   |
| -------------- | ------------------------ | ------------- | --------------------------------------------- |
| `theme`        | `'light' \| 'dark'`      | `'dark'`      | Color theme                                   |
| `color`        | `string`                 | `'#3b82f6'`   | Accent color (full palette derived from this) |
| `mode`         | `'line' \| 'candle'`     | `'line'`      | Chart type                                    |
| `lineMode`     | `boolean`                | —             | Morph candles into line display               |
| `lineWidth`    | `number`                 | `2`           | Stroke width of the main line in px           |
| `fill`         | `boolean`                | `true`        | Show gradient fill under line                 |
| `grid`         | `boolean`                | `true`        | Show Y-axis grid                              |
| `badge`        | `boolean`                | `true`        | Show value badge pill on the right            |
| `badgeTail`    | `boolean`                | `true`        | Pointed tail on badge pill                    |
| `badgeVariant` | `'default' \| 'minimal'` | `'default'`   | Badge visual style                            |
| `momentum`     | `boolean \| Momentum`    | `true`        | Auto-detect or override momentum arrows       |
| `pulse`        | `boolean`                | `true`        | Pulsing ring on live dot                      |
| `cursor`       | `string`                 | `'crosshair'` | CSS cursor on hover                           |

#### Behavior Props

| Prop                 | Type                      | Default                | Description                                      |
| -------------------- | ------------------------- | ---------------------- | ------------------------------------------------ |
| `window`             | `number`                  | `30`                   | Visible time window in seconds                   |
| `lerpSpeed`          | `number`                  | `0.08`                 | Interpolation speed (fraction per 16.67ms frame) |
| `scrub`              | `boolean`                 | `true`                 | Enable crosshair scrubbing on hover              |
| `loading`            | `boolean`                 | `false`                | Show loading animation (breathing line)          |
| `paused`             | `boolean`                 | `false`                | Pause chart scrolling                            |
| `exaggerate`         | `boolean`                 | `false`                | Tight Y-axis range (small moves fill chart)      |
| `showValue`          | `boolean`                 | `false`                | Show live value as DOM text overlay              |
| `valueMomentumColor` | `boolean`                 | `false`                | Color value text green/red by momentum           |
| `degen`              | `boolean \| DegenOptions` | `false`                | Burst particles + chart shake on swings          |
| `emptyText`          | `string`                  | `'No data to display'` | Text in empty state                              |

#### Time Window Controls

| Prop             | Type                               | Description                                        |
| ---------------- | ---------------------------------- | -------------------------------------------------- |
| `windows`        | `WindowOption[]`                   | Array of `{ label, secs }` for time window buttons |
| `onWindowChange` | `(secs: number) => void`           | Callback when window changes                       |
| `windowStyle`    | `'default' \| 'rounded' \| 'text'` | Button style                                       |

#### Callbacks

| Prop             | Type                                     | Description                    |
| ---------------- | ---------------------------------------- | ------------------------------ |
| `onHover`        | `(point: HoverPoint \| null) => void`    | Fires on crosshair move/leave  |
| `onModeChange`   | `(mode: 'line' \| 'candle') => void`     | Built-in line/candle toggle    |
| `onSeriesToggle` | `(id: string, visible: boolean) => void` | Multi-series visibility toggle |

#### Layout Props

| Prop             | Type            | Description                                          |
| ---------------- | --------------- | ---------------------------------------------------- |
| `padding`        | `Padding`       | `{ top, right, bottom, left }` overrides             |
| `tooltipY`       | `number`        | Vertical offset for crosshair tooltip (default `14`) |
| `tooltipOutline` | `boolean`       | Stroke outline on tooltip text (default `true`)      |
| `referenceLine`  | `ReferenceLine` | Horizontal reference line at a fixed value           |
| `orderbook`      | `OrderbookData` | Streaming orderbook overlay                          |
| `className`      | `string`        | Container class                                      |
| `style`          | `CSSProperties` | Container style                                      |

### `<LivelineTransition>`

Cross-fades between chart components (e.g. line ↔ candlestick).

```tsx
<LivelineTransition active={chartType} duration={300}>
  <Liveline key="line" data={data} value={value} />
  <Liveline key="candle" mode="candle" candles={candles} candleWidth={5} data={data} value={value} />
</LivelineTransition>
```

| Prop       | Type             | Default | Description                            |
| ---------- | ---------------- | ------- | -------------------------------------- |
| `active`   | `string`         | —       | Key of the active child                |
| `children` | `ReactElement[]` | —       | Chart elements with unique `key` props |
| `duration` | `number`         | `300`   | Cross-fade duration in ms              |

---

## Key Types

```ts
interface LivelinePoint {
  time: number // unix seconds
  value: number
}

interface CandlePoint {
  time: number // unix seconds (candle open time)
  open: number
  high: number
  low: number
  close: number
}

interface LivelineSeries {
  id: string
  data: LivelinePoint[]
  value: number
  color: string
  label?: string
}

type Momentum = 'up' | 'down' | 'flat'
```

---

## Engine Internals (`useLivelineEngine`)

The engine is a single `requestAnimationFrame` loop that runs continuously while the component is mounted. It never causes React re-renders — all visual updates happen through direct canvas drawing and DOM mutation (badge position, value display).

### State Management

All animation state lives in `useRef`s to avoid triggering re-renders:

- **`displayValueRef`** — lerped current value (smooths big jumps)
- **`displayMinRef` / `displayMaxRef`** — lerped Y-axis range
- **`displayWindowRef`** — lerped time window (for animated window transitions)
- **`chartRevealRef`** — 0→1 morph progress from loading/empty → chart
- **`pauseProgressRef`** — 0→1 pause state (chart decelerates smoothly)
- **`hoverXRef`** — mouse position (set by event listeners on container)
- **`scrubAmountRef`** — 0→1 crosshair visibility (lerped for fade in/out)

### Frame Loop Pipeline

Each frame:

1. **Delta time** — `performance.now()` diff, capped at 50ms
2. **Canvas resize** — DPR-aware, only when container size changes
3. **Pause management** — lerp `pauseProgress`, accumulate `timeDebt`
4. **Loading alpha** — crossfade between loading/empty states
5. **Chart reveal** — morph from loading squiggly to data positions
6. **Mode dispatch** — branch into line, candle, or multi-series pipeline
7. **Value lerp** — adaptive speed (fast for small ticks, slow for big jumps)
8. **Window transition** — log-space interpolation between time windows
9. **Range computation** — visible min/max with margin, smoothed via lerp
10. **Layout** — compute `toX(time)` and `toY(value)` functions
11. **Draw calls** — grid, line/candles, dots, crosshair, badge, particles
12. **Badge DOM update** — position, color, text (mutated directly, no React)

### Lerp System

All animations use frame-rate-independent exponential lerp:

```ts
// speed = fraction approached per 16.67ms (60fps) frame
// At 30fps, dt=33.33ms → approaches more per frame to compensate
function lerp(current, target, speed, dt) {
  const factor = 1 - Math.pow(1 - speed, dt / 16.67)
  return current + (target - current) * factor
}
```

Adaptive speed: value lerps use a gap-ratio boost — small ticks snap quickly, large jumps approach slowly to prevent visual teleportation.

### Chart Reveal Morph

When transitioning from loading/empty to data (or reverse):

- At `chartReveal=0`: line traces the loading squiggly shape (same sinusoidal as `drawLoading`)
- At `chartReveal=1`: line traces actual data positions
- In between: per-pixel morphY blends between loading shape and data, with center-out bloom (center resolves first, edges last)
- Line color blends from grey (loading) to accent color
- Fill, grid, badge, and crosshair fade in on staggered schedules

### Pause System

When `paused=true`:

- `pauseProgress` lerps 0→1 (smooth deceleration)
- `timeDebt` accumulates real seconds that pass while paused
- `pausedDt = dt * (1 - pauseProgress)` — all lerps use this, so animations slow to a stop
- Data is snapshot-frozen to prevent left-edge erosion from consumer-side pruning
- On unpause: `timeDebt` drains gradually (catch-up animation, fast if debt > 10s)

### Window Transitions

When the visible time window changes (e.g. 30s → 5m):

- Uses **log-space** interpolation (logarithmic easing) — feels natural for time scales
- Cosine-eased over 750ms
- Pre-computes target range (min/max) at both start and end windows
- Y-axis interpolates between pre-computed ranges during transition (no jitter)

---

## Draw Modules

### `drawLine` (`draw/line.ts`)

Renders the main chart line using monotone cubic spline interpolation (Fritsch-Carlson). Supports:

- Gradient fill below the line
- Scrub dimming (left of cursor full opacity, right dimmed)
- Chart reveal morph (blends Y positions from loading squiggly → data)
- Color blend (grey → accent during reveal)
- Dashed current-price line

### `drawCandlesticks` (`draw/candlestick.ts`)

Renders OHLC bars with:

- Bull (#22c55e) / Bear (#ef4444) coloring with smooth blend transition
- Live candle glow pulse
- Rounded rect bodies at wide zoom, square at narrow
- Wick rendering with adaptive width
- Scrub dimming (spatial gradient from cursor)

### `drawGrid` (`draw/grid.ts`)

Y-axis grid lines and value labels with:

- TradingView-style interval picking (cycling divisors)
- Coarse/fine label tiers with adaptive density
- Per-label alpha smoothing (fade in/out individually)
- Edge fade near chart boundaries
- Hysteresis: interval sticks until spacing falls outside acceptable range

### `drawTimeAxis` (`draw/time-axis.ts`)

X-axis time labels with:

- Smart interval selection (2s → 1 week ticks depending on window)
- Local midnight alignment for day+ intervals
- Overlap resolution (higher-alpha label wins)
- Per-label fade animation
- Edge fade near chart boundaries

### `drawCrosshair` (`draw/crosshair.ts`)

Hover crosshair with:

- Vertical line + dot at data intersection
- Top-anchored tooltip: `VALUE · TIME` (single-series) or `TIME · ● Label Value · ● Label Value` (multi-series)
- Outline stroke for readability against chart
- Fade-out near live dot (distance-based opacity)
- Lerped scrub amount for smooth appear/disappear

### `drawDot` (`draw/dot.ts`)

Live endpoint indicator:

- Expanding ring pulse (accent colored, 1.5s interval)
- White outer circle with subtle shadow
- Colored inner dot (blends toward background when scrub-dimmed)
- Multi-series variant: colored dot only, no white outer or shadow

### `drawOrderbook` (`draw/orderbook.ts`)

Streaming orderbook labels (Kalshi-style):

- Labels spawn at bottom, decelerate as they rise
- Speed driven by max(price momentum, orderbook churn)
- Weighted random pick from bid/ask levels
- Green (bid) / Red (ask) coloring, fade toward background
- Overlap prevention (minimum 22px gap)

### `drawParticles` (`draw/particles.ts`)

Degen-mode burst particles:

- Spawn on momentum swings exceeding 8% of visible range
- Wide semicircular burst from dot position
- Exponential decay (drag + lifetime fade)
- Burst limiter (max 3 consecutive, resets on calm)
- Configurable scale and down-momentum toggle

---

## Theming

A single accent color + theme mode (`light`/`dark`) generates a full `LivelinePalette` with ~30 derived colors:

```ts
const palette = resolveTheme('#3b82f6', 'dark')
// palette.line, palette.fillTop, palette.gridLine, palette.dotUp, palette.badgeBg, ...
```

Momentum colors are always semantic (green: `#22c55e`, red: `#ef4444`) regardless of accent.

Multi-series palettes are derived per-series with a default color cycle:
`blue → red → green → amber → violet → pink → cyan → orange`

---

## Math Utilities

| Module           | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `lerp.ts`        | Frame-rate-independent exponential interpolation                     |
| `range.ts`       | Y-axis range with margins, reference line inclusion, exaggerate mode |
| `momentum.ts`    | Tail-5-point velocity vs lookback range threshold (12%)              |
| `interpolate.ts` | Binary search + linear interpolation at arbitrary time               |
| `intervals.ts`   | Nice time interval picker: `15s→2s`, `1hr→10min`, `1day→2hr`, etc.   |
| `spline.ts`      | Fritsch-Carlson monotone cubic (no overshoots, same as Chart.js/D3)  |

---

## Potential Modification Points

Areas likely to need changes for Picaso:

1. **Data format** — `LivelinePoint` is `{ time: number, value: number }` with time in unix seconds. If our data uses milliseconds or a different shape, modify `types.ts` and the engine's time math.

2. **Theming** — `theme.ts` hardcodes momentum colors (green/red), fonts (SF Mono/Menlo), and badge styling. Override `resolveTheme()` or extend `LivelinePalette`.

3. **Value formatting** — `formatValue` and `formatTime` are passed as props with simple defaults (`.toFixed(2)` and `HH:MM:SS`). Swap for custom formatters (currency, percentage, relative time, etc.).

4. **Badge** — The DOM-based badge (SVG pill + text) floats above the canvas. It's the only non-canvas element. If we need a fully canvas-based chart (e.g. for screenshots/export), the badge logic in `use-liveline-engine.ts` (`updateBadgeDOM`) needs to move to canvas rendering.

5. **Time window** — Default 30s. The window transition uses log-space interpolation over 750ms. Adjust `WINDOW_TRANSITION_MS` and buffer constants in `use-liveline-engine.ts`.

6. **Y-axis range** — `computeRange()` in `math/range.ts` adds 12% margin (or 1% in exaggerate mode). Tune `marginFactor` and `minRange` for different data scales.

7. **Grid interval** — `drawGrid` uses TradingView-style cycling divisors. The `pickInterval()` function in `draw/grid.ts` and `niceTimeInterval()` in `math/intervals.ts` control label density.

8. **Spline** — Uses Fritsch-Carlson monotone cubic (no overshoots). If we want sharper lines or step interpolation, modify `drawSpline()` in `math/spline.ts`.

9. **Multi-series** — Currently shares a single Y-axis across all series. If we need dual-axis (left/right), the range computation in the multi-series pipeline of `use-liveline-engine.ts` and the `drawMultiFrame()` orchestrator need significant changes.

10. **Orderbook/Particles** — These are financial-specific features. Can be removed entirely if unused, or adapted for other streaming data visualization.

11. **Accessibility** — The chart respects `prefers-reduced-motion` (skips all lerps, instant snap). Add ARIA labels and keyboard navigation if needed.

12. **Server rendering** — All canvas/DOM APIs are client-only. The component assumes `window`, `document`, `ResizeObserver`, and `requestAnimationFrame` exist. Wrap in `dynamic(() => import(...), { ssr: false })` for Next.js.
