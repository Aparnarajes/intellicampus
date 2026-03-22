import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import { recalculateStudentStats } from '../services/analyticsService.js';

/**
 * facultyController.js — Fixed & Production-Ready
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes applied:
 *  1. getStudentsBySubject: corrected join path (FacultySubject → Student)
 *  2. createAssignment:     auto-creates NOT_SUBMITTED rows for all enrolled students
 *  3. gradeAssignment:      new endpoint to grade a submission
 *  4. markAttendance:       deprecated in favour of attendanceController batch endpoint
 *  5. updateMarks:          deprecated in favour of marksController saveMarks endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/subjects
// @desc    Get subjects assigned to the logged-in faculty
// ─────────────────────────────────────────────────────────────────────────────
export const getMySubjects = async (req, res) => {
    try {
        const faculty = await prisma.faculty.findUnique({
            where: { userId: req.user.id },
            include: {
                facultySubjects: {
                    include: { subject: true },
                },
            },
        });

        if (!faculty) return res.error('Faculty profile not found.', 404);

        const subjects = faculty.facultySubjects.map(fs => ({
            id: fs.id,
            subjectId: fs.subject.id,
            subjectName: fs.subject.subjectName,
            subjectCode: fs.subject.subjectCode,
            section: fs.section,
            semester: fs.subject.semester,
            branch: fs.subject.branch,
        }));

        logger.info(`[FACULTY] getMySubjects: ${subjects.length} subjects for faculty=${faculty.id}`);
        return res.success(subjects);
    } catch (error) {
        logger.error(`[FACULTY] getMySubjects error: ${error.message}`);
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/students
// @desc    Get all students (global list for faculty)
// ─────────────────────────────────────────────────────────────────────────────
export const getStudents = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            orderBy: { fullName: 'asc' },
        });

        const mapped = students.map(s => ({
            ...s,
            _id: s.id,
            name: s.fullName,
            batch: s.section,
        }));

        return res.success(mapped);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/students-by-subject
// @desc    Get students enrolled in a specific subject+section
// @query   subjectCode, section
// ─────────────────────────────────────────────────────────────────────────────
export const getStudentsBySubject = async (req, res) => {
    try {
        const { subjectCode, section } = req.query;

        if (!subjectCode) {
            return res.error('subjectCode is required.', 400);
        }

        // 1. Get detailed subject info (the "Syllabus" base)
        const subject = await prisma.subject.findUnique({ 
            where: { subjectCode },
            include: { assignments: true }
        });
        if (!subject) {
            return res.error('No subjects found for this subject based on the syllabus.', 404);
        }

        // Calculate 2-month date range
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // 2. Fetch all students belonging to the semester and branch defined by the syllabus
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                branch: subject.branch,
                ...(section ? { section } : {}),
            },
            include: {
                attendance: {
                    where: {
                        subjectId: subject.id,
                        date: { gte: twoMonthsAgo }
                    }
                },
                evaluations: {
                    where: { subjectId: subject.id }
                },
                submissions: {
                    where: { assignment: { subjectId: subject.id } }
                }
            },
            orderBy: { fullName: 'asc' },
        });

        if (students.length === 0) {
            return res.success([], 'No students found for this subject based on the syllabus.');
        }

        // 3. Map students with required academic metrics
        const mapped = students.map(s => {
            // Calculate Subject Attendance % for last 2 months
            const totalClasses = s.attendance.length;
            const presentClasses = s.attendance.filter(a => a.status === 'PRESENT').length;
            const attendPercent = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

            const ev = s.evaluations[0] || {};
            
            return {
                studentId: s.usn,
                registrationNumber: s.registrationNumber || s.usn,
                name: s.fullName,
                semester: s.semester,
                subject: subject.subjectName,
                cgpa: s.overallGpa || 'N/A',
                attendancePercentage: attendPercent.toFixed(1) + '%',
                
                // Detailed Marks Distribution
                ia1: ev.ia1Marks || 0,
                ia2: ev.ia2Marks || 0,
                assignment: ev.assignmentMarks || 0,
                quiz: ev.quizMarks || 0,
                demo: ev.demoMarks || 0,
                viva: ev.vivaMarks || 0,
                project: ev.miniProjectMarks || 0,
                projectReview: ev.projectReviewMarks || 0,
                
                totalMarks: ev.totalMarks || 0,
                grade: ev.grade || '-',
                remarks: ev.remarks || '',
                
                _id: s.id // kept for backend actions
            };
        });

        logger.info(`[FACULTY] getStudentsBySubject (Syllabus-drive): subject=${subjectCode} → ${mapped.length} students enrolled.`);
        return res.success(mapped);
    } catch (error) {
        logger.error(`[FACULTY] getStudentsBySubject error: ${error.message}`);
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/attendance/dates
// @desc    Get dates that have attendance records (optionally filtered by subject)
// ─────────────────────────────────────────────────────────────────────────────
export const getAttendanceDates = async (req, res) => {
    try {
        const { subjectCode } = req.query;

        const groups = await prisma.attendance.groupBy({
            by: ['date'],
            where: {
                subject: subjectCode ? { subjectCode } : undefined,
            },
            _count: { studentId: true },
            orderBy: { date: 'desc' },
        });

        const mapped = groups.map(d => ({
            _id: d.date.toISOString().split('T')[0],
            count: d._count.studentId,
        }));

        return res.success(mapped);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/attendance/session
// @desc    Get attendance records for a specific date + subject
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
            include: { student: true },
        });

        const mapped = records.map(r => ({
            ...r,
            _id: r.id,
            student: { ...r.student, name: r.student.fullName },
        }));

        return res.success(mapped);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/faculty/attendance/:id
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
            include: { student: true },
        });

        recalculateStudentStats(record.studentId).catch(err =>
            logger.error(`[ANALYTICS] Recalc failed: ${err.message}`)
        );

        return res.success(record);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/faculty/assignments
// @desc    Create assignment + auto-create NOT_SUBMITTED rows for all students
// ─────────────────────────────────────────────────────────────────────────────
export const createAssignment = async (req, res) => {
    try {
        const { subjectId, title, dueDate, section } = req.body;

        if (!subjectId || !title || !dueDate) {
            return res.error('subjectId, title, and dueDate are required.', 400);
        }

        // Verify subject exists
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return res.error('Subject not found.', 404);

        // Get all students in this subject's semester+branch+section
        const students = await prisma.student.findMany({
            where: {
                semester: subject.semester,
                branch: subject.branch,
                ...(section ? { section } : {}),
            },
            select: { id: true },
        });

        // Create assignment + submissions in a transaction
        const assignment = await prisma.$transaction(async (tx) => {
            const a = await tx.assignment.create({
                data: {
                    subjectId,
                    title,
                    dueDate: new Date(dueDate),
                },
            });

            // Auto-create NOT_SUBMITTED rows for all students
            if (students.length > 0) {
                await tx.assignmentSubmission.createMany({
                    data: students.map(s => ({
                        assignmentId: a.id,
                        studentId: s.id,
                        submissionStatus: 'NOT_SUBMITTED',
                    })),
                    skipDuplicates: true,
                });
            }

            return a;
        });

        logger.info(`[FACULTY] Assignment created: "${title}" for subject=${subjectId}, auto-enrolled ${students.length} students`);
        return res.success({ assignment, enrolledStudents: students.length }, 'Assignment created.', 201);
    } catch (error) {
        logger.error(`[FACULTY] createAssignment error: ${error.message}`);
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/faculty/assignments/:assignmentId/grade/:studentId
// @desc    Grade a student's assignment submission
// Body:    { marksAwarded, submissionStatus }
// ─────────────────────────────────────────────────────────────────────────────
export const gradeAssignment = async (req, res) => {
    try {
        const { assignmentId, studentId } = req.params;
        const { marksAwarded, submissionStatus } = req.body;

        if (marksAwarded === undefined) {
            return res.error('marksAwarded is required.', 400);
        }

        // Upsert — create if not exists, update if exists
        const submission = await prisma.assignmentSubmission.upsert({
            where: {
                assignmentId_studentId: { assignmentId, studentId },
            },
            update: {
                marksAwarded: Number(marksAwarded),
                submissionStatus: submissionStatus || 'SUBMITTED',
            },
            create: {
                assignmentId,
                studentId,
                marksAwarded: Number(marksAwarded),
                submissionStatus: submissionStatus || 'SUBMITTED',
            },
        });

        logger.info(`[FACULTY] Assignment graded: assignment=${assignmentId} student=${studentId} marks=${marksAwarded}`);
        return res.success(submission, 'Assignment graded successfully.');
    } catch (error) {
        logger.error(`[FACULTY] gradeAssignment error: ${error.message}`);
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/faculty/assignments/:assignmentId/submissions
// @desc    Get all submissions for an assignment
// ─────────────────────────────────────────────────────────────────────────────
export const getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const submissions = await prisma.assignmentSubmission.findMany({
            where: { assignmentId },
            include: {
                student: { select: { id: true, fullName: true, usn: true, section: true } },
                assignment: { select: { title: true, dueDate: true } },
            },
            orderBy: { student: { fullName: 'asc' } },
        });

        return res.success(submissions);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED — kept for backward compatibility, proxies to batch endpoint advice
// @route   POST /api/faculty/attendance  (single record)
// ─────────────────────────────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
    try {
        const { studentId, subjectId, date, status } = req.body;

        if (!studentId || !subjectId || !date || !status) {
            return res.error('studentId, subjectId, date, and status are required.', 400);
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.upsert({
            where: {
                studentId_subjectId_date: { studentId, subjectId, date: normalizedDate },
            },
            update: { status: status.toUpperCase() },
            create: { studentId, subjectId, status: status.toUpperCase(), date: normalizedDate },
        });

        recalculateStudentStats(studentId).catch(() => { });
        return res.success(attendance, 'Attendance marked.', 201);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED — kept for backward compat, use POST /api/marks/save instead
// @route   PATCH /api/faculty/marks
// ─────────────────────────────────────────────────────────────────────────────
export const updateMarks = async (req, res) => {
    try {
        const { studentId, subjectCode, testType, marks, maxMarks } = req.body;

        const subject = await prisma.subject.findUnique({ where: { subjectCode } });
        if (!subject) return res.error('Subject not found.', 404);

        const markRecord = await prisma.marks.upsert({
            where: { studentId_subjectId_testType: { studentId, subjectId: subject.id, testType } },
            update: { marks: Number(marks), maxMarks: Number(maxMarks) },
            create: { studentId, subjectId: subject.id, testType, marks: Number(marks), maxMarks: Number(maxMarks) },
        });

        recalculateStudentStats(studentId).catch(() => { });
        return res.success(markRecord, 'Marks updated.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};
