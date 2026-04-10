import privy from '@/lib/privy'

export async function POST(request: Request) {
  const { wallet_id } = await request.json()
  if (!wallet_id) {
    return new Response('Wallet ID is required', { status: 400 })
  }

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet) {
    return new Response('Wallet not found', { status: 404 })
  }
}
