import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * analyticsService.js — Centralized Post-Write Recalculation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Called after any attendance or marks write to keep student dashboard fields
 * (overallAttendancePercentage, overallGpa, riskFlag) in sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Recalculate and persist all derived stats for a student.
 * Safe to call after any attendance or marks mutation.
 *
 * @param {string} studentId - Prisma Student.id
 * @returns {Promise<{attendance, gpa, riskFlag}>}
 */
export const recalculateStudentStats = async (studentId) => {
    try {
        // ── 1. Attendance % ───────────────────────────────────────────────────
        const [totalRecords, presentRecords] = await Promise.all([
            prisma.attendance.count({ where: { studentId } }),
            prisma.attendance.count({ where: { studentId, status: 'PRESENT' } }),
        ]);

        const attendancePct = totalRecords > 0
            ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10
            : 0;

        // ── 2. GPA from Evaluations ───────────────────────────────────────────
        const allEvals = await prisma.evaluation.findMany({ where: { studentId } });

        let gpa = 0;
        if (allEvals.length > 0) {
            const totalScore = allEvals.reduce((sum, ev) => sum + ev.totalMarks, 0);
            const avgScore = totalScore / allEvals.length;
            // Map percentage to 10-point GPA scale
            if (avgScore >= 90) gpa = 10;
            else if (avgScore >= 80) gpa = 9;
            else if (avgScore >= 70) gpa = 8;
            else if (avgScore >= 60) gpa = 7;
            else if (avgScore >= 50) gpa = 6;
            else if (avgScore >= 40) gpa = 5;
            else gpa = 4;
        }

        // ── 3. Risk Flag ──────────────────────────────────────────────────────
        // Risk = attendance below 75% OR GPA below 5
        const riskFlag = attendancePct < 75 || gpa < 5;

        // ── 4. Persist ────────────────────────────────────────────────────────
        await prisma.student.update({
            where: { id: studentId },
            data: {
                overallAttendancePercentage: attendancePct,
                overallGpa: gpa,
                riskFlag,
            },
        });

        logger.info(`[ANALYTICS] Student ${studentId} recalculated: att=${attendancePct}%, gpa=${gpa}, risk=${riskFlag}`);

        return { attendance: attendancePct, gpa, riskFlag };
    } catch (error) {
        // Non-fatal — log but don't crash the parent request
        logger.error(`[ANALYTICS] recalculateStudentStats failed for ${studentId}: ${error.message}`);
        return null;
    }
};

/**
 * Bulk recalculate for a list of student IDs (e.g., after batch attendance save).
 * Runs recalculations in parallel with a concurrency cap.
 *
 * @param {string[]} studentIds
 */
export const recalculateBatch = async (studentIds) => {
    const unique = [...new Set(studentIds)];
    // Run in chunks of 10 to avoid DB overload
    const CHUNK = 10;
    for (let i = 0; i < unique.length; i += CHUNK) {
        const chunk = unique.slice(i, i + CHUNK);
        await Promise.all(chunk.map(id => recalculateStudentStats(id)));
    }
};

/**
 * Faculty workload summary (used by faculty dashboard).
 *
 * @param {string} facultyId - Prisma Faculty.id
 */
export const getFacultyWorkloadSummary = async (facultyId) => {
    const mappings = await prisma.facultySubject.findMany({
        where: { facultyId },
        include: { subject: true },
    });

    const subjectIds = mappings.map(m => m.subjectId);

    const [totalStudents, attendanceToday, evaluationCount] = await Promise.all([
        prisma.student.count({
            where: {
                evaluations: { some: { subjectId: { in: subjectIds } } },
            },
        }),
        prisma.attendance.count({
            where: {
                subjectId: { in: subjectIds },
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
        }),
        prisma.evaluation.count({
            where: { subjectId: { in: subjectIds } },
        }),
    ]);

    return { totalSubjects: mappings.length, totalStudents, attendanceToday, evaluationCount };
};
