-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetBatch" TEXT NOT NULL DEFAULT 'All',
    "postedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AcademicCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentMemory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "strongSubjects" TEXT NOT NULL,
    "weakSubjects" TEXT NOT NULL,
    "attendanceRiskSubjects" TEXT NOT NULL,
    "topWeakTopics" TEXT NOT NULL,
    "preferredLearningStyle" TEXT NOT NULL DEFAULT 'Theoretical',
    "avgMarks" REAL NOT NULL DEFAULT 0,
    "totalDoubtsSolved" INTEGER NOT NULL DEFAULT 0,
    "dailyStudyHours" INTEGER NOT NULL DEFAULT 2,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("attendanceRiskSubjects", "avgMarks", "id", "lastUpdated", "preferredLearningStyle", "strongSubjects", "studentId", "topWeakTopics", "totalDoubtsSolved", "weakSubjects") SELECT "attendanceRiskSubjects", "avgMarks", "id", "lastUpdated", "preferredLearningStyle", "strongSubjects", "studentId", "topWeakTopics", "totalDoubtsSolved", "weakSubjects" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StudentMemory_studentId_idx" ON "StudentMemory"("studentId");
