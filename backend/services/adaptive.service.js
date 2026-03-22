import prisma from '../config/prisma.js';
import { callGeminiRest } from '../utils/aiHelper.js';
import aiCacheService from './aiCache.service.js';
import logger from '../utils/logger.js';

/**
 * AdaptiveEngine v2.0 — SQL / Prisma Edition
 * ────────────────────────────────────────────────────────────────────────────
 * Generates adaptive question papers tuned to the individual student's
 * real performance profile pulled live from PostgreSQL/SQLite.
 * ────────────────────────────────────────────────────────────────────────────
 */

const BASE_DIST = { easyPct: 40, mediumPct: 40, hardPct: 20 };
const THRESHOLDS = { WEAK: 60, STRONG: 75, LOW_ATTENDANCE: 75 };

export const computeStudentProfile = async (userId) => {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student profile not found.');

    const sid = student.id;

    // 1a. Last 5 test scores
    const last5 = await prisma.marks.findMany({
        where: { studentId: sid },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const last5ScoresPct = last5.map(m => parseFloat(((m.marks / (m.maxMarks || 50)) * 100).toFixed(1)));
    const recentAvg = last5ScoresPct.length > 0
        ? parseFloat((last5ScoresPct.reduce((a, b) => a + b, 0) / last5ScoresPct.length).toFixed(1))
        : 0;

    // 1b. Subject-wise performance
    const marks = await prisma.marks.findMany({
        where: { studentId: sid },
        include: { subject: true }
    });

    const subjectData = {};
    marks.forEach(m => {
        const code = m.subject.subjectCode;
        if (!subjectData[code]) subjectData[code] = { totalMarks: 0, totalMax: 0, count: 0 };
        subjectData[code].totalMarks += m.marks;
        subjectData[code].totalMax += (m.maxMarks || 50);
        subjectData[code].count++;
    });

    const subjectMap = {};
    const weakSubjects = [];
    const strongSubjects = [];

    Object.entries(subjectData).forEach(([code, data]) => {
        const avgPct = (data.totalMarks / data.totalMax) * 100;
        subjectMap[code] = parseFloat(avgPct.toFixed(1));
        if (avgPct < THRESHOLDS.WEAK) weakSubjects.push(code);
        if (avgPct >= THRESHOLDS.STRONG) strongSubjects.push(code);
    });

    // 1c. Attendance
    const attendance = await prisma.attendance.findMany({
        where: { studentId: sid },
        include: { subject: true }
    });

    const attData = {};
    attendance.forEach(a => {
        const code = a.subject.subjectCode;
        if (!attData[code]) attData[code] = { total: 0, present: 0 };
        attData[code].total++;
        if (a.status === 'PRESENT') attData[code].present++;
    });

    const lowAttendanceSubjects = [];
    let totalPresent = 0;
    let totalSessions = 0;

    Object.entries(attData).forEach(([code, data]) => {
        const rate = (data.present / data.total) * 100;
        if (rate < THRESHOLDS.LOW_ATTENDANCE) lowAttendanceSubjects.push(code);
        totalPresent += data.present;
        totalSessions += data.total;
    });

    const overallAttendancePct = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;
    const overallAvgPct = marks.length > 0
        ? (marks.reduce((a, b) => a + b.marks, 0) / marks.reduce((a, b) => a + (b.maxMarks || 50), 0)) * 100
        : 0;

    return {
        last5ScoresPct,
        recentAvg,
        overallAvgPct,
        overallAttendancePct,
        subjectMap,
        weakSubjects,
        strongSubjects,
        lowAttendanceSubjects
    };
};

export const computeDistribution = (profile, targetSubject, totalQuestions = 15) => {
    let { easyPct, mediumPct, hardPct } = { ...BASE_DIST };
    const flags = [];
    const reasons = [];

    const subjectAvg = profile.subjectMap[targetSubject];
    const isWeak = subjectAvg !== undefined ? subjectAvg < THRESHOLDS.WEAK : profile.overallAvgPct < THRESHOLDS.WEAK;
    const isStrong = subjectAvg !== undefined ? subjectAvg >= THRESHOLDS.STRONG : profile.overallAvgPct >= THRESHOLDS.STRONG;
    const isLowAtt = profile.lowAttendanceSubjects.includes(targetSubject) || profile.overallAttendancePct < THRESHOLDS.LOW_ATTENDANCE;

    if (isWeak) {
        easyPct += 15; hardPct -= 15;
        flags.push('WEAK_TOPICS');
        reasons.push(`Low performance detected`);
    } else if (isStrong) {
        hardPct += 15; easyPct -= 15;
        flags.push('STRONG_CHALLENGE');
        reasons.push(`High performance detected`);
    }

    if (isLowAtt) {
        easyPct += 10; hardPct -= 10;
        flags.push('LOW_ATTENDANCE');
        reasons.push(`Attendance risk`);
    }

    // Clamp and Normalize
    easyPct = Math.max(10, Math.min(80, easyPct));
    hardPct = Math.max(5, Math.min(60, hardPct));
    mediumPct = 100 - easyPct - hardPct;

    const easyCount = Math.round((easyPct / 100) * totalQuestions);
    const hardCount = Math.round((hardPct / 100) * totalQuestions);
    const mediumCount = totalQuestions - easyCount - hardCount;

    return {
        dist: { easyPct, mediumPct, hardPct, easyCount, mediumCount, hardCount },
        flags,
        adaptationSummary: reasons.join(' | ') || 'Default Profile'
    };
};

export const generateAdaptivePrompt = (data) => {
    // Shared prompt building logic... (keeping simplified here for space, 
    // but in a real app this would be the full buildAdaptivePrompt logic)
    return `Generate ${data.totalQuestions} questions for ${data.subjectCode} (${data.unit}). 
    Distribution: Easy ${data.dist.easyCount}, Medium ${data.dist.mediumCount}, Hard ${data.dist.hardCount}. 
    Concepts: ${data.concepts.join(', ')}. Format: JSON array.`;
};

export const generateAdaptivePaper = async (params) => {
    const { studentId, subjectCode, unit, concepts, totalQuestions = 15 } = params;

    // Resolve student
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('Student profile not found.');

    const profile = await computeStudentProfile(studentId);
    const { dist, flags, adaptationSummary } = computeDistribution(profile, subjectCode, totalQuestions);

    const prompt = generateAdaptivePrompt({ ...params, dist, profile, flags, adaptationSummary });

    const aiResponse = await callGeminiRest(prompt, [], "Adaptive Engine");
    let questions;
    try {
        const clean = aiResponse.replace(/```json|```/g, '').trim();
        questions = JSON.parse(clean);
    } catch (e) {
        logger.error('Adaptive Parse Error', e);
        throw new Error('AI failed to generate structural paper.');
    }

    const saved = await prisma.generatedPaper.create({
        data: {
            studentId: student.id,
            subjectCode,
            subjectTitle: params.subjectTitle,
            unit,
            questions: JSON.stringify(questions),
            maxMarks: questions.reduce((s, q) => s + (q.marks || 0), 0),
            questionCount: questions.length,
            difficulty: 'Adaptive',
            performanceSnapshot: JSON.stringify(profile),
            difficultyProfile: JSON.stringify(dist)
        }
    });

    return {
        paper: saved,
        performanceProfile: profile,
        difficultyProfile: dist,
        adaptationFlags: flags,
        adaptationSummary
    };
};

export const getStudentPapers = async (userId, limit = 10) => {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return [];

    return await prisma.generatedPaper.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
};
