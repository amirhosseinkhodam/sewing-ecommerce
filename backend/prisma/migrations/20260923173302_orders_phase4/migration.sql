-- Phase 4: order history, admin management, card-to-card receipts.
--
-- The shipping address becomes a snapshot on the order (the same way OrderItem
-- already snapshots product data) so that editing or deleting an Address never
-- rewrites the history of an order that already shipped.
--
-- The snapshot columns are NOT NULL in the final schema, so they are added
-- nullable, backfilled from the address each existing order points at, and
-- only then constrained.

-- AlterTable: receipt + nullable snapshot columns
ALTER TABLE "Order" ADD COLUMN     "paymentReceipt" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingFullAddress" TEXT,
ADD COLUMN     "shippingLabel" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingProvince" TEXT;

-- Backfill from the referenced address where it still exists.
UPDATE "Order" o
SET "shippingLabel"       = a."label",
    "shippingProvince"    = a."province",
    "shippingCity"        = a."city",
    "shippingFullAddress" = a."fullAddress",
    "shippingPostalCode"  = a."postalCode",
    "shippingPhone"       = a."phone"
FROM "Address" a
WHERE a."id" = o."shippingAddressId";

-- Any order whose address was already gone keeps a readable placeholder rather
-- than blocking the migration.
UPDATE "Order"
SET "shippingLabel"       = COALESCE("shippingLabel", '—'),
    "shippingProvince"    = COALESCE("shippingProvince", '—'),
    "shippingCity"        = COALESCE("shippingCity", '—'),
    "shippingFullAddress" = COALESCE("shippingFullAddress", '—'),
    "shippingPhone"       = COALESCE("shippingPhone", '—')
WHERE "shippingLabel" IS NULL
   OR "shippingProvince" IS NULL
   OR "shippingCity" IS NULL
   OR "shippingFullAddress" IS NULL
   OR "shippingPhone" IS NULL;

-- Now enforce the constraints.
ALTER TABLE "Order" ALTER COLUMN "shippingLabel" SET NOT NULL,
ALTER COLUMN "shippingProvince" SET NOT NULL,
ALTER COLUMN "shippingCity" SET NOT NULL,
ALTER COLUMN "shippingFullAddress" SET NOT NULL,
ALTER COLUMN "shippingPhone" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
