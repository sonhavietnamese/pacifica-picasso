import { integer, jsonb, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core'

export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  address: text('address').notNull(),
  points: jsonb('points').$type<{ price: number; timestamp: number }[]>().notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const poolOrders = pgTable('pool_orders', {
  id: text('id').primaryKey(),
  lineId: text('line_id').notNull(),
  walletId: text('wallet_id').notNull(),
  symbol: text('symbol').notNull(),
  bias: text('bias').notNull().$type<'LONG' | 'SHORT'>(),
  checkpointIndex: integer('checkpoint_index').notNull(),
  stopPrice: real('stop_price').notNull(),
  tp: real('tp').notNull(),
  sl: real('sl').notNull(),
  clientOrderId: text('client_order_id').notNull().unique(),
  status: text('status').notNull().$type<'pending' | 'active' | 'cancelled' | 'filled'>().default('pending'),
  points: jsonb('points').$type<{ time: number; value: number }[]>().notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
