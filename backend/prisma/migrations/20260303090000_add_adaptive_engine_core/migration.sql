-- Adaptive Assessment Engine Core Tables
-- Prisma migration (SQLite)

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "bloomLevel" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "optionsJson" TEXT,
    "answerKey" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentTopicPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "accuracyPercentage" REAL NOT NULL DEFAULT 0,
    "weakFlag" BOOLEAN NOT NULL DEFAULT false,
    "averageResponseTime" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentTopicPerformance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentTopicPerformance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionPaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "studentId" TEXT,
    "examType" TEXT NOT NULL,
    "adaptiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "seed" TEXT,
    "totalMarks" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "lockedAt" DATETIME,
    "difficultyProfileJson" TEXT NOT NULL,
    "bloomProfileJson" TEXT NOT NULL,
    "topicProfileJson" TEXT,
    "constraintsJson" TEXT,
    "contentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionPaper_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionPaper_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionPaper_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuestionPaperItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionPaperItem_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "QuestionPaper" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionPaperItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentQuestionAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "paperId" TEXT,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN,
    "responseTimeMs" INTEGER,
    CONSTRAINT "StudentQuestionAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentQuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentQuestionAttempt_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "QuestionPaper" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperGenerationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "adaptiveEnabled" BOOLEAN NOT NULL,
    "seed" TEXT,
    "requestMetaJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaperGenerationLog_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "QuestionPaper" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaperGenerationLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes: Question
CREATE INDEX "Question_subjectId_unit_idx" ON "Question"("subjectId", "unit");
CREATE INDEX "Question_subjectId_topic_idx" ON "Question"("subjectId", "topic");
CREATE INDEX "Question_subjectId_difficulty_idx" ON "Question"("subjectId", "difficulty");
CREATE INDEX "Question_subjectId_bloomLevel_idx" ON "Question"("subjectId", "bloomLevel");
CREATE INDEX "Question_subjectId_marks_idx" ON "Question"("subjectId", "marks");

-- Indexes/uniques: StudentTopicPerformance
CREATE UNIQUE INDEX "StudentTopicPerformance_studentId_subjectId_topic_key" ON "StudentTopicPerformance"("studentId", "subjectId", "topic");
CREATE INDEX "StudentTopicPerformance_studentId_subjectId_idx" ON "StudentTopicPerformance"("studentId", "subjectId");
CREATE INDEX "StudentTopicPerformance_subjectId_topic_idx" ON "StudentTopicPerformance"("subjectId", "topic");

-- Indexes: QuestionPaper
CREATE INDEX "QuestionPaper_subjectId_createdAt_idx" ON "QuestionPaper"("subjectId", "createdAt");
CREATE INDEX "QuestionPaper_studentId_createdAt_idx" ON "QuestionPaper"("studentId", "createdAt");

-- Uniques/indexes: QuestionPaperItem
CREATE UNIQUE INDEX "QuestionPaperItem_paperId_questionId_key" ON "QuestionPaperItem"("paperId", "questionId");
CREATE UNIQUE INDEX "QuestionPaperItem_paperId_order_key" ON "QuestionPaperItem"("paperId", "order");
CREATE INDEX "QuestionPaperItem_questionId_idx" ON "QuestionPaperItem"("questionId");

-- Indexes: StudentQuestionAttempt
CREATE INDEX "StudentQuestionAttempt_studentId_attemptedAt_idx" ON "StudentQuestionAttempt"("studentId", "attemptedAt");
CREATE INDEX "StudentQuestionAttempt_studentId_questionId_idx" ON "StudentQuestionAttempt"("studentId", "questionId");
CREATE INDEX "StudentQuestionAttempt_questionId_idx" ON "StudentQuestionAttempt"("questionId");

-- Indexes: PaperGenerationLog
CREATE INDEX "PaperGenerationLog_actorUserId_createdAt_idx" ON "PaperGenerationLog"("actorUserId", "createdAt");
CREATE INDEX "PaperGenerationLog_subjectId_createdAt_idx" ON "PaperGenerationLog"("subjectId", "createdAt");

