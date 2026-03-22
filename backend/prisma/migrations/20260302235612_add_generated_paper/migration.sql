-- CreateTable
CREATE TABLE "GeneratedPaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectTitle" TEXT,
    "unit" TEXT NOT NULL,
    "semester" TEXT,
    "questions" TEXT NOT NULL,
    "maxMarks" INTEGER,
    "totalTime" INTEGER,
    "questionCount" INTEGER,
    "difficulty" TEXT,
    "performanceSnapshot" TEXT,
    "difficultyProfile" TEXT,
    "generationMode" TEXT NOT NULL DEFAULT 'adaptive',
    "contentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedPaper_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GeneratedPaper_studentId_subjectCode_unit_idx" ON "GeneratedPaper"("studentId", "subjectCode", "unit");
