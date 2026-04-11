'use client'

import { cn } from '@/lib/utils'
import { useLogin, usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'

interface ConnectButtonProps {
  className?: string
}

export default function ConnectButton({ className }: ConnectButtonProps) {
  const { authenticated } = usePrivy()
  const { login } = useLogin()

  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowButton(!authenticated)
  }, [authenticated])

  const handleLogin = async () => {
    login()
  }

  return showButton ? (
    <button
      className={cn('bg-primary text-white font-druk text-lg p-4 px-6 rounded-[14px] leading-none', className)}
      onClick={handleLogin}
    >
      Connect Wallet
    </button>
  ) : null
}
