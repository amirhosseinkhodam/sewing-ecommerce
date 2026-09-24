-- Cancellation restores stock to the exact variant, so the order item needs to
-- remember which one it came from. `size` alone is ambiguous: ProductVariant
-- has no unique constraint on (productId, size).

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variantId" TEXT;

-- Backfill existing rows by (productId, size). Where that pair is ambiguous or
-- the variant no longer exists, variantId stays NULL and the service falls back
-- to matching on (productId, size).
UPDATE "OrderItem" oi
SET "variantId" = v."id"
FROM "ProductVariant" v
WHERE v."productId" = oi."productId"
  AND v."size" = oi."size"
  AND (
    SELECT count(*) FROM "ProductVariant" v2
    WHERE v2."productId" = oi."productId" AND v2."size" = oi."size"
  ) = 1;

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");
