import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '@/env'

config({ path: '.env' }) // or .env.local

export const db = drizzle(env.DATABASE_URL)
