import privy, { authorizationContext } from '@/lib/privy'

export async function POST(request: Request) {
  const { wallet_id } = await request.json()

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet) {
    return new Response('Wallet not found', { status: 404 })
  }

  const response = await privy.wallets().solana().signMessage(wallet_id, {
    message: 'Hello, world!',
    authorization_context: authorizationContext,
  })

  return new Response(response.signature, { status: 200 })
}
