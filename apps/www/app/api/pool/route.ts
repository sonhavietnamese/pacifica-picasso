import { db } from '@/db/drizzle'
import { poolOrders } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

export type PoolCheckpoint = {
  index: number
  time: number
  value: number
}

type PoolRequestBody = {
  lineId: string
  walletId: string
  symbol: string
  bias: 'LONG' | 'SHORT'
  checkpoints: PoolCheckpoint[]
  tp: number
  sl: number
  amount: string
  points: { time: number; value: number }[]
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(2)
}

export async function POST(request: Request) {
  const body = (await request.json()) as PoolRequestBody
  const { lineId, walletId, symbol, bias, checkpoints, tp, sl, amount, points } = body

  if (!lineId || !walletId || !symbol || !bias || !checkpoints?.length) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const side = bias === 'LONG' ? 'bid' : 'ask'
  const total = parseFloat(amount) || 0
  // const perOrderAmount = checkpoints.length > 0 ? (total / checkpoints.length).toFixed(8) : amount
  const perOrderAmount = '0.2'
  const tpStr = formatPrice(tp)
  const slStr = formatPrice(sl)

  const orders: {
    checkpointIndex: number
    clientOrderId: string
    limitPrice: number
    response: unknown
    ok: boolean
  }[] = []

  for (const cp of checkpoints) {
    const clientOrderId = uuidv4()
    const priceStr = formatPrice(cp.value)

    const createRes = await fetch(`${origin}/api/trade/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_id: walletId,
        symbol,
        side,
        reduce_only: false,
        price: priceStr,
        amount: perOrderAmount,
        tif: 'GTC',
        client_order_id: clientOrderId,
        take_profit_stop_price: tpStr,
        take_profit_limit_price: tpStr,
        stop_loss_stop_price: slStr,
        stop_loss_limit_price: slStr,
      }),
    })

    const createData = await parseJsonResponse(createRes)
    const ok = createRes.ok

    orders.push({
      checkpointIndex: cp.index,
      clientOrderId,
      limitPrice: cp.value,
      response: createData,
      ok,
    })

    if (ok) {
      await db.insert(poolOrders).values({
        id: clientOrderId,
        lineId,
        walletId,
        symbol,
        bias,
        checkpointIndex: cp.index,
        stopPrice: cp.value,
        tp,
        sl,
        clientOrderId,
        status: 'active',
        points,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }
  }

  const allOk = orders.every((o) => o.ok)
  return Response.json({
    success: allOk,
    lineId,
    orders,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineId = searchParams.get('lineId')

  if (!lineId) {
    return Response.json({ error: 'lineId is required' }, { status: 400 })
  }

  const orders = await db
    .select()
    .from(poolOrders)
    .where(and(eq(poolOrders.lineId, lineId), eq(poolOrders.status, 'active')))

  return Response.json({ orders })
}
