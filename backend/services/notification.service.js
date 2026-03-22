import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * NotificationService
 * ─────────────────────────────────────────────────────────────────────────────
 * Smart notification engine for students and faculty.
 * Migrated to Prisma / PostgreSQL.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class NotificationService {
    // 1. Generic create notification
    async create(userId, type, message, metadata = {}) {
        try {
            // Avoid duplicate notifications of same type/message for today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const existing = await prisma.notification.findFirst({
                where: {
                    userId,
                    type,
                    message,
                    createdAt: { gte: startOfDay }
                }
            });

            if (!existing) {
                return await prisma.notification.create({
                    data: {
                        userId,
                        type,
                        message,
                        metadata: JSON.stringify(metadata)
                    }
                });
            }
            return existing;
        } catch (error) {
            logger.error('Error creating notification:', error);
            return null;
        }
    }

    // 2. Trigger Smart Checks
    async runSmartTriggers(user) {
        try {
            const userId = user.id;
            const student = await prisma.student.findUnique({
                where: { userId },
                include: {
                    attendance: { include: { subject: true } }
                }
            });

            if (!student) return [];

            const notifications = [];

            // A. Check Attendance (< 75%)
            const attendanceMap = {};
            student.attendance.forEach(record => {
                const code = record.subject.subjectCode;
                if (!attendanceMap[code]) attendanceMap[code] = { present: 0, total: 0 };
                attendanceMap[code].total++;
                if (record.status === 'PRESENT') attendanceMap[code].present++;
            });

            for (const code in attendanceMap) {
                const stats = attendanceMap[code];
                const percentage = (stats.present / stats.total) * 100;

                if (stats.total >= 5 && percentage < 75) {
                    const required = Math.ceil((0.75 * stats.total - stats.present) / 0.25);
                    const msg = `Low attendance in ${code}: ${percentage.toFixed(1)}%. You need to attend ${required} more classes to reach 75%.`;

                    const notif = await this.create(userId, 'Attendance', msg, {
                        subject: code,
                        percentage: percentage.toFixed(1),
                        required
                    });
                    if (notif) notifications.push(notif);
                }
            }

            // B. Check Upcoming Exams (within 3 days)
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            const upcomingExams = await prisma.exam.findMany({
                where: {
                    subject: {
                        attendance: {
                            some: { studentId: student.id }
                        }
                    },
                    date: { gte: today, lte: threeDaysLater }
                },
                include: { subject: true }
            });

            for (const exam of upcomingExams) {
                const msg = `Exam Alert: ${exam.subject.subjectName} (${exam.type}) is scheduled on ${exam.date.toLocaleDateString()}.`;
                const notif = await this.create(userId, 'Exam', msg, { examId: exam.id });
                if (notif) notifications.push(notif);
            }

            // C. Check New Assignments
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const newAssignments = await prisma.assignment.findMany({
                where: {
                    subject: {
                        attendance: {
                            some: { studentId: student.id }
                        }
                    },
                    createdAt: { gte: oneDayAgo }
                },
                include: { subject: true }
            });

            for (const ass of newAssignments) {
                const msg = `New Assignment: ${ass.title} for ${ass.subject.subjectName}. Due date: ${ass.dueDate.toLocaleDateString()}.`;
                const notif = await this.create(userId, 'Assignment', msg, { assignmentId: ass.id });
                if (notif) notifications.push(notif);
            }

            return notifications;
        } catch (error) {
            logger.error('Error running smart triggers:', error);
            return [];
        }
    }

    async getUnread(userId) {
        return await prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' }
        });
    }

    async markAsRead(notificationId) {
        return await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
    }
}

export default new NotificationService();
