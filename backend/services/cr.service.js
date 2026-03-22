import prisma from '../config/prisma.js';
import NotificationService from './notification.service.js';
import * as AiService from './ai.service.js';
import { callGeminiRest } from '../utils/aiHelper.js';
import * as AnalyticsService from './analytics.service.js';
import aiCacheService from './aiCache.service.js';
import * as StudyPlannerService from './studyPlanner.service.js';
import * as RagService from './rag.service.js';
import * as TopicAnalyticsService from './topicAnalytics.service.js';
import logger from '../utils/logger.js';

/**
 * CRService.js — SQL / Prisma Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * The automated Class Representative (CR) engine.
 * Handles student interactions, pedagogical doubling, and proactive mentoring.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class CRService {
    // 1. Tool Implementation: Fetch Attendance
    async getAttendance(studentId) {
        const records = await prisma.attendance.findMany({
            where: { studentId },
            include: { subject: true }
        });

        const present = records.filter(r => r.status === 'PRESENT').length;
        const total = records.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        // Subject-wise breakdown
        const subjectWise = {};
        records.forEach(r => {
            const code = r.subject.subjectCode;
            if (!subjectWise[code]) subjectWise[code] = { name: r.subject.subjectName, present: 0, total: 0 };
            subjectWise[code].total++;
            if (r.status === 'PRESENT') subjectWise[code].present++;
        });

        const breakdown = Object.entries(subjectWise).map(([code, stats]) => ({
            subject: code,
            name: stats.name,
            percentage: ((stats.present / stats.total) * 100).toFixed(1),
            present: stats.present,
            total: stats.total
        }));

        return { percentage, total, present, breakdown };
    }

    // 2. Tool Implementation: Fetch Marks
    async getMarks(studentId) {
        const marks = await prisma.marks.findMany({
            where: { studentId },
            include: { subject: true },
            orderBy: { createdAt: 'desc' }
        });

        return marks.map(m => ({
            subject: m.subject.subjectCode,
            subjectName: m.subject.subjectName,
            marks: m.marks,
            maxMarks: m.maxMarks,
            percentage: ((m.marks / (m.maxMarks || 50)) * 100).toFixed(1),
            type: m.testType || 'Regular Assessment',
            date: m.createdAt.toLocaleDateString()
        }));
    }

    // 3. Tool Implementation: Fetch Upcoming Exams
    async getUpcomingExams(batch) {
        // Find subjects associated with this batch/student through attendance or subjects
        return await prisma.exam.findMany({
            where: {
                date: { gte: new Date() }
            },
            include: { subject: true },
            orderBy: { date: 'asc' }
        });
    }

    // 4. Tool Implementation: Fetch Assignments
    async getAssignments(batch) {
        return await prisma.assignment.findMany({
            where: {
                dueDate: { gte: new Date() }
            },
            include: { subject: true },
            orderBy: { dueDate: 'asc' }
        });
    }

    // 5. Tool Implementation: Fetch Academic Calendar
    async getAcademicCalendar() {
        return await prisma.academicCalendar.findMany({
            orderBy: { startDate: 'asc' },
            take: 10
        });
    }

    // 6. Tool Implementation: Fetch Announcements
    async getAnnouncements(batch) {
        const branch = batch?.split(' ')[0] || 'All';
        return await prisma.announcement.findMany({
            where: {
                OR: [
                    { targetBatch: 'All' },
                    { targetBatch: { contains: branch } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
    }

    // 7. Tool Implementation: Tutor Mode Doubt Solver
    async solveDoubtWithTutorMode(user, question, chatHistory = []) {
        const studentId = user.prismaId;
        const student = await prisma.student.findUnique({ 
            where: { id: studentId },
            include: { user: true }
        });
        if (!student) return { type: 'text', content: "Student profile not found." };

        // Step 1: Detect Subject/Topic
        const detectionPrompt = `Analyze this student academic question: "${question}". Respond ONLY in JSON: {"subject": "...", "topic": "...", "isFundamental": boolean}`;
        const detectionResponse = await callGeminiRest(detectionPrompt, [], "Subject Detection Model");

        let detection;
        try {
            const cleanJson = detectionResponse.replace(/```json|```/g, '').trim();
            detection = JSON.parse(cleanJson);
        } catch (e) {
            detection = { subject: 'General', topic: 'Concept', isFundamental: false };
        }

        // Step 1.5: RAG Context
        let ragContext = "";
        try {
            const contextBlocks = await RagService.semanticSearch(question, detection.subject, userId, 3);
            if (contextBlocks.length > 0) {
                ragContext = `\nGROUNDING DATA (from Syllabus/Notes):\n${contextBlocks.join("\n---\n")}\n`;
            }
        } catch (err) {
            logger.error("CR RAG error:", err);
        }

        // Step 2: Difficulty Adaptation
        const marks = await prisma.marks.findMany({
            where: { studentId: student.id, subject: { subjectName: { contains: detection.subject } } }
        });

        let difficulty = 'Standard';
        let studentPerformance = 'Average';
        if (marks.length > 0) {
            const avg = (marks.reduce((a, b) => a + (b.marks / (b.maxMarks || 50)), 0) / marks.length) * 100;
            if (avg < 40) { difficulty = 'Basic'; studentPerformance = 'Weak'; }
            else if (avg > 85) { difficulty = 'Advanced'; studentPerformance = 'Strong'; }
        }

        // Step 3: Generate Explanation
        const topicKey = `doubt:${detection.subject}:${detection.topic}:${question}`;
        const { result: answer } = await aiCacheService.wrap(
            { userId, featureType: 'doubts', topic: topicKey },
            async () => {
                const tutorPrompt = `Act as an expert Academic Tutor. The student is ${studentPerformance} in ${detection.subject}. 
                Provide a ${difficulty} level explanation:
                Question: "${question}"
                Topic: ${detection.topic}
                
                ${ragContext}

                Format:
                1. CONCEPT EXPLANATION
                2. EXAMPLE
                3. STEP-BY-STEP SOLUTION
                4. QUICK REVISION POINTS`;

                const res = await callGeminiRest(tutorPrompt, chatHistory, "Expert Tutor Mode Active");
                return { result: res };
            }
        );

        // Step 4: Persist Doubt
        await prisma.doubt.create({
            data: {
                studentId: student.id,
                subject: detection.subject,
                topic: detection.topic,
                question,
                answer,
                isWeakTopic: studentPerformance === 'Weak' || detection.isFundamental
            }
        });

        return {
            type: 'tutor',
            cardType: 'TUTOR',
            content: answer,
            data: { subject: detection.subject, topic: detection.topic, difficulty }
        };
    }

    // 8. Proactive warnings
    async getProactiveWarnings(user) {
        await NotificationService.runSmartTriggers(user);
        const unread = await NotificationService.getUnread(user.id);
        if (unread.length === 0) return null;

        const prompt = `Based on these student alerts: ${JSON.stringify(unread.slice(0, 3).map(n => n.message))}. Create a VERY concise, proactive summary.`;
        const summary = await callGeminiRest(prompt, [], "Proactive CR Agent");

        return { message: summary, alerts: unread };
    }

    // Context Memory Management
    async getMemoryContext(studentId) {
        const memories = await prisma.studentMemory.findMany({
            where: { studentId },
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        if (memories.length === 0) return "No prior context.";
        return memories.map(m => `[Topic: ${m.topic}] ${m.summary}`).join('\n');
    }

    async saveInteractionMemory(studentId, message, responseContent) {
        try {
            const summaryPrompt = `Summarize this interaction into ONE concise sentence for memory: "${message}"`;
            const summary = await callGeminiRest(summaryPrompt, [], "Memory Summarizer");

            const topicPrompt = `Identify the main academic topic: "${message}". One phrase.`;
            const topic = await callGeminiRest(topicPrompt, [], "Topic Identifier");

            await prisma.studentMemory.create({
                data: {
                    studentId,
                    topic: topic.trim(),
                    summary: summary.trim()
                }
            });

            // Cleanup
            const count = await prisma.studentMemory.count({ where: { studentId } });
            if (count > 10) {
                const oldest = await prisma.studentMemory.findMany({
                    where: { studentId },
                    orderBy: { timestamp: 'asc' },
                    take: count - 10
                });
                await prisma.studentMemory.deleteMany({
                    where: { id: { in: oldest.map(o => o.id) } }
                });
            }
        } catch (err) {
            logger.error('Error saving memory:', err);
        }
    }

    async handleCRRequest(user, message, chatHistory) {
        const studentId = user.prismaId;

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { profile: true }
        });

        if (!student) return { type: 'text', content: "Student profile not found in academic engine." };
        let profile = student.profile;

        if (!profile || (new Date() - new Date(profile.lastUpdated)) > 1000 * 60 * 60 * 24 * 7) {
            const updated = await AnalyticsService.updateStudentPerformanceProfile(student.id);
            profile = updated;
        }

        const memoryContext = await this.getMemoryContext(student.id);
        const studentInfo = `Name: ${user.name}, Batch: ${user.batch || 'General'}, Profile: ${student.fullName}`;

        const toolDefinitions = [
            { name: "getAttendance", description: "Get attendance breakdown." },
            { name: "getMarks", description: "Get scores." },
            { name: "getUpcomingExams", description: "Fetch exam dates." },
            { name: "getAssignments", description: "Toggle pending assignments." },
            { name: "solveDoubt", description: "Academic tutor mode using RAG." },
            { name: "getStudyPlan", description: "Fetch 7-day adaptive plan." }
        ];

        const orchestrationPrompt = `You are the AI CR for ${studentInfo}. Help the student with their request: "${message}". Recent Context: ${memoryContext}. Respond with JSON {"tool": "..."} or direct text.`;
        const aiResponse = await callGeminiRest(orchestrationPrompt, chatHistory, "CR Orchestrator");

        let toolCall;
        try {
            const clean = aiResponse.replace(/```json|```/g, '').trim();
            toolCall = JSON.parse(clean);
        } catch (e) {
            return { type: 'text', content: aiResponse };
        }

        if (toolCall && toolCall.tool) {
            let toolData;
            let cardType = null;

            switch (toolCall.tool) {
                case 'getAttendance': toolData = await this.getAttendance(student.id); cardType = 'ATTENDANCE'; break;
                case 'getMarks': toolData = await this.getMarks(student.id); cardType = 'MARKS'; break;
                case 'getUpcomingExams': toolData = await this.getUpcomingExams(user.batch); cardType = 'EXAMS'; break;
                case 'getAssignments': toolData = await this.getAssignments(user.batch); cardType = 'ASSIGNMENTS'; break;
                case 'solveDoubt': return await this.solveDoubtWithTutorMode(user, message, chatHistory);
                case 'getStudyPlan': toolData = await StudyPlannerService.getLatestStudyPlan(user); cardType = 'STUDY_PLAN'; break;
                default: return { type: 'text', content: aiResponse };
            }

            const naturalPrompt = `Summarize this data for the student: ${JSON.stringify(toolData)}. Add [CARD:${cardType}] at the end.`;
            const summary = await callGeminiRest(naturalPrompt, [], "AI CR Assistant");

            this.saveInteractionMemory(student.id, message, summary).catch(e => { });

            return { type: 'hybrid', content: summary, data: toolData, cardType };
        }

        return { type: 'text', content: aiResponse };
    }
}

export default new CRService();
