import { AuthorizationContext, PrivyClient } from '@privy-io/node'

const privy = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '',
  appSecret: process.env.PRIVY_APP_SECRET ?? '',
})

export const authorizationContext: AuthorizationContext = {
  authorization_private_keys: [process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY ?? ''],
}

export default privy
