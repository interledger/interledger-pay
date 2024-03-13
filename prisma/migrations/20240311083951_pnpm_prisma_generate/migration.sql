/*
  Warnings:

  - You are about to drop the column `test` on the `Payment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "continueToken" TEXT NOT NULL,
    "continueUri" TEXT NOT NULL,
    "processedAt" DATETIME
);
INSERT INTO "new_Payment" ("continueToken", "continueUri", "id", "processedAt", "quote", "walletAddress") SELECT "continueToken", "continueUri", "id", "processedAt", "quote", "walletAddress" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
