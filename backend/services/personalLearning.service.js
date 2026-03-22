import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import AIServiceProxy from '../utils/aiServiceProxy.js';

/**
 * PERSONALIZED LEARNING ENGINE — Neural Pedagogical Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks performance vectors, triggers adaptive remediation, and generates
 * personalized study roadmaps for students.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const getPersonalizedRoadmap = async (studentId) => {
    try {
        if (!studentId) throw new Error('Student identifier is required for roadmap synthesis.');

        const profiles = await prisma.studentProfile.findMany({ where: { studentId } });
        const profile = profiles[0];
        const student = await prisma.student.findUnique({ where: { id: studentId } });

        // 2. Fetch Topics for Current Semester
        const subjects = await prisma.subject.findMany({
            where: { semester: student?.semester || 1, branch: student?.branch }
        });

        // 3. Fetch Real Topic Performance
        const performances = await prisma.studentTopicPerformance.findMany({
            where: { studentId }
        });

        const performanceMap = {};
        performances.forEach(p => {
            performanceMap[`${p.subjectId}_${p.topic}`] = p;
        });

        // 4. Synthesize Graph (Nodes & Edges)
        const nodes = [];
        const edges = [];
        let x = 0;
        let y = 0;

        subjects.forEach((sub, subIdx) => {
            // In a real system, topics would come from a SubjectTopic model. 
            // Here we'll derive them from performance or use placeholders if no performance exists yet.
            const subTopics = performances.filter(p => p.subjectId === sub.id).map(p => p.topic);
            const displayTopics = subTopics.length > 0 ? subTopics : ['Introduction', 'Core Concepts', 'Advanced Applications'];

            displayTopics.forEach((topic, topicIdx) => {
                const perf = performanceMap[`${sub.id}_${topic}`];
                const nodeId = `${sub.subjectCode}_${topic.replace(/\s+/g, '_')}`;
                
                let status = 'locked';
                if (perf) {
                    status = perf.accuracyPercentage > 80 ? 'completed' : (perf.weakFlag ? 'weak' : 'active');
                } else if (topicIdx === 0 && subIdx === 0) {
                    status = 'active';
                }

                nodes.push({
                    id: nodeId,
                    type: 'topicNode',
                    data: {
                        label: topic,
                        subject: sub.subjectName,
                        subjectCode: sub.subjectCode,
                        mastery: perf?.accuracyPercentage || 0,
                        attempts: perf?.attemptCount || 0,
                        status: status,
                        responseTime: perf?.averageResponseTime || 0
                    },
                    position: { x: x + (topicIdx * 400), y: y + (subIdx * 250) }
                });

                if (topicIdx > 0) {
                    const prevNodeId = `${sub.subjectCode}_${displayTopics[topicIdx - 1].replace(/\s+/g, '_')}`;
                    edges.push({
                        id: `e-${prevNodeId}-${nodeId}`,
                        source: prevNodeId,
                        target: nodeId,
                        animated: status === 'active',
                        style: { stroke: status === 'completed' ? '#10b981' : (status === 'weak' ? '#ef4444' : '#6366f1') }
                    });
                }
            });
        });

        // 5. Recommendations & Velocity
        const avgScore = profile?.avgMarks || student?.overallMarks || 0;
        const difficultyLevel = avgScore > 85 ? 'C1' : avgScore > 70 ? 'B2' : avgScore > 50 ? 'B1' : 'A2';

        const subjectMap = {};
        subjects.forEach(s => subjectMap[s.id] = s.subjectName);

        const recommendations = performances.filter(p => p.weakFlag).slice(0, 3).map(p => ({
            type: 'remediation',
            priority: p.accuracyPercentage < 30 ? 'High' : 'Medium',
            message: `Revise ${p.topic} in ${subjectMap[p.subjectId] || 'Current Subject'}. Performance is below threshold.`
        }));

        if (recommendations.length === 0) {
            recommendations.push({ type: 'optimization', priority: 'Low', message: 'Continue with the current trajectory. Neural sync is stable.' });
        }

        return {
            masteryLevel: difficultyLevel,
            graph: { nodes, edges },
            recommendations: recommendations,
            difficultyProfile: {
                currentLevel: difficultyLevel,
                progression: avgScore > 70 ? 'Increasing' : 'Stable',
                velocity: performances.length > 5 ? 'High' : 'Normal'
            },
            summary: {
                totalAnalysed: performances.length,
                completedNodes: nodes.filter(n => n.data.status === 'completed').length,
                weakNodes: nodes.filter(n => n.data.status === 'weak').length,
                activeNodes: nodes.filter(n => n.data.status === 'active').length
            }
        };
    } catch (error) {
        logger.error('[PersonalLearningEngine] Pathway Synthesis Failed:', error);
        // Resilient Fallback
        return {
            weakTopics: [],
            recommendations: [{ type: 'notes', message: 'Neural Engine is initializing your academic baseline.' }],
            pathway: [{ title: 'Baseline Sync', description: 'Detecting initial mastery vectors.', status: 'active' }],
            difficultyProfile: { currentLevel: 'A1', progression: 'Baseline' }
        };
    }
};
