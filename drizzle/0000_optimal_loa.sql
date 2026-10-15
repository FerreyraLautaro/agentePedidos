CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_price_non_negative" CHECK ("products"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");