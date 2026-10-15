-- Phone replaces email as the login identifier.
DROP INDEX "User_email_key";
ALTER TABLE "User" DROP COLUMN "email";

UPDATE "ContactMessage" SET "phone" = '' WHERE "phone" IS NULL;
ALTER TABLE "ContactMessage" DROP COLUMN "email";
ALTER TABLE "ContactMessage" ALTER COLUMN "phone" SET NOT NULL;
