import { faucet } from '@/lib/faucet'
import privy from '@/lib/privy'
import { PublicKey } from '@solana/web3.js'

const MAX_AMOUNT = 20

export async function POST(request: Request) {
  const { wallet_id } = await request.json()

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet) {
    return new Response('Wallet not found', { status: 404 })
  }

  const publicKey = new PublicKey(wallet.address)

  const signature = await faucet(publicKey, MAX_AMOUNT)

  return Response.json({ message: 'USDP faucet', signature }, { status: 200 })
}
