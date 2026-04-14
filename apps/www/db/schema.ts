import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  address: text('address').notNull(),
  points: jsonb('points').$type<{ price: number; timestamp: number }[]>().notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
})
