import { v4 as uuidv4 } from 'uuid'
import privy, { authorizationContext } from '@/lib/privy'
import bs58 from 'bs58'
import { prepareMessage } from '@/lib/utils'
import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'

function tickDecimalPlaces(tickSizeStr: string): number {
  const s = tickSizeStr.trim()
  const i = s.indexOf('.')
  return i >= 0 ? s.length - i - 1 : 0
}

/**
 * Snap a price to the symbol’s `tick_size` (used for both limit and stop strings).
 */
function roundPriceToTick(price: number, tickSizeStr: string): string {
  const tickStr = tickSizeStr.trim()
  const tick = parseFloat(tickStr)
  if (!Number.isFinite(price) || !Number.isFinite(tick) || tick <= 0) {
    return String(price)
  }

  const dp = tickDecimalPlaces(tickStr)
  const scale = 10 ** dp
  const tickInt = Math.round(tick * scale)
  if (tickInt <= 0) return String(price)

  const priceInt = Math.round(price * scale)
  const step = Math.round(priceInt / tickInt)
  const roundedInt = step * tickInt
  const rounded = roundedInt / scale

  if (dp === 0) return String(rounded)
  return rounded.toFixed(dp)
}

/**
 * Stop triggers must sit on the correct side of last/mark or Pacifica rejects with `Invalid stop tick`:
 * - Buy stop (`side: bid`): stop_price must be **above** the reference (price rises into it).
 * - Sell stop (`side: ask`): stop_price must be **below** the reference.
 */
function adjustStopTriggerVsMark(
  stopRoundedStr: string,
  mark: number,
  tickSizeStr: string,
  stopSide: 'bid' | 'ask'
): { price: string; adjusted: boolean } {
  const tick = parseFloat(tickSizeStr.trim())
  const p0 = Number(stopRoundedStr)
  if (!Number.isFinite(mark) || mark <= 0 || !Number.isFinite(tick) || tick <= 0 || !Number.isFinite(p0)) {
    return { price: stopRoundedStr, adjusted: false }
  }

  if (stopSide === 'bid') {
    if (p0 > mark) return { price: stopRoundedStr, adjusted: false }
    let x = mark
    for (let i = 0; i < 500_000; i++) {
      x += tick
      const s = roundPriceToTick(x, tickSizeStr)
      if (Number(s) > mark) return { price: s, adjusted: true }
    }
    return { price: stopRoundedStr, adjusted: false }
  }

  if (p0 < mark) return { price: stopRoundedStr, adjusted: false }
  let x = mark
  for (let i = 0; i < 500_000; i++) {
    x -= tick
    const s = roundPriceToTick(x, tickSizeStr)
    if (Number(s) < mark) return { price: s, adjusted: true }
  }
  return { price: stopRoundedStr, adjusted: false }
}

async function fetchTickSizeForSymbol(symbol: string): Promise<{
  tickSize: string
  minTick: string
  maxTick: string
}> {
  const res = await fetch(PACIFICA_API_ENDPOINTS.GET_INFO, { cache: 'no-store' })
  if (!res.ok) return { tickSize: '0.01', minTick: '0', maxTick: '1000000' }
  const json = (await res.json()) as {
    success?: boolean
    data?: { symbol: string; tick_size: string; min_tick: string; max_tick: string }[]
  }
  const row = json.data?.find((m) => m.symbol === symbol)
  return {
    tickSize: row?.tick_size ?? '0.01',
    minTick: row?.min_tick ?? '0',
    maxTick: row?.max_tick ?? '1000000',
  }
}

/**
 * GTC limit (take-profit): must use `create_order`, not stop — e.g. short TP is a bid **limit**
 * below market; a bid **stop** at that level is invalid (“Invalid stop tick”).
 */
async function createLimitOrder(params: {
  walletId: string
  walletAddress: string
  symbol: string
  side: 'bid' | 'ask'
  reduceOnly: boolean
  price: string
  amount: string
  clientOrderId: string
}) {
  const timestamp = Date.now()

  const signatureHeader = {
    timestamp,
    expiry_window: 5_000,
    type: 'create_order',
  }

  const signaturePayload = {
    symbol: params.symbol,
    side: params.side,
    price: params.price,
    amount: params.amount,
    tif: 'GTC',
    reduce_only: params.reduceOnly,
    client_order_id: params.clientOrderId,
  }

  const message = prepareMessage(signatureHeader, signaturePayload)
  const messageBytes = new TextEncoder().encode(message)

  const { signature: signatureB64 } = await privy.wallets().solana().signMessage(params.walletId, {
    message: messageBytes,
    authorization_context: authorizationContext,
  })

  const signatureBase58 = bs58.encode(Buffer.from(signatureB64, 'base64'))

  const rq = {
    account: params.walletAddress,
    signature: signatureBase58,
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...signaturePayload,
  }

  const response = await fetch(PACIFICA_API_ENDPOINTS.CREATE_ORDER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rq),
  })

  const responseText = await response.text()
  console.log(`Limit order [${params.clientOrderId}] Status: ${response.status}, Response: ${responseText}`)

  try {
    return { data: JSON.parse(responseText), status: response.status }
  } catch {
    return { data: responseText, status: response.status }
  }
}

async function createStopOrder(params: {
  walletId: string
  walletAddress: string
  symbol: string
  side: 'bid' | 'ask'
  reduceOnly: boolean
  stopPrice: string
  amount: string
  clientOrderId: string
}) {
  const timestamp = Date.now()

  const signatureHeader = {
    timestamp,
    expiry_window: 5_000,
    type: 'create_stop_order',
  }

  const stop_order: Record<string, string> = {
    stop_price: params.stopPrice,
    amount: params.amount,
    client_order_id: params.clientOrderId,
  }

  const signaturePayload = {
    symbol: params.symbol,
    side: params.side,
    reduce_only: params.reduceOnly,
    stop_order,
  }

  const message = prepareMessage(signatureHeader, signaturePayload)
  const messageBytes = new TextEncoder().encode(message)

  const { signature: signatureB64 } = await privy.wallets().solana().signMessage(params.walletId, {
    message: messageBytes,
    authorization_context: authorizationContext,
  })

  const signatureBase58 = bs58.encode(Buffer.from(signatureB64, 'base64'))

  const rq = {
    account: params.walletAddress,
    signature: signatureBase58,
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...signaturePayload,
  }

  const response = await fetch(PACIFICA_API_ENDPOINTS.CREATE_STOP_ORDER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rq),
  })

  const responseText = await response.text()
  console.log(`Stop order [${params.clientOrderId}] Status: ${response.status}, Response: ${responseText}`)

  try {
    return { data: JSON.parse(responseText), status: response.status }
  } catch {
    return { data: responseText, status: response.status }
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { walletId, symbol, side, tp, sl, entry, amount, markPrice } = body as {
    walletId?: string
    symbol?: string
    side?: 'bid' | 'ask'
    tp?: number
    sl?: number
    entry?: number
    amount?: string
    /** Live mark / last — used so SL stop trigger is on the valid side of the book vs reference. */
    markPrice?: number
  }

  if (!walletId) {
    return Response.json({ error: 'walletId is required' }, { status: 400 })
  }

  const wallet = await privy.wallets().get(walletId)
  if (!wallet?.address) {
    return Response.json({ error: 'Wallet not found' }, { status: 404 })
  }

  const sym = symbol ?? 'SOL'
  const { tickSize } = await fetchTickSizeForSymbol(sym)

  /** Must match entry default: `side ?? 'bid'`. Otherwise `side` undefined made close side wrong (bid vs ask). */
  const entrySide: 'bid' | 'ask' = side === 'ask' ? 'ask' : 'bid'
  const closeSide: 'bid' | 'ask' = entrySide === 'bid' ? 'ask' : 'bid'

  const entryOrderId = uuidv4()
  const tpOrderId = uuidv4()
  const slOrderId = uuidv4()

  const amt = amount ?? '0.2'

  const entryPx = roundPriceToTick(Number(entry), tickSize)
  const tpPx = roundPriceToTick(Number(tp), tickSize)
  const slPxRaw = roundPriceToTick(Number(sl), tickSize)

  const mark = typeof markPrice === 'number' && Number.isFinite(markPrice) && markPrice > 0 ? markPrice : undefined
  const slAdj = mark
    ? adjustStopTriggerVsMark(slPxRaw, mark, tickSize, closeSide)
    : { price: slPxRaw, adjusted: false }
  const slPx = slAdj.price

  const entryResult = await createStopOrder({
    walletId,
    walletAddress: wallet.address,
    symbol: sym,
    side: entrySide,
    reduceOnly: false,
    stopPrice: entryPx,
    amount: amt,
    clientOrderId: entryOrderId,
  })
  /** Take-profit: limit at TP (same close side as a full exit). Stop triggers are wrong for TP prices on the “limit” side of the book (e.g. short TP below market). */
  const tpResult = await createLimitOrder({
    walletId,
    walletAddress: wallet.address,
    symbol: sym,
    side: closeSide,
    reduceOnly: true,
    price: tpPx,
    amount: amt,
    clientOrderId: tpOrderId,
  })
  const slResult = await createStopOrder({
    walletId,
    walletAddress: wallet.address,
    symbol: sym,
    side: closeSide,
    reduceOnly: true,
    stopPrice: slPx,
    amount: amt,
    clientOrderId: slOrderId,
  })

  return Response.json({
    entry: entryResult,
    /** Take-profit leg uses GTC limit (`create_order`), not stop. */
    tp: tpResult,
    sl: slResult,
    tickSize,
    pricesSent: { entry: entryPx, tp: tpPx, sl: slPx, slAdjustedVsMark: slAdj.adjusted },
    markUsedForSl: mark ?? null,
  })
}
