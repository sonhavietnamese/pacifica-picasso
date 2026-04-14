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
    side?: 'bid' | 'ask'
    reduce_only?: boolean
    stop_price?: string
    limit_price?: string
    amount?: string
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
    type: 'create_stop_order',
  }

  const stop_order: Record<string, string> = {
    stop_price: body.stop_price ?? '48000',
    amount: body.amount ?? '0.1',
  }
  if (body.limit_price !== undefined && body.limit_price !== '') {
    stop_order.limit_price = body.limit_price
  }
  if (body.client_order_id) {
    stop_order.client_order_id = body.client_order_id
  } else {
    stop_order.client_order_id = uuidv4()
  }

  const signaturePayload = {
    symbol: body.symbol ?? 'BTC',
    side: body.side ?? 'bid',
    reduce_only: body.reduce_only ?? false,
    stop_order,
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

  const response = await fetch(PACIFICA_API_ENDPOINTS.CREATE_STOP_ORDER, {
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
