import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * Admin Academic Intelligence dashboard data
 */
export const getAcademicIntelligence = async () => {
    try {
        // 1. Students at attendance risk (Overall < 75%)
        // Prisma doesn't do complex grouping as easily as MongoDB, so we'll fetch and calculate
        const allAttendance = await prisma.attendance.findMany({
            include: { student: true }
        });

        const studentGrouping = {};
        allAttendance.forEach(a => {
            if (!studentGrouping[a.studentId]) {
                studentGrouping[a.studentId] = {
                    studentId: a.studentId,
                    name: a.student.fullName,
                    usn: a.student.usn,
                    batch: a.student.branch + ' ' + a.student.section,
                    present: 0,
                    total: 0
                };
            }
            studentGrouping[a.studentId].total++;
            if (a.status === 'PRESENT') studentGrouping[a.studentId].present++;
        });

        const attendanceRisk = Object.values(studentGrouping)
            .map(s => ({
                ...s,
                percent: Math.round((s.present / s.total) * 100 * 10) / 10
            }))
            .filter(s => s.percent < 75)
            .sort((a, b) => a.percent - b.percent);

        // 2. Subject Failure Probability
        const allMarks = await prisma.evaluation.findMany({
            include: { subject: true }
        });

        const subjectGrouping = {};
        allMarks.forEach(m => {
            if (!subjectGrouping[m.subjectId]) {
                subjectGrouping[m.subjectId] = {
                    subject: m.subject.subjectName,
                    totalScore: 0,
                    totalCount: 0
                };
            }
            subjectGrouping[m.subjectId].totalScore += (m.totalMarks / 100) * 100;
            subjectGrouping[m.subjectId].totalCount++;
        });

        const subjectDifficulty = Object.values(subjectGrouping)
            .map(s => {
                const avgScore = Math.round((s.totalScore / s.totalCount) * 10) / 10;
                return {
                    subject: s.subject,
                    avgScore,
                    failureProbability: Math.round((100 - avgScore) * 10) / 10
                };
            })
            .sort((a, b) => b.failureProbability - a.failureProbability);

        // 3. Upcoming Academic Load
        const today = new Date();
        const next30 = new Date();
        next30.setDate(today.getDate() + 30);

        const exams = await prisma.exam.findMany({
            where: { date: { gte: today, lte: next30 } }
        });

        const assignments = await prisma.assignment.findMany({
            where: { dueDate: { gte: today, lte: next30 } }
        });

        const loadMap = {};
        exams.forEach(e => {
            const dateStr = e.date.toISOString().split('T')[0];
            loadMap[dateStr] = (loadMap[dateStr] || 0) + 1;
        });
        assignments.forEach(a => {
            const dateStr = a.dueDate.toISOString().split('T')[0];
            loadMap[dateStr] = (loadMap[dateStr] || 0) + 1;
        });

        const academicLoad = Object.entries(loadMap)
            .map(([date, load]) => ({ date, load }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            attendanceRisk,
            subjectDifficulty,
            academicLoad
        };
    } catch (error) {
        logger.error('Error in getAcademicIntelligence:', error);
        throw error;
    }
};

export const updateStudentPerformanceProfile = async (studentId) => {
    try {
        // 1. Mark stats
        const marks = await prisma.evaluation.findMany({
            where: { studentId },
            include: { subject: true }
        });

        const markStats = {};
        marks.forEach(m => {
            if (!markStats[m.subject.subjectName]) markStats[m.subject.subjectName] = [];
            markStats[m.subject.subjectName].push((m.totalMarks / 100) * 100);
        });

        const performanceBySubject = Object.entries(markStats).map(([name, scores]) => ({
            name,
            avg: scores.reduce((a, b) => a + b, 0) / scores.length
        }));

        const strongSubjects = performanceBySubject.filter(s => s.avg >= 80).map(s => s.name);
        const weakSubjects = performanceBySubject.filter(s => s.avg < 50).map(s => s.name);

        // 2. Attendance Stats
        const attendance = await prisma.attendance.findMany({
            where: { studentId },
            include: { subject: true }
        });

        const attStats = {};
        attendance.forEach(a => {
            if (!attStats[a.subject.subjectName]) attStats[a.subject.subjectName] = { present: 0, total: 0 };
            attStats[a.subject.subjectName].total++;
            if (a.status === 'PRESENT') attStats[a.subject.subjectName].present++;
        });

        const attendanceRiskSubjects = Object.entries(attStats)
            .filter(([_, stats]) => stats.total > 0 && (stats.present / stats.total) < 0.75)
            .map(([name, _]) => name);

        // 3. Doubt Stats
        const doubts = await prisma.doubt.findMany({
            where: { studentId, isWeakTopic: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        const topWeakTopics = doubts.map(d => d.topic);

        // 4. Learning Style
        const totalDoubts = await prisma.doubt.count({ where: { studentId } });
        const preferredLearningStyle = totalDoubts > 10 ? 'Practical' : 'Theoretical';

        const avgMarks = performanceBySubject.length > 0
            ? performanceBySubject.reduce((a, b) => a + b.avg, 0) / performanceBySubject.length
            : 0;

        // 5. Upsert Profile
        const profile = await prisma.studentProfile.upsert({
            where: { studentId },
            update: {
                strongSubjects: JSON.stringify(strongSubjects),
                weakSubjects: JSON.stringify(weakSubjects),
                attendanceRiskSubjects: JSON.stringify(attendanceRiskSubjects),
                topWeakTopics: JSON.stringify(topWeakTopics),
                preferredLearningStyle,
                avgMarks,
                totalDoubtsSolved: totalDoubts,
                lastUpdated: new Date()
            },
            create: {
                studentId,
                strongSubjects: JSON.stringify(strongSubjects),
                weakSubjects: JSON.stringify(weakSubjects),
                attendanceRiskSubjects: JSON.stringify(attendanceRiskSubjects),
                topWeakTopics: JSON.stringify(topWeakTopics),
                preferredLearningStyle,
                avgMarks,
                totalDoubtsSolved: totalDoubts
            }
        });

        return profile;
    } catch (error) {
        logger.error('Error in updateStudentPerformanceProfile:', error);
        throw error;
    }
};

export const getStudentAttendanceTrend = async (studentId) => {
    try {
        const attendance = await prisma.attendance.findMany({
            where: { studentId },
            orderBy: { date: 'asc' }
        });

        if (!attendance || attendance.length === 0) return [];

        // Group by week manually since SQLite doesn't have robust date funcs in Prisma without raw SQL
        const weekMap = {};
        attendance.forEach(a => {
            const d = new Date(a.date);
            const day = d.getDay(),
                diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

            if (!weekMap[monday]) weekMap[monday] = { present: 0, total: 0, date: monday };
            weekMap[monday].total++;
            if (a.status === 'PRESENT') weekMap[monday].present++;
        });

        return Object.values(weekMap).map(w => {
            const total = w.total || 1; // Prevent div by zero
            return {
                date: w.date,
                rate: Math.round((w.present / total) * 100 * 10) / 10
            };
        }).sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
        logger.error('[Analytics] Attendance Trend Failure:', err);
        return [];
    }
};

export const getSubjectWisePerformance = async (studentId) => {
    try {
        const marks = await prisma.evaluation.findMany({
            where: { studentId },
            include: { subject: true }
        });

        if (!marks || marks.length === 0) return [];

        const grouping = {};
        marks.forEach(m => {
            const subjectName = m.subject?.subjectName || 'UNIDENTIFIED_VECT';
            if (!grouping[subjectName]) grouping[subjectName] = { score: 0, count: 0 };
            grouping[subjectName].score += (m.totalMarks / (m.subject?.maxMarks || 100)) * 100;
            grouping[subjectName].count++;
        });

        return Object.entries(grouping).map(([name, data]) => ({
            subject: name,
            percentage: Math.round((data.score / (data.count || 1)) * 10) / 10
        })).sort((a, b) => b.percentage - a.percentage);
    } catch (err) {
        logger.error('[Analytics] Performance Synthesis Failure:', err);
        return [];
    }
};

export const getWeakStudentsPerSubject = async (batch) => {
    // Batch parameter is like '2023-A'. We split it to year='2023', section='A'
    const [year, section] = batch?.split('-') || [];

    const students = await prisma.student.findMany({
        where: { 
            admissionYear: year ? parseInt(year, 10) : undefined,
            section: section || undefined 
        },
        include: {
            evaluations: { include: { subject: true } }
        }
    });

    const subjectWeakList = {};

    students.forEach(student => {
        student.evaluations.forEach(m => {
            const subjectName = m.subject.subjectName;
            if (!subjectWeakList[subjectName]) subjectWeakList[subjectName] = [];

            const pct = (m.totalMarks / 100) * 100;
            if (pct < 50) {
                subjectWeakList[subjectName].push({
                    name: student.fullName,
                    usn: student.usn,
                    score: Math.round(pct * 10) / 10
                });
            }
        });
    });

    return Object.entries(subjectWeakList).map(([subject, list]) => ({
        subject,
        topWeak: list.sort((a, b) => a.score - b.score).slice(0, 5)
    }));
};

export const getStudentPrediction = async (studentId) => {
    const marks = await prisma.evaluation.findMany({
        where: { studentId },
        orderBy: { createdAt: 'asc' }
    });

    if (marks.length < 2) return { currentTrend: [], prediction: [] };

    const dataPoints = marks.map((m, idx) => ({
        x: idx,
        y: (m.totalMarks / 100) * 100
    }));

    // Simple Linear Regression: y = mx + c
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    dataPoints.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const c = (sumY - m * sumX) / n;

    const prediction = [];
    for (let i = n; i < n + 3; i++) {
        prediction.push({
            x: i,
            y: Math.max(0, Math.min(100, Math.round((m * i + c) * 10) / 10))
        });
    }

    return {
        currentTrend: dataPoints.map(p => ({ x: p.x, y: Math.round(p.y * 10) / 10 })),
        prediction
    };
};

export const getClassHeatmap = async (batch) => {
    // Batch parameter is like '2023-A'. We split it to year='2023', section='A'
    const [year, section] = batch?.split('-') || [];

    const students = await prisma.student.findMany({
        where: { 
            admissionYear: year ? parseInt(year, 10) : undefined,
            section: section || undefined 
        },
        include: {
            evaluations: { include: { subject: true } }
        }
    });

    const heatmap = [];
    students.forEach(student => {
        student.evaluations.forEach(m => {
            heatmap.push({
                student: student.fullName,
                subject: m.subject.subjectName,
                score: Math.round((m.totalMarks / 100) * 100)
            });
        });
    });

    return heatmap.sort((a, b) => (a.student || '').localeCompare(b.student || ''));
};

export const getAdvancedStudentDashboard = async (studentId) => {
    try {
        if (!studentId) throw new Error('Student identifier is required for intelligence synthesis.');

        // 1. Core Profile Stats
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const profile = await prisma.studentProfile.findUnique({ where: { studentId } });

        // 2. Performance & Subject Distribution
        const performance = await getSubjectWisePerformance(studentId);
        
        // Transform for Pie Chart (Performance Brackets)
        const distribution = [
            { name: 'Excellence (>85%)', value: performance.filter(s => s.percentage >= 85).length },
            { name: 'Proficient (70-85%)', value: performance.filter(s => s.percentage >= 70 && s.percentage < 85).length },
            { name: 'Average (50-70%)', value: performance.filter(s => s.percentage >= 50 && s.percentage < 70).length },
            { name: 'Critical (<50%)', value: performance.filter(s => s.percentage < 50).length },
        ].filter(d => d.value > 0);

        // 3. AI Predictions
        const prediction = await getStudentPrediction(studentId);

        // 4. Weak Topics & AI Insights
        const weakTopics = await prisma.studentTopicAnalytics.findMany({
            where: { studentId, isWeak: true },
            orderBy: { score: 'asc' },
            take: 10
        });

        // 5. Attendance Trend
        const attendanceTrend = await getStudentAttendanceTrend(studentId);

        // 6. Aggregate Insights
        const insights = [];
        const avgScore = Math.round(profile?.avgMarks || student?.overallMarks || 0);
        
        if (avgScore > 0 && avgScore < 60) insights.push({ type: 'CRITICAL', text: 'Avg marks are below 60%. Intensive focus on weak subjects recommended.' });
        
        const riskSubject = (performance || []).find(s => s.percentage < 40);
        if (riskSubject) insights.push({ type: 'WARNING', text: `Subject failure risk detected in ${riskSubject.subject}` });
        
        if (attendanceTrend && attendanceTrend.length > 0) {
            const latest = attendanceTrend[attendanceTrend.length - 1].rate;
            if (latest < 75) insights.push({ type: 'INFO', text: 'Attendance is dropping below retention threshold (75%).' });
        }

        return {
            student: {
                name: student?.fullName || 'Academic User',
                usn: student?.usn || 'N/A',
                semester: student?.semester || 0,
                section: student?.section || 'X'
            },
            kpis: {
                avgScore,
                cgpa: student?.overallGpa || profile?.cgpa || 0,
                attendanceStability: (attendanceTrend && attendanceTrend.length > 0) ? attendanceTrend[attendanceTrend.length - 1].rate : 0,
                nextTarget: (prediction?.prediction?.length > 0) ? prediction.prediction[0].y : 0
            },
            visuals: {
                performance: performance || [],
                distribution: distribution || [],
                prediction: prediction || { currentTrend: [], prediction: [] },
                attendanceTrend: attendanceTrend || []
            },
            topics: (weakTopics || []).map(t => ({
                subject: t.subject || 'N/A',
                topic: t.topic || 'N/A',
                score: t.score || 0,
                daysSinceUpdate: t.lastUpdated ? Math.floor((new Date() - new Date(t.lastUpdated)) / (1000 * 60 * 60 * 24)) : 0
            })),
            insights
        };
    } catch (error) {
        logger.error(`[AnalyticsEngine] Dashboard Synthesis Failed for Student ${studentId}:`, error);
        // Fallback: return a barebones object instead of throwing
        return {
            student: { name: 'Institutional User', usn: 'PENDING', semester: 0, section: 'X' },
            kpis: { avgScore: 0, cgpa: 0, attendanceStability: 0, nextTarget: 0 },
            visuals: { performance: [], distribution: [], prediction: { currentTrend: [], prediction: [] }, attendanceTrend: [] },
            topics: [],
            insights: [{ type: 'WARNING', text: 'Intelligence Engine is initializing. Please check back later.' }]
        };
    }
};

export const getStudentWeakTopics = async (studentId) => {
    const weakTopics = await prisma.studentTopicAnalytics.findMany({
        where: { studentId, isWeak: true },
        orderBy: { lastUpdated: 'desc' },
        take: 10
    });

    return weakTopics.map(wt => ({
        subject: wt.subject,
        topic: wt.topic,
        score: wt.score,
        lastUpdated: wt.lastUpdated
    }));
};
