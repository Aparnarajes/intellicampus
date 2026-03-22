import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * Performance Analytics Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Automatically tracks and flags students based on academic thresholds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const trackAttendanceRisk = async () => {
    try {
        const students = await prisma.student.findMany({
            include: {
                attendance: true
            }
        });

        for (const student of students) {
            const totalClasses = student.attendance.length;
            if (totalClasses === 0) continue;

            const presentClasses = student.attendance.filter(a => a.status === 'PRESENT').length;
            const percentage = (presentClasses / totalClasses) * 100;

            // Update student's aggregate attendance
            await prisma.student.update({
                where: { id: student.id },
                data: {
                    overallAttendancePercentage: percentage,
                    riskFlag: percentage < 75
                }
            });
        }
        logger.info('Attendance risk scan complete.');
    } catch (error) {
        logger.error('Error tracking attendance risk:', error);
    }
};

export const detectAcademicRisk = async () => {
    try {
        const students = await prisma.student.findMany({
            include: {
                marks: true
            }
        });

        for (const student of students) {
            const lowGrades = student.marks.filter(m => m.finalMarks && m.finalMarks < 40);

            if (lowGrades.length > 0) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { riskFlag: true }
                });
            }
        }
        logger.info('Academic risk scan complete.');
    } catch (error) {
        logger.error('Error detecting academic risk:', error);
    }
};

export const getAssignmentDefaulters = async (subjectId) => {
    try {
        const defaulters = await prisma.assignmentSubmission.findMany({
            where: {
                submissionStatus: 'NOT_SUBMITTED',
                assignment: {
                    subjectId: subjectId
                }
            },
            include: {
                student: true,
                assignment: true
            }
        });
        return defaulters;
    } catch (error) {
        logger.error('Error fetching assignment defaulters:', error);
        return [];
    }
};
