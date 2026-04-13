import { buildPacificaDepositTransaction } from '@/lib/pacifica-deposit'
import privy, { authorizationContext } from '@/lib/privy'
import { connection } from '@/lib/solana'
import { PublicKey } from '@solana/web3.js'

const DEFAULT_DEPOSIT_AMOUNT = 20
const SOLANA_DEVNET_CAIP2 = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'

export async function POST(request: Request) {
  const body = (await request.json()) as { wallet_id?: string; amount?: number }
  const { wallet_id, amount: amountRaw } = body

  if (!wallet_id) {
    return Response.json({ error: 'wallet_id is required' }, { status: 400 })
  }

  const wallet = await privy.wallets().get(wallet_id)

  if (!wallet || !wallet.address) {
    return new Response('Wallet not found', { status: 404 })
  }

  const amount = typeof amountRaw === 'number' && Number.isFinite(amountRaw) ? amountRaw : DEFAULT_DEPOSIT_AMOUNT

  const { transaction } = await buildPacificaDepositTransaction(new PublicKey(wallet.address), amount)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = new PublicKey(wallet.address)

  const serializedTx = transaction
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64')

  const { hash } = await privy.wallets().solana().signAndSendTransaction(wallet_id, {
    caip2: SOLANA_DEVNET_CAIP2,
    transaction: serializedTx,
    authorization_context: authorizationContext,
  })

  return Response.json({ hash }, { status: 200 })
}
