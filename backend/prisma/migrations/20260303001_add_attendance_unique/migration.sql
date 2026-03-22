-- Step 1: Remove duplicate Attendance rows, keeping only the most recent one
-- per (studentId, subjectId, date) combination.
DELETE FROM "Attendance"
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY studentId, subjectId, date
                   ORDER BY updatedAt DESC, createdAt DESC
               ) AS rn
        FROM "Attendance"
    ) ranked
    WHERE rn = 1
);

-- Step 2: Now safely create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_subjectId_date_key" 
ON "Attendance"("studentId", "subjectId", "date");
