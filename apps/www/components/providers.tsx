'use client'

import { env } from '@/env'
import { SOLANA_CONFIG } from '@/lib/solana'
import { PrivyProvider } from '@privy-io/react-auth'
import { SolanaProvider } from '@solana/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export default function Providers({ children }: { children: ReactNode }): ReactNode {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
        clientId={env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
        config={{
          embeddedWallets: {
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
      >
        <SolanaProvider config={SOLANA_CONFIG}>{children}</SolanaProvider>
      </PrivyProvider>
    </QueryClientProvider>
  )
}
