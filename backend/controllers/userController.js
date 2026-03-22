import prisma from '../config/prisma.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * userController.js — SQL / Prisma Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles profile management, dashboards stats, and user discovery.
 * All logic is now backed by SQLite via Prisma.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── PERFORMANCE CALCULATOR ──────────────────────────────────────────────────
/**
 * Calculates a student's high-level performance metrics based on real database records.
 * @param {string} studentId - Prisma Student UUID
 */
const calculatePerformance = async (studentId) => {
    try {
        const [attendanceCount, presentCount, evaluation] = await Promise.all([
            prisma.attendance.count({ where: { studentId } }),
            prisma.attendance.count({ where: { studentId, status: 'PRESENT' } }),
            prisma.evaluation.findFirst({
                where: { studentId },
                orderBy: { createdAt: 'desc' } // Get latest evaluation record
            })
        ]);

        const attendancePercentage = attendanceCount > 0
            ? Math.round((presentCount / attendanceCount) * 100)
            : 0;

        // Overall Score logic: 40% Attendance + 60% Academic Total Normalized
        const academicScore = evaluation ? (evaluation.totalMarks || 0) : 0;
        const cgpa = 8.5; // Placeholder for now, could be derived from prev semesters

        const overallScore = Math.round(
            (attendancePercentage * 0.4) +
            (academicScore * 0.6)
        );

        return {
            attendance: attendancePercentage,
            testScores: academicScore,
            cgpa: cgpa,
            overallScore: overallScore
        };
    } catch (err) {
        logger.error(`[PERFORMANCE] Calculation failed for ${studentId}: ${err.message}`);
        return { attendance: 0, testScores: 0, cgpa: 0, overallScore: 0 };
    }
};

// ─── PROFILE OPERATIONS ───────────────────────────────────────────────────────

/** Get profile of the currently logged-in user */
export const getProfile = async (req, res) => {
    try {
        // Use the resolved Prisma ID from the auth bridge middleware
        const prismaUserId = req.user.prismaUserId;
        
        if (!prismaUserId) {
            return res.error('Academic identity not found. Profile is unlinked.', 404);
        }

        const user = await prisma.user.findUnique({
            where: { id: prismaUserId },
            include: {
                student: true,
                faculty: true
            }
        });

        if (!user) return res.error('User identity not found in database.', 404);

        const roleData = user.role === 'STUDENT' ? user.student : user.faculty;
        const normalizedRole = user.role.toLowerCase();
        
        // Construct a unified profile response
        const profile = {
            id: user.id,
            role: normalizedRole,
            email: user.email,
            isFirstLogin: user.isFirstLogin,
            name: roleData?.fullName || 'Anonymous User',
            fullName: roleData?.fullName,
            phone: roleData?.phone,
            address: roleData?.address,
            profileImage: roleData?.profilePhotoUrl,
            bio: roleData?.bio || '',
            interests: roleData?.interests || '',
            skills: roleData?.skills ? roleData.skills.split(',').map(s => s.trim()) : [],
            birthday: roleData?.dateOfBirth,
            
            // Student specific
            usn: roleData?.usn,
            batch: normalizedRole === 'student' ? (roleData?.section || roleData?.branch) : null,
            semester: roleData?.semester,
            branch: roleData?.branch,
            
            // Faculty specific
            employeeId: roleData?.facultyId,
            department: roleData?.department,
            designation: roleData?.designation
        };

        if (user.role === 'STUDENT' && roleData) {
            profile.academicPerformance = await calculatePerformance(roleData.id);
        }

        return res.success(profile);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

/** Update profile of the currently logged-in user */
export const updateProfile = async (req, res) => {
    try {
        const { id, role, prismaUserId } = req.user;
        const b = req.body;

        logger.info(`[PROFILE_SYNC] Initiating synchronize for ${req.user.email} (${role})`);

        // 1. Prepare Update Data for Prisma (Data Layer)
        const prismaUpdate = {
            fullName: b.name || b.fullName,
            phone: b.phone,
            address: b.address,
            profilePhotoUrl: b.profileImage,
            bio: b.bio,
            interests: b.interests,
            skills: Array.isArray(b.skills) ? b.skills.join(', ') : b.skills,
            dateOfBirth: (b.birthday && b.birthday !== '') ? new Date(b.birthday) : undefined
        };

        // 2. Prepare Update Data for MongoDB (Auth Layer)
        const mongoUpdate = {
            name: b.name || b.fullName,
            phoneNumber: b.phone,
            address: b.address,
            profileImage: b.profileImage,
            bio: b.bio,
            interests: b.interests,
            skills: Array.isArray(b.skills) ? b.skills : (b.skills ? b.skills.split(',').map(s => s.trim()) : []),
            dateOfBirth: (b.birthday && b.birthday !== '') ? new Date(b.birthday) : undefined,
            parentEmail: b.parentEmail,
            parentPhone: b.parentPhone,
            parentName: b.parentName
        };

        // Standardize: Remove undefined fields
        [prismaUpdate, mongoUpdate].forEach(obj => {
            Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
        });

        // 3. Update MongoDB (Auth Layer)
        const updatedMongoUser = await User.findByIdAndUpdate(id, mongoUpdate, { new: true });
        
        if (!updatedMongoUser) {
            throw new Error(`Profile sync failed: MongoDB identifier '${id}' not found.`);
        }
        
        if (b.email && b.email.toLowerCase() !== req.user.email.toLowerCase()) {
            updatedMongoUser.email = b.email.toLowerCase();
            await updatedMongoUser.save();
        }

        // 4. Update Prisma (Data Layer)
        let updatedRoleData;
        if (prismaUserId) {
            if (role === 'student') {
                updatedRoleData = await prisma.student.update({
                    where: { userId: prismaUserId },
                    data: prismaUpdate
                });
            } else if (role === 'faculty') {
                updatedRoleData = await prisma.faculty.update({
                    where: { userId: prismaUserId },
                    data: prismaUpdate
                });
            }

            // Sync Prisma User Email
            if (b.email) {
                await prisma.user.update({
                    where: { id: prismaUserId },
                    data: { email: b.email.toLowerCase() }
                });
            }
        }

        logger.info(`[PROFILE_SYNC] Success for ${id} (Prisma: ${prismaUserId})`);

        // Return unified response
        const responseData = {
            ...updatedMongoUser.toObject(),
            success: true
        };

        return res.success(responseData, 'Neural profile synchronized successfully.');
    } catch (error) {
        logger.error(`[PROFILE_SYNC_FAIL] ${error.message}`);
        return res.error(`Sync failure: ${error.message}`, 400);
    }
};

/** Admin/Faculty: Update any user profile by ID */
export const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const b = req.body;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { student: true, faculty: true }
        });

        if (!user) return res.error('User not found.', 404);

        const updateData = {
            fullName: b.name || b.fullName,
            phone: b.phone,
            address: b.address,
            bio: b.bio,
            interests: b.interests,
            skills: Array.isArray(b.skills) ? b.skills.join(', ') : b.skills,
            dateOfBirth: b.birthday ? new Date(b.birthday) : undefined
        };

        // Remove undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        if (user.role === 'STUDENT') {
            await prisma.student.update({ where: { userId: id }, data: updateData });
        } else if (user.role === 'FACULTY') {
            await prisma.faculty.update({ where: { userId: id }, data: updateData });
        }

        return res.success(null, 'User profile updated by authority.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

/** Admin/Discovery: Get any user by ID */
export const getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { student: true, faculty: true }
        });

        if (!user) return res.error('User not found.', 404);
        
        const roleData = user.role === 'STUDENT' ? user.student : user.faculty;
        const profile = {
             ...user,
             name: roleData?.fullName,
             profileImage: roleData?.profilePhotoUrl
        };

        if (user.role === 'STUDENT' && roleData) {
            profile.academicPerformance = await calculatePerformance(roleData.id);
        }

        return res.success(profile);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─── SYSTEM DISCOVERY ─────────────────────────────────────────────────────────

export const getStudents = async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            orderBy: { fullName: 'asc' }
        });
        return res.success(students);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const getFaculty = async (req, res) => {
    try {
        const faculty = await prisma.faculty.findMany({
            orderBy: { fullName: 'asc' }
        });
        return res.success(faculty);
    } catch (error) {
        return res.error(error.message, 500);
    }
};

/** Delete user and all associated pre-registrations */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) return res.error('Cannot delete self.', 400);

        const user = await prisma.user.findUnique({
            where: { id },
            include: { student: true, faculty: true }
        });

        if (!user) return res.error('User not found.', 404);

        // Delete the User (Cascades might not be set in SQLite by default, so we clean up)
        await prisma.$transaction([
            prisma.student.deleteMany({ where: { userId: id } }),
            prisma.faculty.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        return res.success(null, 'Identity purged from system.');
    } catch (error) {
        return res.error(error.message, 500);
    }
};

// ─── DASHBOARD ANALYTICS ──────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
    try {
        const [studentCount, facultyCount, attendanceStats] = await Promise.all([
            prisma.student.count(),
            prisma.faculty.count(),
            prisma.attendance.groupBy({
                by: ['status'],
                _count: true
            })
        ]);

        const presentCount = attendanceStats.find(s => s.status === 'PRESENT')?._count || 0;
        const totalAttendance = attendanceStats.reduce((acc, curr) => acc + curr._count, 0);
        const overallAttendance = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;

        return res.success({
            studentCount,
            facultyCount,
            overallAttendance,
            atRiskCount: 0, // Placeholder
            recentActivity: []
        });
    } catch (error) {
        return res.error(error.message, 500);
    }
};

export const getFacultyStats = async (req, res) => {
    try {
        const faculty = await prisma.faculty.findUnique({
            where: { userId: req.user.id },
            include: { facultySubjects: { include: { subject: true } } }
        });

        if (!faculty) return res.error('Faculty record not found.', 404);

        const subjectsCount = faculty.facultySubjects.length;

        // Fetch Temporal Matrix (Calendar)
        const calendarEvents = await prisma.academicCalendar.findMany({
            where: {
                OR: [
                    { semester: null, department: null },
                    { department: faculty.department }
                ]
            },
            take: 4,
            orderBy: { startDate: 'asc' }
        });
        
        return res.success({
            classesCount: subjectsCount,
            totalStudents: 0, // Placeholder
            pendingAssignments: [],
            calendar: calendarEvents
        });
    } catch (error) {
        return res.error(error.message, 500);
    }
};
export const getAnnouncements = async (req, res) => {
    try {
        const { role } = req.user;
        const where = {
            OR: [
                { targetBatch: 'All' }
            ]
        };

        if (role === 'FACULTY') {
            where.OR.push({ targetBatch: 'Faculty' });
        } else if (role === 'STUDENT') {
            // In a real system, we'd find the student's admission year/batch here.
            // Since we use strings like '2022-2026', we'll just include 'All' for now.
        }

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
