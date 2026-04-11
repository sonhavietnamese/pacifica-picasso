import type { ChartLayout, DrawLine } from '../types'

// ── Cross particles (spawned when price crosses a drawn line) ────────────

export interface CrossParticle {
  x: number; y: number
  vx: number; vy: number
  life: number
  size: number
  color: string
}

const CROSS_PARTICLE_LIFETIME = 1.0

export function updateAndDrawCrossParticles(
  ctx: CanvasRenderingContext2D,
  particles: CrossParticle[],
  dt: number,
): void {
  if (particles.length === 0) return
  const dtSec = dt / 1000
  ctx.save()
  let writeIdx = 0
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.life -= dtSec / CROSS_PARTICLE_LIFETIME
    if (p.life <= 0) continue
    p.x += p.vx * dtSec
    p.y += p.vy * dtSec
    p.vx *= 0.95
    p.vy *= 0.95
    ctx.globalAlpha = p.life * 0.6
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2)
    ctx.fill()
    particles[writeIdx++] = p
  }
  particles.length = writeIdx
  ctx.restore()
}

// ── User-drawn line rendering ────────────────────────────────────────────

/** Render user-drawn freehand paths (committed + active in-progress). */
export function drawUserLines(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  lines: DrawLine[],
  activeLine: DrawLine | null,
  defaultStroke: string,
  defaultWidth: number,
  formatValue: (v: number) => string,
  bgRgb: [number, number, number],
  now: number,
  crossCounts: number[],
): void {
  for (let i = 0; i < lines.length; i++) {
    const crossPct = Math.min(100, (crossCounts[i] ?? 0) * 5)
    renderPath(ctx, layout, lines[i], defaultStroke, defaultWidth, formatValue, bgRgb, false, now, crossPct)
  }
  if (activeLine) {
    renderPath(ctx, layout, activeLine, defaultStroke, defaultWidth, formatValue, bgRgb, true, now, 0)
  }
}

function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  stroke: string,
  width: number,
  alpha: number,
) {
  if (pts.length < 2) return
  ctx.save()
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = alpha

  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  if (pts.length === 2) {
    ctx.lineTo(pts[1][0], pts[1][1])
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2
      const my = (pts[i][1] + pts[i + 1][1]) / 2
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
    }
    const last = pts[pts.length - 1]
    ctx.lineTo(last[0], last[1])
  }
  ctx.stroke()
  ctx.restore()
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function renderPath(
  ctx: CanvasRenderingContext2D,
  layout: ChartLayout,
  line: DrawLine,
  defaultStroke: string,
  defaultWidth: number,
  formatValue: (v: number) => string,
  bgRgb: [number, number, number],
  isActive: boolean,
  now: number,
  crossPct: number,
) {
  const pts = line.points
  if (pts.length < 2) return

  const stroke = line.stroke ?? defaultStroke
  const width = line.strokeWidth ?? defaultWidth
  const screenPts: [number, number][] = pts.map(p => [layout.toX(p.time), layout.toY(p.value)])

  // Find the split point where the price has "consumed" the drawn line
  let splitIdx = -1
  let splitFrac = 0
  if (!isActive && now > 0) {
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].time > now) {
        splitIdx = i
        if (i > 0) {
          const span = pts[i].time - pts[i - 1].time
          splitFrac = span > 0 ? (now - pts[i - 1].time) / span : 0
        }
        break
      }
    }
  }

  const allConsumed = splitIdx === -1 && !isActive && now > 0 && pts[pts.length - 1].time <= now
  const noneConsumed = splitIdx === 0 || (splitIdx === -1 && !allConsumed)

  if (noneConsumed || isActive) {
    // All future or active drawing — single pass
    drawSmoothPath(ctx, screenPts, stroke, width, isActive ? 0.7 : 0.35)
  } else if (allConsumed) {
    // Fully consumed — draw at full opacity
    drawSmoothPath(ctx, screenPts, stroke, width, 1.0)
  } else {
    // Partially consumed — split rendering
    const prev = screenPts[splitIdx - 1]
    const next = screenPts[splitIdx]
    const sx = prev[0] + (next[0] - prev[0]) * splitFrac
    const sy = prev[1] + (next[1] - prev[1]) * splitFrac

    // Future portion (dim)
    drawSmoothPath(ctx, screenPts, stroke, width, 0.25)

    // Consumed portion (bright, drawn on top)
    const consumedPts: [number, number][] = screenPts.slice(0, splitIdx)
    consumedPts.push([sx, sy])
    drawSmoothPath(ctx, consumedPts, stroke, width, 1.0)

    // Crossing-based percentage pill at the split point (+5% per cross)
    if (crossPct > 0) {
      renderPercentagePill(ctx, sx, sy - 14, `${crossPct}%`, stroke, bgRgb)
    }

    // Split-point dot
    ctx.save()
    ctx.fillStyle = stroke
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Endpoint dots
  ctx.save()
  ctx.fillStyle = stroke
  ctx.globalAlpha = isActive ? 0.5 : (noneConsumed ? 0.4 : 0.8)
  ctx.beginPath()
  ctx.arc(screenPts[0][0], screenPts[0][1], 2.5, 0, Math.PI * 2)
  ctx.fill()
  const last = screenPts[screenPts.length - 1]
  ctx.beginPath()
  ctx.arc(last[0], last[1], 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Price delta label for fully consumed paths
  if (allConsumed) {
    const straightDx = last[0] - screenPts[0][0]
    const straightDy = last[1] - screenPts[0][1]
    if (Math.sqrt(straightDx * straightDx + straightDy * straightDy) >= 20) {
      const delta = pts[pts.length - 1].value - pts[0].value
      const sign = delta >= 0 ? '+' : ''
      renderPercentagePill(ctx, last[0], last[1] + (delta >= 0 ? -24 : 8), `${sign}${formatValue(delta)}`, stroke, bgRgb)
    }
  }
}

function renderPercentagePill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  stroke: string,
  bgRgb: [number, number, number],
) {
  ctx.save()
  ctx.font = '600 9px "SF Mono", Menlo, monospace'
  const textW = ctx.measureText(text).width
  const pillW = textW + 10
  const pillH = 16
  const pillR = 4
  const lx = x - pillW / 2
  const ly = y - pillH / 2

  ctx.globalAlpha = 0.85
  ctx.fillStyle = `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`
  roundedRect(ctx, lx, ly, pillW, pillH, pillR)
  ctx.fill()

  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.5
  roundedRect(ctx, lx, ly, pillW, pillH, pillR)
  ctx.stroke()

  ctx.globalAlpha = 1
  ctx.fillStyle = stroke
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
  ctx.restore()
}
