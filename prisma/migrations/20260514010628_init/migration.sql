-- CreateTable
CREATE TABLE "Analyzer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectType" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "scale" TEXT NOT NULL,
    "languages" TEXT[],
    "priorities" TEXT[],
    "description" TEXT,
    "signals" JSONB NOT NULL,

    CONSTRAINT "Analyzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StackResult" (
    "id" TEXT NOT NULL,
    "analyzerId" TEXT NOT NULL,
    "stackKey" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "githubData" JSONB,
    "npmData" JSONB,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StackResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StackResult_stackKey_idx" ON "StackResult"("stackKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiCache_key_key" ON "ApiCache"("key");

-- CreateIndex
CREATE INDEX "ApiCache_key_idx" ON "ApiCache"("key");

-- AddForeignKey
ALTER TABLE "StackResult" ADD CONSTRAINT "StackResult_analyzerId_fkey" FOREIGN KEY ("analyzerId") REFERENCES "Analyzer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
