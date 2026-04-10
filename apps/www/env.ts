import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod'

export const env = createEnv({
  server: {
    PRIVY_APP_SECRET: z.string().min(1),
    PRIVY_AUTHORIZATION_PRIVATE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
    NEXT_PUBLIC_PRIVY_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_PRIVY_AUTHORIZATION_ID: z.string().min(1),
  },
  runtimeEnv: {
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
    PRIVY_AUTHORIZATION_PRIVATE_KEY: process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY,

    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_PRIVY_CLIENT_ID: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID,
    NEXT_PUBLIC_PRIVY_AUTHORIZATION_ID: process.env.NEXT_PUBLIC_PRIVY_AUTHORIZATION_ID,
  },
})
