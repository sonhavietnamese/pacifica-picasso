/** Mainnet — see https://pacifica.gitbook.io/docs/api-documentation/api/websocket */
export const PACIFICA_WS_URL = 'wss://ws.pacifica.fi/ws'

export type PacificaMarkPriceCandleData = {
  t: number
  T: number
  s: string
  i: string
  o: string
  c: string
  h: string
  l: string
  v: string
  n: number
}

export function tryParseMarkPriceCandleMessage(raw: string): PacificaMarkPriceCandleData | null {
  try {
    const msg = JSON.parse(raw) as { channel?: string; data?: unknown }
    if (msg.channel !== 'mark_price_candle' || !msg.data || typeof msg.data !== 'object' || msg.data === null) {
      return null
    }
    const d = msg.data as Record<string, unknown>
    if (
      typeof d.o !== 'string' ||
      typeof d.h !== 'string' ||
      typeof d.l !== 'string' ||
      typeof d.c !== 'string' ||
      typeof d.s !== 'string'
    ) {
      return null
    }
    return {
      t: typeof d.t === 'number' ? d.t : 0,
      T: typeof d.T === 'number' ? d.T : 0,
      s: d.s,
      i: typeof d.i === 'string' ? d.i : '',
      o: d.o,
      h: d.h,
      l: d.l,
      c: d.c,
      v: typeof d.v === 'string' ? d.v : '0',
      n: typeof d.n === 'number' ? d.n : 0,
    }
  } catch {
    return null
  }
}

export function linePriceUsdFromMarkOhlc(d: PacificaMarkPriceCandleData): number | null {
  const o = parseFloat(d.o)
  const h = parseFloat(d.h)
  const l = parseFloat(d.l)
  const c = parseFloat(d.c)
  if (![o, h, l, c].every((x) => Number.isFinite(x) && x > 0)) return null

  return (o + h + l + c) / 4
}
