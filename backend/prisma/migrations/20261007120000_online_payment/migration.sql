-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('ONLINE', 'CARD_TO_CARD');
ALTER TABLE "public"."Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'CARD_TO_CARD';
COMMIT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "zarinpalAuthority",
ADD COLUMN     "paymentAuthority" TEXT,
ADD COLUMN     "paymentRefId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentAuthority_key" ON "Order"("paymentAuthority");

