import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import * as AnalyticsService from '../services/analytics.service.js';

/**
 * adminAcademicController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level orchestration: assignments, bulk imports, and analytics.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const assignFacultyToSubject = async (req, res) => {
    try {
        const { facultyId, subjectId, section } = req.body;

        const mapping = await prisma.facultySubject.create({
            data: { facultyId, subjectId, section }
        });

        return res.success(mapping, 'Faculty assigned successfully.', 201);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const getAcademicAnalytics = async (req, res) => {
    try {
        const studentCount = await prisma.student.count();
        const facultyCount = await prisma.faculty.count();
        const riskStudents = await prisma.student.count({ where: { riskFlag: true } });

        // Fetch high-level intelligence from service
        const intelligence = await AnalyticsService.getAcademicIntelligence();

        return res.success({
            totalStudents: studentCount,
            totalFaculty: facultyCount,
            studentsAtRisk: riskStudents,
            ...intelligence
        });
    } catch (error) {
        logger.error('Error fetching admin analytics:', error);
        return res.error(error.message, 500);
    }
};

export const importPreRegisteredData = async (req, res) => {
    try {
        const { type, data } = req.body; // Array of student or faculty objects

        if (type === 'student') {
            await prisma.preRegisteredStudent.createMany({
                data: data.map(s => ({
                    usn: s.usn,
                    fullName: s.fullName,
                    email: s.email,
                    branch: s.branch,
                    semester: parseInt(s.semester),
                    section: s.section,
                    batch: s.batch
                })),
                skipDuplicates: true
            });
        } else {
            await prisma.preRegisteredFaculty.createMany({
                data: data.map(f => ({
                    facultyId: f.facultyId,
                    fullName: f.fullName,
                    email: f.email,
                    department: f.department,
                    designation: f.designation
                })),
                skipDuplicates: true
            });
        }

        return res.success(null, `Bulk ${type} import completed.`);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─── Subject Management ───────────────────────────────────────────────────────
export const listSubjects = async (req, res) => {
    try {
        const { branch, semester, search } = req.query;
        const where = {};
        if (branch) where.branch = branch;
        if (semester) where.semester = parseInt(semester);
        if (search) {
            where.OR = [
                { subjectName: { contains: search } },
                { subjectCode: { contains: search.toUpperCase() } }
            ];
        }

        const subjects = await prisma.subject.findMany({
            where,
            include: {
                facultySubjects: {
                    include: { faculty: true }
                }
            },
            orderBy: [{ semester: 'asc' }, { subjectName: 'asc' }]
        });

        return res.success(subjects);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const createSubject = async (req, res) => {
    try {
        const { subjectName, subjectCode, semester, branch } = req.body;
        if (!subjectName || !subjectCode || !semester || !branch) {
            return res.error('Missing required fields for subject.', 400);
        }

        const subject = await prisma.subject.create({
            data: {
                subjectName,
                subjectCode: subjectCode.toUpperCase(),
                semester: parseInt(semester),
                branch
            }
        });

        return res.success(subject, 'Subject created successfully.', 201);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { subjectName, subjectCode, semester, branch } = req.body;

        const subject = await prisma.subject.update({
            where: { id },
            data: {
                subjectName,
                subjectCode: subjectCode?.toUpperCase(),
                semester: semester ? parseInt(semester) : undefined,
                branch
            }
        });

        return res.success(subject, 'Subject updated successfully.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.subject.delete({ where: { id } });
        return res.success(null, 'Subject deleted successfully.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─── Academic Calendar ───────────────────────────────────────────────────────
export const listCalendarEvents = async (req, res) => {
    try {
        const events = await prisma.academicCalendar.findMany({
            orderBy: { startDate: 'asc' }
        });
        return res.success(events);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const createCalendarEvent = async (req, res) => {
    try {
        const { event, description, startDate, endDate, type, semester, department } = req.body;
        const newEvent = await prisma.academicCalendar.create({
            data: {
                event,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                type: type || 'EVENT',
                semester: semester ? parseInt(semester) : null,
                department
            }
        });
        return res.success(newEvent, 'Event added to calendar.', 201);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const updateCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { event, description, startDate, endDate, type, semester, department } = req.body;
        const updated = await prisma.academicCalendar.update({
            where: { id },
            data: {
                event,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                type,
                semester: semester !== undefined ? (semester ? parseInt(semester) : null) : undefined,
                department
            }
        });
        return res.success(updated, 'Calendar milestone updated.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const deleteCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.academicCalendar.delete({ where: { id } });
        return res.success(null, 'Event removed from calendar.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const listAnnouncements = async (req, res) => {
    try {
        const { category, priority } = req.query;
        const where = {};
        if (category) where.category = category;
        if (priority) where.priority = priority;

        const announcements = await prisma.announcement.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return res.success(announcements);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetBatch, priority, category } = req.body;
        
        if (!title || !content) {
            return res.error('Title and content are required.', 400);
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                targetBatch: targetBatch || 'All',
                priority: priority || 'NORMAL',
                category: category || 'GENERAL',
                postedBy: req.user.email
            }
        });
        return res.success(announcement, 'Announcement published.', 201);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({ where: { id } });
        return res.success(null, 'Announcement deleted.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};
