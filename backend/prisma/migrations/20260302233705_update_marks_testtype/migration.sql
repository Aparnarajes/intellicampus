/*
  Warnings:

  - You are about to drop the column `assignmentMarks` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `finalMarks` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `internal1` on the `Marks` table. All the data in the column will be lost.
  - You are about to drop the column `internal2` on the `Marks` table. All the data in the column will be lost.
  - Added the required column `marks` to the `Marks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testType` to the `Marks` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "marks" REAL NOT NULL,
    "maxMarks" REAL DEFAULT 50,
    "grade" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Marks" ("createdAt", "grade", "id", "studentId", "subjectId", "updatedAt") SELECT "createdAt", "grade", "id", "studentId", "subjectId", "updatedAt" FROM "Marks";
DROP TABLE "Marks";
ALTER TABLE "new_Marks" RENAME TO "Marks";
CREATE UNIQUE INDEX "Marks_studentId_subjectId_testType_key" ON "Marks"("studentId", "subjectId", "testType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
