import privy, { authorizationContext } from '@/lib/privy'
import { v4 as uuidv4 } from 'uuid'
import bs58 from 'bs58'

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: Record<string, unknown> = {}
    for (const key of sortedKeys) {
      sortedObj[key] = sortJsonKeys(obj[key])
    }
    return sortedObj
  }
  return value
}

const API_BASE = 'https://api.pacifica.fi/api/v1'
const API_URL = `${API_BASE}/orders/create`

export async function POST(request: Request) {
  const { wallet_id } = await request.json()

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet) {
    return new Response('Wallet not found', { status: 404 })
  }

  const operationData = {
    symbol: 'BTC',
    price: '100000',
    amount: '0.1',
    side: 'bid',
    tif: 'GTC',
    reduce_only: false,
    client_order_id: uuidv4(),
  }

  const operationType = 'create_order'
  const timestamp = Math.floor(Date.now() / 1000)

  const signatureHeader = {
    timestamp: timestamp,
    expiry_window: 5_000,
    type: operationType,
  }

  const dataToSign = {
    ...signatureHeader,
    data: operationData,
  }

  const sortedMessage = sortJsonKeys(dataToSign)
  const compactJson = JSON.stringify(sortedMessage)
  const messageBytes = new TextEncoder().encode(compactJson)

  /**
   * Privy `signMessage` treats string `message` as *already base64-encoded*.
   * Pass UTF-8 bytes so the canonical JSON is signed correctly.
   */
  const signature = await privy.wallets().solana().signMessage(wallet_id, {
    message: messageBytes,
    authorization_context: authorizationContext,
  })

  const sigBytes = Buffer.from(signature.signature, 'base64')
  const signatureBase58 = bs58.encode(sigBytes)

  const finalRequest = {
    account: wallet.address,
    agent_wallet: null,
    signature: signatureBase58,
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...operationData,
  }

  const headers = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(finalRequest),
  })

  const responseText = await response.text()
  console.log(`Status Code: ${response.status}`)
  console.log(`Response: ${responseText}`)
  console.log(`Request: ${JSON.stringify(finalRequest)}`)

  try {
    const data = JSON.parse(responseText) as unknown
    return Response.json(data, { status: response.status })
  } catch {
    return new Response(responseText, { status: response.status })
  }
}
