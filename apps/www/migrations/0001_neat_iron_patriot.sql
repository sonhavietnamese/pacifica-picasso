CREATE TABLE "pool_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"line_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"symbol" text NOT NULL,
	"bias" text NOT NULL,
	"checkpoint_index" integer NOT NULL,
	"stop_price" real NOT NULL,
	"tp" real NOT NULL,
	"sl" real NOT NULL,
	"client_order_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"points" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pool_orders_client_order_id_unique" UNIQUE("client_order_id")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"points" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "todo" CASCADE;