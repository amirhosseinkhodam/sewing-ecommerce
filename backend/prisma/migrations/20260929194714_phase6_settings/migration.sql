-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShopSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shopName" TEXT NOT NULL,
    "bankCardNumber" TEXT NOT NULL,
    "bankCardHolder" TEXT NOT NULL,
    "shopPhone" TEXT NOT NULL,
    "shopEmail" TEXT NOT NULL,
    "shopAddress" TEXT NOT NULL,
    "businessHours" TEXT NOT NULL,
    "postPrice" DECIMAL(65,30) NOT NULL,
    "postEtaDays" INTEGER NOT NULL DEFAULT 5,
    "courierPrice" DECIMAL(65,30) NOT NULL,
    "courierEtaDays" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSetting_pkey" PRIMARY KEY ("id")
);
