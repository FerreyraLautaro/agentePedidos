CREATE TABLE "stock" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"quantity" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_quantity_non_negative" CHECK ("stock"."quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;