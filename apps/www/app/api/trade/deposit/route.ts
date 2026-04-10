import { buildPacificaDepositTransaction } from '@/lib/pacifica-deposit'
import privy from '@/lib/privy'
import { connection } from '@/lib/solana'
import { PublicKey } from '@solana/web3.js'

const DEFAULT_DEPOSIT_AMOUNT = 15

export async function POST(request: Request) {
  const body = (await request.json()) as { wallet_id?: string; amount?: number }
  const { wallet_id, amount: amountRaw } = body

  if (!wallet_id) {
    return Response.json({ error: 'wallet_id is required' }, { status: 400 })
  }

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet) {
    return new Response('Wallet not found', { status: 404 })
  }

  const amount = typeof amountRaw === 'number' && Number.isFinite(amountRaw) ? amountRaw : DEFAULT_DEPOSIT_AMOUNT

  const { transaction } = await buildPacificaDepositTransaction(new PublicKey(wallet.address), amount)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  // sign with privy
  const signature = await privy.wallets().solana().signTransaction(wallet_id, {
    transaction: transaction.serialize(),
  })

  console.log('signature', signature)

  return Response.json({ signature }, { status: 200 })
}
