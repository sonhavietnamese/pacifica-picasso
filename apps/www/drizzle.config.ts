import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { env } from './env'

config({ path: '.env' })

export default defineConfig({
  schema: './db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
