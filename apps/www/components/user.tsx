'use client'

import { env } from '@/env'
import { useOpenOrders } from '@/hooks/use-open-orders'
import { USDP_MINT } from '@/lib/solana'
import { usePrivy, useSigners } from '@privy-io/react-auth'
import { useSplToken } from '@solana/react-hooks'

export default function User() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { addSigners } = useSigners()

  const { orders } = useOpenOrders(user?.wallet?.address)

  console.log(orders)

  const { balance, refresh, isFetching } = useSplToken(USDP_MINT.toBase58(), {
    owner: user?.wallet?.address,
  })

  if (!ready) return <div>Loading...</div>

  console.log(user)

  const addSigner = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const signer = await addSigners({
      address: user.wallet.address,
      signers: [
        {
          signerId: env.NEXT_PUBLIC_PRIVY_AUTHORIZATION_ID,
        },
      ],
    })
    console.log(signer)
  }

  const signMessage = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/wallets', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
      }),
    })

    const signature = await response.json()
    console.log(signature)
  }

  const faucet = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/faucet', {
      method: 'POST',
      body: JSON.stringify({ wallet_id: user.wallet.id }),
    })

    const data = await response.json()
    console.log(data)

    await refresh()
  }

  const deposit = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/deposit', {
      method: 'POST',
      body: JSON.stringify({ wallet_id: user.wallet.id }),
    })

    const data = await response.json()
    console.log(data)
  }

  const createOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trade/orders/create', {
      method: 'POST',
      body: JSON.stringify({ wallet_id: user.wallet.id }),
    })

    const data = await response.json()
    console.log(data)
  }

  return (
    <main>
      <div className="flex flex-col gap-2">
        <div>
          <div>Authenticated: {authenticated ? 'Yes' : 'No'}</div>
        </div>

        <div>
          <span>{user?.wallet?.address}</span>
        </div>
        <div>USDP: {isFetching ? 'Loading...' : balance?.amount}</div>
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => login()}>
          Login
        </button>
        <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={() => logout()}>
          Logout
        </button>
      </div>

      <div className="flex gap-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={createOrder}>
          CREATE ORDER
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={deposit}>
          DEPOSIT
        </button>
      </div>

      <div className="flex gap-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={faucet}>
          Faucet
        </button>

        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={addSigner}>
          Add Signer
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md" onClick={signMessage}>
          Sign Message
        </button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-md" onClick={createOrder}>
          Create Order
        </button>
      </div>
    </main>
  )
}
