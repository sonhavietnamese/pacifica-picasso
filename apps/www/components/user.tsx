'use client'

import { env } from '@/env'
import { usePrivy, useSigners } from '@privy-io/react-auth'

export default function User() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { addSigners } = useSigners()

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

  const createOrder = async () => {
    if (!user) return
    if (!user.wallet || !user.wallet.connectorType || user.wallet.connectorType !== 'embedded') return

    const response = await fetch('/api/trades', {
      method: 'POST',
      body: JSON.stringify({
        wallet_id: user.wallet.id,
      }),
    })

    const data = await response.json()
    console.log(data)
  }

  return (
    <main>
      <div>
        <div>Authenticated: {authenticated ? 'Yes' : 'No'}</div>
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
