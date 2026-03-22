import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * TopicAnalyticsService
 * Aggregates data from Doubts, Marks, and Mock Tests to detect cognitive gaps.
 */

export const updateTopicPerformace = async (studentId) => {
    try {
        // 1. Fetch Doubts per topic for this student
        const doubts = await prisma.doubt.findMany({
            where: { studentId }
        });

        const doubtStats = {};
        doubts.forEach(d => {
            const key = `${d.subject}|${d.topic}`;
            if (!doubtStats[key]) doubtStats[key] = 0;
            doubtStats[key]++;
        });

        // 2. Fetch Mock Test Results (incorrect answers) per topic
        const mockTests = await prisma.mockTestResult.findMany({
            where: { studentId }
        });

        const mockStats = {};
        mockTests.forEach(m => {
            const key = `${m.subject}|${m.topic}`;
            if (!mockStats[key]) mockStats[key] = 0;
            mockStats[key] += m.incorrectCount;
        });

        // 3. Fetch Subject-level marks
        const marks = await prisma.evaluation.findMany({
            where: { studentId },
            include: { subject: true }
        });

        const marksMap = {};
        marks.forEach(m => {
            if (!marksMap[m.subject.subjectName]) marksMap[m.subject.subjectName] = [];
            marksMap[m.subject.subjectName].push((m.totalMarks / 100) * 100);
        });

        const marksStats = {};
        Object.entries(marksMap).forEach(([subject, scores]) => {
            marksStats[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        // Map all unique subject-topic pairs
        const topicData = new Map();

        Object.entries(doubtStats).forEach(([key, count]) => {
            const [subject, topic] = key.split('|');
            topicData.set(key, { subject, topic, doubtCount: count, incorrectMock: 0 });
        });

        Object.entries(mockStats).forEach(([key, count]) => {
            const [subject, topic] = key.split('|');
            const existing = topicData.get(key) || { subject, topic, doubtCount: 0, incorrectMock: 0 };
            existing.incorrectMock = count;
            topicData.set(key, existing);
        });

        // 4. Calculate Scores and Upsert
        for (const [key, data] of topicData.entries()) {
            let score = 100;

            // Penalize for doubts
            score -= (data.doubtCount * 5);

            // Penalize for incorrect mock answers
            score -= (data.incorrectMock * 10);

            // Subject bias
            const subjectAvg = marksStats[data.subject] || 100;
            if (subjectAvg < 50) score -= 10;

            // Clamp score
            score = Math.max(0, Math.min(100, score));

            await prisma.studentTopicAnalytics.upsert({
                where: {
                    studentId_subject_topic: {
                        studentId,
                        subject: data.subject,
                        topic: data.topic
                    }
                },
                update: {
                    score,
                    isWeak: score < 60,
                    doubtCount: data.doubtCount,
                    incorrectMock: data.incorrectMock,
                    lastUpdated: new Date()
                },
                create: {
                    studentId,
                    subject: data.subject,
                    topic: data.topic,
                    score,
                    isWeak: score < 60,
                    doubtCount: data.doubtCount,
                    incorrectMock: data.incorrectMock
                }
            });
        }

        return true;
    } catch (error) {
        logger.error('Error in updateTopicPerformace:', error);
        throw error;
    }
};

export const getWeakTopics = async (studentId) => {
    return await prisma.studentTopicAnalytics.findMany({
        where: {
            studentId,
            isWeak: true
        },
        orderBy: { score: 'asc' }
    });
};

export const aggregateAllStudentsWeakTopics = async () => {
    const students = await prisma.student.findMany();

    logger.info(`[TopicAnalytics] Starting bulk aggregation for ${students.length} students...`);

    for (const student of students) {
        try {
            await updateTopicPerformace(student.id);
        } catch (err) {
            logger.error(`[TopicAnalytics] Failed for student ${student.id}:`, err.message);
        }
    }

    logger.info(`[TopicAnalytics] Bulk aggregation completed.`);
    return true;
};

export const getTopicRecommendations = async (studentId) => {
    const weakTopics = await getWeakTopics(studentId);

    return weakTopics.map(wt => ({
        subject: wt.subject,
        topic: wt.topic,
        score: wt.score,
        recommendation: `Revise '${wt.topic}' from your subject notes. Your current topic performance score is ${wt.score}%.`,
        searchUrl: `/search?q=${encodeURIComponent(`subject:${wt.subject} topic:${wt.topic}`)}`,
        proactiveAdvice: `You are weak in ${wt.topic}. I recommend revising this today.`
    }));
};
