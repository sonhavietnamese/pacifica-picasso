import privy, { authorizationContext } from '@/lib/privy'
import { v4 as uuidv4 } from 'uuid'
import bs58 from 'bs58'
import { prepareMessage } from '@/lib/utils'
import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'

/** Same as `garden/python-sdk/common/constants.py` testnet base. */

export async function POST(request: Request) {
  const body = (await request.json()) as {
    wallet_id?: string
    symbol?: string
    take_profit_stop_price?: string
    take_profit_limit_price?: string
    stop_loss_stop_price?: string
    stop_loss_limit_price?: string
    amount?: string
    side?: 'bid' | 'ask'
    slippage_percent?: string
    reduce_only?: boolean
    client_order_id?: string
  }

  const { wallet_id } = body
  if (!wallet_id) {
    return Response.json({ error: 'wallet_id is required' }, { status: 400 })
  }

  const wallet = await privy.wallets().get(wallet_id)
  if (!wallet?.address) {
    return new Response('Wallet not found', { status: 404 })
  }

  const timestamp = Date.now()

  const signatureHeader = {
    timestamp,
    expiry_window: 5_000,
    type: 'create_market_order',
  }

  const signaturePayload = {
    symbol: body.symbol ?? 'BTC',
    amount: body.amount ?? '0.001',
    side: body.side ?? 'bid',
    slippage_percent: body.slippage_percent ?? '0.5',
    reduce_only: body.reduce_only ?? false,
    client_order_id: body.client_order_id ?? uuidv4(),
    take_profit: {
      stop_price: body.take_profit_stop_price ?? '80100',
      limit_price: body.take_profit_limit_price ?? '80100',
    },
    stop_loss: {
      stop_price: body.stop_loss_stop_price ?? '79900',
      limit_price: body.stop_loss_limit_price ?? '79900',
    },
  }

  const message = prepareMessage(signatureHeader, signaturePayload)
  const messageBytes = new TextEncoder().encode(message)

  const { signature: signatureB64 } = await privy.wallets().solana().signMessage(wallet_id, {
    message: messageBytes,
    authorization_context: authorizationContext,
  })

  const signatureBase58 = bs58.encode(Buffer.from(signatureB64, 'base64'))

  const rq = {
    account: wallet.address,
    signature: signatureBase58,
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...signaturePayload,
  }

  const response = await fetch(PACIFICA_API_ENDPOINTS.CREATE_MARKET_ORDER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rq),
  })

  const responseText = await response.text()
  console.log(`Status Code: ${response.status}`)
  console.log(`Response: ${responseText}`)
  console.log(`Request: ${JSON.stringify(rq)}`)

  try {
    const data = JSON.parse(responseText) as unknown
    return Response.json(data, { status: response.status })
  } catch {
    return new Response(responseText, { status: response.status })
  }
}
