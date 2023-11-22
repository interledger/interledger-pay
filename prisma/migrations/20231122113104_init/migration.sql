-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "continueToken" TEXT NOT NULL,
    "continueUri" TEXT NOT NULL,
    "test" TEXT,
    "processedAt" DATETIME
);
