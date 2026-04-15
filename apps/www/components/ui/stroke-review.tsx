import { DrawLinePoint } from '@/lib/linelive'

/**
 * Polyline from `points` in (time, value) — same idea as the chart: time → x, value → y,
 * each axis linear over its own range (independent scales, not one global scale factor).
 */
export function StrokePreview({
  points,
  stroke,
  strokeWidth,
}: {
  points: DrawLinePoint[]
  stroke: string
  strokeWidth: number
}) {
  if (points.length < 2) return null

  const minT = Math.min(...points.map((p) => p.time))
  const maxT = Math.max(...points.map((p) => p.time))
  const minV = Math.min(...points.map((p) => p.value))
  const maxV = Math.max(...points.map((p) => p.value))
  let spanT = maxT - minT
  let spanV = maxV - minV
  if (spanT <= 0) spanT = 1
  if (spanV <= 0) spanV = 1

  const W = 200
  const H = 120
  const pad = 6
  const innerW = W - pad * 2
  const innerH = H - pad * 2

  const d = points
    .map((p, i) => {
      const x = pad + ((p.time - minT) / spanT) * innerW
      const y = pad + ((maxV - p.value) / spanV) * innerH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)}`
    })
    .join('')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="max-w-full h-full w-auto"
      style={{ display: 'block' }}
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={Math.max(1.5, strokeWidth)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      />
    </svg>
  )
}
