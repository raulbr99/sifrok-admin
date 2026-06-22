-- ===========================================================================
-- Cutover Gelato -> Printful  (DB Postgres COMPARTIDA con la tienda)
-- ===========================================================================
-- Hallazgo: esta DB la gestiona el proyecto principal (storefront). La tabla
-- "Order" YA es Printful-pura (tiene printfulOrderId/printfulStatus/tracking*,
-- sin columnas gelato*). Pero "ProductMapping" y "WebhookLog" (tablas propias
-- del panel admin) NO existen aquí. Por eso el handoff de pedidos y el logging
-- de webhooks nunca funcionaron contra esta DB.
--
-- NO uses `prisma db push`: intentaría reconciliar TODO el schema del admin
-- contra una DB que pertenece al storefront (podría alterar/borrar columnas de
-- Order/User/Product, etc.). Aplica solo este SQL, que es ADITIVO: crea las 2
-- tablas que faltan y no toca ninguna tabla de la tienda.

-- Mapeo producto local -> variante Printful (incluye printfulSyncVariantId).
CREATE TABLE IF NOT EXISTS "ProductMapping" (
  "id"                    TEXT PRIMARY KEY,
  "localProductId"        TEXT NOT NULL,
  "printfulSyncVariantId" INTEGER,
  "productName"           TEXT NOT NULL,
  "basePrice"             DOUBLE PRECISION NOT NULL,
  "salePrice"             DOUBLE PRECISION NOT NULL,
  "category"              TEXT,
  "placements"            TEXT,
  "createdAt"             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductMapping_localProductId_key"
  ON "ProductMapping" ("localProductId");

-- Log de webhooks (Stripe / Printful).
CREATE TABLE IF NOT EXISTS "WebhookLog" (
  "id"        TEXT PRIMARY KEY,
  "source"    TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload"   TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "error"     TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Nota: las columnas Order.productionCost / stripeFee / netProfit que usa la
-- pestaña de Rentabilidad tampoco existen en la "Order" real. Si quieres esa
-- feature, descomenta (aditivo, modifica una tabla de la tienda -> revisa):
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "productionCost" DOUBLE PRECISION;
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeFee"      DOUBLE PRECISION;
-- ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "netProfit"      DOUBLE PRECISION;
