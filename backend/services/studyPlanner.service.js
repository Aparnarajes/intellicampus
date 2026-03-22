import prisma from '../config/prisma.js';
import { callGeminiRest } from '../utils/aiHelper.js';
import aiCacheService from './aiCache.service.js';
import * as TopicAnalyticsService from './topicAnalytics.service.js';
import logger from '../utils/logger.js';

/**
 * StudyPlannerService.js — SQL / Prisma Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates personalized 7-day adaptive study plans based on performance.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const generateStudyPlan = async (user) => {
  try {
    const userId = user.id;
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { profile: true }
    });

    if (!student) throw new Error('Student profile not found.');

    const profile = student.profile;
    const dailyHours = profile?.dailyStudyHours || 2;

    // 1. Fetch Academic Data
    const marks = await prisma.marks.findMany({ where: { studentId: student.id } });
    const doubts = await prisma.doubt.findMany({ where: { studentId: student.id, isWeakTopic: true } });

    await TopicAnalyticsService.updateTopicPerformace(userId);
    const weakTopicsData = await TopicAnalyticsService.getWeakTopics(userId);
    const weakTopicsList = weakTopicsData.map(t => `${t.subject}: ${t.topic}`);
    const doubtTopics = doubts.map(d => `${d.subject}: ${d.topic}`);
    const allWeakTopics = [...new Set([...weakTopicsList, ...doubtTopics])];

    const lowMarkSubjects = marks
      .filter(m => (m.marks / (m.maxMarks || 50)) < 0.5)
      .map(m => m.subjectId); // Usually subject code is better for AI prompt

    const upcomingExams = await prisma.exam.findMany({
      where: { date: { gte: new Date() } },
      include: { subject: true },
      orderBy: { date: 'asc' }
    });

    // 2. Cache Check (Daily uniquely)
    const dayKey = new Date().toISOString().split('T')[0];
    const cacheKey = { userId, featureType: 'study_plan', topic: `weekly-plan:${dayKey}` };

    // 3. Construct AI Prompt
    const prompt = `Act as an AI Academic Study Planner. Create a personalized 7-day plan.
        
        STUDENT DATA:
        - Daily Hours: ${dailyHours}
        - Focus Topics: ${allWeakTopics.slice(0, 8).join(', ')}
        - Exam Schedule: ${upcomingExams.map(e => `${e.subject.subjectCode} on ${e.date.toLocaleDateString()}`).join(', ')}

        RULES:
        1. Mix Task Types: 'learn', 'practice', 'revise'.
        2. Max ${dailyHours}h/day total.
        3. Prioritize soonest exams.

        OUTPUT: JSON ONLY. 
        {"plan": [{"day": 1, "tasks": [{"subject": "...", "topic": "...", "duration": "45m", "taskType": "practice"}]}]}`;

    const aiResponse = await callGeminiRest(prompt, [], "Study Planner AI");
    let planData;
    try {
      const clean = aiResponse.replace(/```json|```/g, '').trim();
      planData = JSON.parse(clean);
    } catch (e) {
      logger.error('CR Plan Parse Error', e);
      throw new Error('AI failed to generate structural plan.');
    }

    // 4. Persistence
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    // Delete old plans for this student
    await prisma.studyPlan.deleteMany({ where: { studentId: student.id } });

    const savedPlan = await prisma.studyPlan.create({
      data: {
        studentId: student.id,
        plan: JSON.stringify(planData.plan),
        endDate,
        startDate: new Date(),
        generatedAt: new Date()
      }
    });

    await aiCacheService.set(cacheKey, savedPlan);
    return savedPlan;
  } catch (error) {
    logger.error('StudyPlan Gen Error', error);
    throw error;
  }
};

export const getLatestStudyPlan = async (user) => {
  try {
    const userId = user.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return null;

    let plan = await prisma.studyPlan.findFirst({
      where: { studentId: student.id },
      orderBy: { generatedAt: 'desc' }
    });

    // Regenerate if no plan or older than 7 days
    if (!plan || (new Date() - new Date(plan.generatedAt)) > 1000 * 60 * 60 * 24 * 7) {
      plan = await generateStudyPlan(user);
    }

    return plan;
  } catch (error) {
    logger.error('Get StudyPlan Error', error);
    return null;
  }
};
