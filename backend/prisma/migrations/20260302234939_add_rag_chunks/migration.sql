-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "unit" TEXT,
    "topic" TEXT,
    "sourceType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DocumentChunk_subject_sourceType_idx" ON "DocumentChunk"("subject", "sourceType");

-- CreateIndex
CREATE INDEX "DocumentChunk_fileName_subject_idx" ON "DocumentChunk"("fileName", "subject");
