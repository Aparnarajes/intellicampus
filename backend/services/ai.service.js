import dotenv from 'dotenv';
import prisma from '../config/prisma.js';
import { callGeminiRest } from '../utils/aiHelper.js';
import aiCacheService from './aiCache.service.js';
import * as RagService from './rag.service.js';
import logger from '../utils/logger.js';
import AIServiceProxy from '../utils/aiServiceProxy.js';

dotenv.config();

/**
 * INTELLIGENCE ENGINE v2.2 — SQL / Prisma Edition
 */

export const getStudentPredictiveAnalytics = async (studentId, user = {}) => {
    const userIdStr = String(studentId);
    const topic = `predictive-analytics:${userIdStr}`;

    try {
        const { result, metadata, fromCache } = await aiCacheService.wrap(
            { userId: userIdStr, featureType: 'questions', topic },
            async () => {
                // 1. Collect Multi-Domain Data from Prisma
                const marks = await prisma.marks.findMany({
                    where: { studentId: userIdStr },
                    include: { subject: true }
                });

                const attendance = await prisma.attendance.findMany({
                    where: { studentId: userIdStr }
                });

                // 2. Aggregate Metrics
                const totalPossible = marks.reduce((acc, m) => acc + (m.maxMarks || 50), 0);
                const totalScored = marks.reduce((acc, m) => acc + m.marks, 0);
                const avgScore = totalPossible > 0 ? (totalScored / totalPossible) * 100 : 0;

                const totalSessions = attendance.length;
                const totalPresent = attendance.filter(s => s.status === 'PRESENT').length;
                const attendRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

                // 3. AI Predictive Inference (Microservice-first, then LLM)
                const studentVector = { avgMarks: avgScore, attendanceRate: attendRate, assessmentCount: marks.length };
                
                const mlResults = await AIServiceProxy.predictFailureRisk(studentVector);
                
                // Detailed Analysis Prompt for Gemini
                const prompt = `Act as an Educational Data Scientist. Analyze this student performance vector:
        - Academic Score Percentage: ${avgScore.toFixed(2)}%
        - Attendance Rate: ${attendRate.toFixed(2)}%
        - ML Prediction: Risk: ${mlResults.risk}, Probability: ${mlResults.probability}
        - Total Data Points: ${marks.length} Assessments, ${totalSessions} Attendance Records.

        Deliver a JSON response with:
        1. 'successProbability': (0-100) probability of passing semester.
        2. 'primaryRisk': High/Medium/Low based on ML and Heuristics.
        3. 'predictedGrade': Expected Final Grade (S/A/B/C/D/F) based on current trajectory.
        4. 'actionableStrategy': One high-impact study recommendation for this specific trajectory.
        5. 'correlationInsight': How their attendance trends are impacting their marks specifically.
        
        ONLY return raw JSON. No markdown.`;

                const responseText = await callGeminiRest(
                    prompt,
                    [],
                    'You are a state-of-the-art Predictive Learning Model v2.2.'
                );

                const cleanedJson = responseText.replace(/```json|```/g, '').trim();
                const aiResult = JSON.parse(cleanedJson);

                return {
                    result: aiResult,
                    modelName: 'gemini',
                    tokenUsage: 0,
                };
            }
        );

        return { ...result, _cache: metadata };
    } catch (error) {
        logger.error('Predictive Analytics failed:', error);
        throw error;
    }
};

export const getBatchIntelligence = async (batch) => {
    const topic = `batch-intelligence:${batch}`;
    const [branch, section] = batch?.split(' ') || [];

    try {
        const { result } = await aiCacheService.wrap(
            { userId: 'batch', featureType: 'questions', topic },
            async () => {
                const marksData = await prisma.marks.findMany({
                    where: { student: { branch: branch || undefined, section: section || undefined } },
                    take: 20
                });
                const attendanceDataCount = await prisma.attendance.count({
                    where: { student: { branch: branch || undefined, section: section || undefined } }
                });

                const prompt = `Analyze Batch Data for '${batch}':
        - Assessment Count: ${marksData.length}
        - Attendance Records: ${attendanceDataCount}
        - Data Samples: ${JSON.stringify(marksData.slice(0, 10))}

        Task: Identify exactly ONE non-obvious pedagogical pattern or trend.
        Return a professional insight string (max 30 words).`;

                const insight = await callGeminiRest(
                    prompt,
                    [],
                    'Process batch metadata and extract pedagogical signals.'
                );

                return {
                    result: insight,
                    modelName: 'gemini',
                    tokenUsage: 0,
                };
            }
        );

        return result;
    } catch (error) {
        logger.error('Batch Intelligence failed:', error);
        return "Unable to generate batch patterns at this time.";
    }
};

export const generateAINotes = async ({
    userId,
    role,
    subjectCode,
    unit,
    prompt,
    modelName = 'gemini',
}) => {
    const topic = `${subjectCode}:${unit}`;

    try {
        return await aiCacheService.wrap(
            { userId: String(userId), featureType: 'notes', topic },
            async () => {
                // 1. Attempt to use specialized Python Microservice
                const microserviceResult = await AIServiceProxy.generateNotes(prompt);
                if (microserviceResult) {
                    return { result: microserviceResult, modelName: 'python-microservice', tokenUsage: 0 };
                }

                // 2. Fallback to Gemini LLM with RAG Context
                let ragContext = "";
                try {
                    const searchResults = await RagService.semanticSearch(prompt, subjectCode, userId, 3);
                    if (searchResults.length > 0) {
                        ragContext = `\nSOURCE DOCUMENTS CONTEXT:\n${searchResults.join("\n---\n")}\n`;
                    }
                } catch (err) {
                    logger.warn("RAG Context fetch failed:", err.message);
                }

                const finalPrompt = `Act as an expert Engineering Professor. Generate high-quality, structured academic notes based on the following context.
                
                ${ragContext}
                
                USER TOPIC/REQUEST: ${prompt}
                
                REQUIRED STRUCTURE:
                1. 📖 FORMAL DEFINITION: Precise technical definition of the concept.
                2. 🔬 CORE MECHANISMS/PRINCIPLES: Detailed explanation of how it works.
                3. 💡 REAL-WORLD EXAMPLES: At least 2 industry or engineering applications.
                4. 📝 COMPREHENSIVE SUMMARY: A 3-sentence executive summary.
                5. ❓ POTENTIAL EXAM QUESTIONS: 2-3 questions for self-assessment.
                
                Format the response in professional Markdown with clear headings.`;

                const responseText = await callGeminiRest(
                    finalPrompt,
                    [],
                    'Engineering Pedagogy Model v4.0'
                );

                if (!responseText || responseText.trim() === '') {
                    throw new Error('AI returned an empty response. The model may be rate-limited — please try again in a moment.');
                }

                return { result: responseText, modelName, tokenUsage: 0 };
            }
        );
    } catch (error) {
        logger.error('AI Notes generation failed:', error);
        throw error;
    }
};

export const generateMockTest = async ({
    userId,
    role,
    subjectCode,
    unit,
    prompt,
    modelName = 'gemini',
}) => {
    const topic = `mocktest:${subjectCode}:${unit}`;

    try {
        return aiCacheService.wrap(
            { userId: String(userId), featureType: 'mocktest', topic },
            async () => {
                const responseText = await callGeminiRest(
                    prompt,
                    [],
                    'You are an expert Engineering University Examiner generating MCQ test questions.'
                );
                return { result: responseText, modelName, tokenUsage: 0 };
            }
        );
    } catch (error) {
        logger.error('Mock Test generation failed:', error);
        throw error;
    }
};

export const invalidateUserCache = async (userId) => {
    return aiCacheService.invalidate(String(userId));
};
