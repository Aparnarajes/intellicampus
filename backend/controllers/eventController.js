import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// ── Admin Capabilities ────────────────────────────────────────────────────────

/**
 * @desc    Create a new academic event
 * @route   POST /api/admin/events/create
 * @access  Private (Admin)
 */
export const createEvent = async (req, res) => {
    try {
        const { title, description, event_type, start_date, end_date, semester, department } = req.body;

        if (!title || !start_date || !event_type) {
            return res.error('Temporal дизайнator data missing: Title, Ingress Date, and Class are mandatory.', 400);
        }

        const semInt = semester ? parseInt(semester) : null;
        
        const event = await prisma.academicCalendar.create({
            data: {
                event: title,
                description,
                type: event_type,
                startDate: new Date(start_date),
                endDate: end_date ? new Date(end_date) : null,
                semester: semInt,
                department: department || null,
                postedBy: req.user.email
            }
        });

        // ── Institutional Trigger: Automatic Cohort Synchronization ────────────────
        try {
            const studentQuery = {};
            if (semInt) studentQuery.semester = semInt;
            if (department && department !== 'Global Network') studentQuery.branch = department;

            const targetStudents = await prisma.student.findMany({
                where: studentQuery,
                select: { userId: true }
            });

            if (targetStudents.length > 0) {
                const notificationData = targetStudents.map(student => ({
                    userId: student.userId,
                    type: 'Exam', // Default for calendar events
                    message: `Institutional Broadcast: ${title} — ${new Date(start_date).toLocaleDateString()}`,
                    metadata: JSON.stringify({ eventId: event.id, type: event_type })
                }));

                await prisma.notification.createMany({
                    data: notificationData,
                    skipDuplicates: true
                });
                logger.info(`[EVENTS] Synchronized ${targetStudents.length} nodes with new milestone: ${title}`);
            }
        } catch (notifErr) {
            logger.error(`[EVENTS] Broadcast synchronization failure: ${notifErr.message}`);
            // Non-blocking error
        }

        logger.info(`[EVENTS] Milestone initialized: ${title} by ${req.user.email}`);
        return res.success(event, 'Institutional milestone synchronized across the registry.', 201);
    } catch (error) {
        logger.error(`[EVENTS] Protocol failure: ${error.message}`);
        return res.error(`Protocol Error: ${error.message}`, 500);
    }
};

/**
 * @desc    Update an existing academic event
 * @route   PUT /api/admin/events/:eventId/update
 * @access  Private (Admin)
 */
export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, description, event_type, start_date, end_date, semester, department } = req.body;

        const existing = await prisma.academicCalendar.findUnique({ where: { id: eventId } });
        if (!existing) return res.error('Event not found.', 404);

        if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
            return res.error('Start date must be before end date.', 400);
        }

        const updated = await prisma.academicCalendar.update({
            where: { id: eventId },
            data: {
                event: title || undefined,
                description: description !== undefined ? description : undefined,
                type: event_type || undefined,
                startDate: start_date ? new Date(start_date) : undefined,
                endDate: end_date ? new Date(end_date) : (end_date === null ? null : undefined),
                semester: semester !== undefined ? (semester ? parseInt(semester) : null) : undefined,
                department: department !== undefined ? department : undefined
            }
        });

        logger.info(`[EVENTS] Event updated: ${eventId} by ${req.user.email}`);
        return res.success(updated, 'Academic event updated successfully.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

/**
 * @desc    Delete an academic event
 * @route   DELETE /api/admin/events/:eventId/delete
 * @access  Private (Admin)
 */
export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        await prisma.academicCalendar.delete({ where: { id: eventId } });

        logger.info(`[EVENTS] Event deleted: ${eventId} by ${req.user.email}`);
        return res.success(null, 'Academic event deleted successfully.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ── User Capabilities ─────────────────────────────────────────────────────────

/**
 * @desc    Get all academic events
 * @route   GET /api/events
 * @access  Private (Admin, Faculty, Student)
 */
export const listEvents = async (req, res) => {
    try {
        const { semester, department } = req.query;

        const where = {};
        if (semester || department) {
            where.OR = [
                { semester: semester ? parseInt(semester) : undefined },
                { department: department || undefined },
                { AND: [{ semester: null }, { department: null }] }
            ];
        }

        const events = await prisma.academicCalendar.findMany({
            where,
            orderBy: { startDate: 'asc' }
        });

        return res.success(events);
    } catch (error) {
        return res.error(error.message, 500);
    }
};
