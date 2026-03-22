import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import AIServiceProxy from '../utils/aiServiceProxy.js';

/**
 * studentController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Personal dashboard and academic status for students.
 * Updated for Prisma + PostgreSQL architecture.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const getStudentDashboard = async (req, res) => {
    try {
        // req.user.prismaId = Prisma Student.id, resolved by protect middleware via email bridge
        const studentId = req.user.prismaId;

        let student;
        if (studentId) {
            student = await prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    attendance: { include: { subject: true } },
                    evaluations: { include: { subject: true } },
                    submissions: {
                        where: { submissionStatus: 'NOT_SUBMITTED' },
                        include: { assignment: { include: { subject: true } } }
                    }
                }
            });
        }

        // Fallback: look up by email if prismaId bridge failed
        if (!student) {
            student = await prisma.student.findUnique({
                where: { email: req.user.email },
                include: {
                    attendance: { include: { subject: true } },
                    evaluations: { include: { subject: true } },
                    submissions: {
                        where: { submissionStatus: 'NOT_SUBMITTED' },
                        include: { assignment: { include: { subject: true } } }
                    }
                }
            });
        }

        if (!student) {
            return res.error('Student profile not found in academic engine.', 404);
        }

        // 1. Process Attendance per subject
        const attendanceMap = {};
        student.attendance.forEach(record => {
            const code = record.subject.subjectCode;
            if (!attendanceMap[code]) attendanceMap[code] = { present: 0, total: 0 };
            attendanceMap[code].total++;
            if (record.status === 'PRESENT') attendanceMap[code].present++;
        });

        const attendanceFinal = {};
        const warnings = [];

        Object.keys(attendanceMap).forEach(code => {
            const stats = attendanceMap[code];
            const percent = ((stats.present / stats.total) * 100).toFixed(0);
            attendanceFinal[code] = `${percent}`;
            if (parseInt(percent) < 75) {
                warnings.push(`Low attendance in ${code} (${percent}%)`);
            }
        });

        // 2. Process Evaluations (Aggregate scores per subject)
        const marksFinal = {};
        student.evaluations.forEach(ev => {
            const code = ev.subject.subjectCode;
            // Use totalMarks or a breakdown if needed. For summary, totalMarks is best.
            marksFinal[code] = ev.totalMarks;
            
            if (ev.totalMarks < 40) {
                warnings.push(`Academic risk in ${code} (${ev.totalMarks}%)`);
            }
        });


        // 4. Fetch Temporal Matrix (Calendar)
        const calendarEvents = await prisma.academicCalendar.findMany({
            where: {
                OR: [
                    { semester: null, department: null },
                    { semester: student.semester },
                    { department: student.branch }
                ]
            },
            take: 5,
            orderBy: { startDate: 'asc' }
        });

        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        calendarEvents.forEach(ev => {
            const startDate = new Date(ev.startDate);
            if (startDate >= new Date() && startDate <= sevenDaysLater) {
                warnings.push(`Upcoming: ${ev.event} on ${startDate.toLocaleDateString()}`);
            }
        });

        // 5. AI Proactive Prediction
        let prediction = { level: 'Good', probability: 0.95 };
        try {
            const allMarkValues = Object.values(marksFinal);
            const avgMarks = allMarkValues.length > 0 ? allMarkValues.reduce((a, b) => a + b, 0) / allMarkValues.length : 0;
            const avgAttendance = Object.values(attendanceFinal).reduce((a, b) => a + Number(b), 0) / Object.keys(attendanceFinal).length || 0;

            const aiRes = await AIServiceProxy.predictFailureRisk({ 
                avgMarks, 
                attendanceRate: avgAttendance 
            });

            if (aiRes) {
                // Map Risk (from Python) to Performance Level (as requested)
                const levelMap = { 'LOW': 'Good', 'MEDIUM': 'Average', 'HIGH': 'Needs Improvement' };
                prediction = {
                    level: levelMap[aiRes.risk] || 'Average',
                    probability: aiRes.probability,
                    score: 100 - (aiRes.probability * 100)
                };

                if (aiRes.risk === 'HIGH') {
                    warnings.push(`🚨 AI ALERT: Global trajectory indicates high academic risk. Remediation required.`);
                }
            }
        } catch (err) {
            logger.warn('AI Proactive Prediction bypass: ' + err.message);
        }

        return res.success({
            student: {
                name: student.fullName,
                usn: student.usn,
                semester: student.semester,
                section: student.section,
                branch: student.branch
            },
            attendance: attendanceFinal,
            marks: marksFinal,
            warnings: warnings,
            calendar: calendarEvents,
            prediction
        });

    } catch (error) {
        logger.error('Error fetching student dashboard:', error);
        return res.error('Academic engine sync failure.', 500);
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const studentId = req.user.prismaId;
        let student;
        
        if (studentId) {
            student = await prisma.student.findUnique({
                where: { id: studentId },
                include: { profile: true }
            });
        }
        if (!student) {
            student = await prisma.student.findUnique({
                where: { email: req.user.email },
                include: { profile: true }
            });
        }
        return res.success(student);
    } catch (error) {
        return res.error(error.message, 500);
    }
};
