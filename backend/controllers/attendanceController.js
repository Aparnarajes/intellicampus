import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { recalculateStudentStats, recalculateBatch } from '../services/analyticsService.js';

/**
 * attendanceController.js — SQL / Prisma Edition (Fixed)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes applied:
 *  1. markAttendance:        upsert (idempotent) + faculty ownership guard
 *  2. markAttendanceBatch:   single-request bulk save with transaction + recalc
 *  3. All reads:             correct relation filters
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Helper — verify faculty owns the subject ─────────────────────────────────
const assertFacultyOwnsSubject = async (userId, subjectId) => {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty profile not found.');

    const mapping = await prisma.facultySubject.findFirst({
        where: { facultyId: faculty.id, subjectId },
    });
    if (!mapping) throw new Error('Access denied: you are not assigned to this subject.');
    return faculty;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/attendance
// @desc    Mark single attendance (idempotent upsert)
// @access  Faculty / Admin
// ─────────────────────────────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
    try {
        const { studentId, subjectId, status, date } = req.body;

        logger.info(`[ATTENDANCE] Mark: student=${studentId} subject=${subjectId} status=${status} date=${date} by=${req.user.id}`);

        // Validate required fields
        if (!studentId || !subjectId || !status || !date) {
            return res.error('studentId, subjectId, status, and date are required.', 400);
        }

        // Faculty ownership check (skip for admin)
        if (req.user.role === 'FACULTY') {
            await assertFacultyOwnsSubject(req.user.id, subjectId);
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Upsert — idempotent, no duplicates
        const attendance = await prisma.attendance.upsert({
            where: {
                studentId_subjectId_date: {
                    studentId,
                    subjectId,
                    date: normalizedDate,
                },
            },
            update: { status: status.toUpperCase() },
            create: {
                studentId,
                subjectId,
                status: status.toUpperCase(),
                date: normalizedDate,
            },
        });

        // Async recalculation — don't block the response
        recalculateStudentStats(studentId).catch(err =>
            logger.error(`[ANALYTICS] Recalc failed: ${err.message}`)
        );

        return res.success(attendance, 'Attendance saved.', 201);
    } catch (error) {
        logger.error(`[ATTENDANCE] markAttendance error: ${error.message}`, { stack: error.stack });
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/attendance/batch
// @desc    Save attendance for entire class in a single transaction
// @access  Faculty / Admin
// Body:    { subjectId, date, records: [{ studentId, status }] }
// ─────────────────────────────────────────────────────────────────────────────
export const markAttendanceBatch = async (req, res) => {
    try {
        const { subjectId, date, records } = req.body;

        logger.info(`[ATTENDANCE] Batch: subject=${subjectId} date=${date} count=${records?.length} by=${req.user.id}`);

        if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
            return res.error('subjectId, date, and records[] are required.', 400);
        }

        // Faculty ownership check
        if (req.user.role === 'FACULTY') {
            await assertFacultyOwnsSubject(req.user.id, subjectId);
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Use a transaction for atomicity — all succeed or none
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return res.error('Subject not found in syllabus.', 404);

        // Fetch student metadata for validation
        const studentIds = records.map(r => r.studentId);
        const validStudents = await prisma.student.findMany({
            where: {
                id: { in: studentIds },
                semester: subject.semester,
                branch: subject.branch
            },
            select: { id: true }
        });

        const validIdSet = new Set(validStudents.map(s => s.id));
        const finalRecords = records.filter(r => validIdSet.has(r.studentId));

        if (finalRecords.length === 0) {
            return res.error('No students found for this subject based on the syllabus alignment.', 400);
        }

        const saved = await prisma.$transaction(
            finalRecords.map(({ studentId, status }) =>
                prisma.attendance.upsert({
                    where: {
                        studentId_subjectId_date: {
                            studentId,
                            subjectId,
                            date: normalizedDate,
                        },
                    },
                    update: { status: status.toUpperCase() },
                    create: {
                        studentId,
                        subjectId,
                        status: status.toUpperCase(),
                        date: normalizedDate,
                    },
                })
            )
        );

        // Recalculate all affected students in background
        recalculateBatch(finalRecords.map(r => r.studentId)).catch(err =>
            logger.error(`[ANALYTICS] Batch recalc failed: ${err.message}`)
        );

        logger.info(`[ATTENDANCE] Batch saved (Syllabus-Verified): ${saved.length} records for subject=${subjectId}`);
        return res.success({ count: saved.length }, `Attendance saved for ${saved.length} students matching the syllabus.`);
        return res.success({ count: saved.length }, `Attendance saved for ${saved.length} students.`);
    } catch (error) {
        logger.error(`[ATTENDANCE] markAttendanceBatch error: ${error.message}`, { stack: error.stack });
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/me
// @desc    Get logged-in student's attendance
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAttendance = async (req, res) => {
    try {
        // Use prismaId from the auth bridge middleware; fallback to email lookup
        let student;
        if (req.user.prismaId) {
            student = await prisma.student.findUnique({ where: { id: req.user.prismaId } });
        }
        if (!student) {
            student = await prisma.student.findUnique({ where: { email: req.user.email } });
        }
        if (!student) return res.error('Student profile not found.', 404);

        const attendance = await prisma.attendance.findMany({
            where: { studentId: student.id },
            include: { subject: true },
            orderBy: { date: 'desc' },
        });

        return res.success(attendance);
    } catch (error) {
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student (faculty/admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const attendance = await prisma.attendance.findMany({
            where: { studentId },
            include: { subject: true },
            orderBy: { date: 'desc' },
        });
        return res.success(attendance);
    } catch (error) {
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/batch
// @desc    Get attendance for a batch/subject (faculty dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const getBatchAttendance = async (req, res) => {
    try {
        const { section, subjectCode } = req.query;

        const attendance = await prisma.attendance.findMany({
            where: {
                student: section ? { section } : undefined,
                subject: subjectCode ? { subjectCode } : undefined,
            },
            include: { student: true, subject: true },
            orderBy: { date: 'desc' },
        });

        return res.success(attendance);
    } catch (error) {
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/session
// @desc    Get all attendance records for a specific date+subject
// ─────────────────────────────────────────────────────────────────────────────
export const getSessionAttendance = async (req, res) => {
    try {
        const { date, subjectCode } = req.query;

        if (!date) return res.error('date is required.', 400);

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const records = await prisma.attendance.findMany({
            where: {
                date: { gte: start, lte: end },
                subject: subjectCode ? { subjectCode } : undefined,
            },
            include: { student: true, subject: true },
        });

        return res.success(records);
    } catch (error) {
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/attendance/dates
// @desc    Get distinct dates that have attendance records
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceDates = async (req, res) => {
    try {
        const { subjectCode } = req.query;

        const groups = await prisma.attendance.groupBy({
            by: ['date'],
            where: {
                subject: subjectCode ? { subjectCode } : undefined,
            },
            _count: { id: true },
            orderBy: { date: 'desc' },
        });

        const formatted = groups.map(g => ({
            _id: g.date.toISOString().split('T')[0],
            count: g._count.id,
        }));

        return res.success(formatted);
    } catch (error) {
        return res.error(error.message, 400);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/attendance/:id
// @desc    Update a single attendance record status
// ─────────────────────────────────────────────────────────────────────────────
export const updateAttendanceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.error('status is required.', 400);

        const record = await prisma.attendance.update({
            where: { id },
            data: { status: status.toUpperCase() },
            include: { student: true, subject: true },
        });

        // Recalculate student stats after update
        recalculateStudentStats(record.studentId).catch(err =>
            logger.error(`[ANALYTICS] Recalc failed: ${err.message}`)
        );

        return res.success(record);
    } catch (error) {
        return res.error(error.message, 400);
    }
};
