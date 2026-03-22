import api from './api';

// AI generation can take time due to retry + model fallback logic
const AI_TIMEOUT = { timeout: 90000 };

const aiService = {
    chat: async (message, history) => {
        try {
            const response = await api.post('/ai/chat', { message, history });
            return response.data;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    },
    getHistory: async () => {
        try {
            const response = await api.get('/ai/history');
            return response.data;
        } catch (error) {
            console.error('AI History Error:', error);
            throw error;
        }
    },
    clearHistory: async () => {
        try {
            const response = await api.delete('/ai/history');
            return response.data;
        } catch (error) {
            console.error('AI Clear History Error:', error);
            throw error;
        }
    },
    getAttendanceInsight: async (stats) => {
        try {
            const response = await api.post('/ai/attendance-insight', { stats });
            return response.data;
        } catch (error) {
            console.error('AI Insight Error:', error);
            throw error;
        }
    },
    generateNotes: async ({ subjectCode, unit, prompt, modelName }) => {
        try {
            const response = await api.post('/ai/generate-notes', { subjectCode, unit, prompt, modelName }, AI_TIMEOUT);
            return response.data;
        } catch (error) {
            console.error('AI Generate Notes Error:', error);
            throw error;
        }
    },
    generateMockTestFromNotes: async ({ subjectCode, unit, prompt }) => {
        try {
            const response = await api.post('/ai/generate-mocktest', { subjectCode, unit, prompt }, AI_TIMEOUT);
            return response.data;
        } catch (error) {
            console.error('AI Generate MockTest Error:', error);
            throw error;
        }
    },
    solveDoubt: async (question, history) => {
        try {
            const response = await api.post('/ai/doubt', { question, history });
            return response.data;
        } catch (error) {
            console.error('AI Doubt Error:', error);
            throw error;
        }
    },
    getProactiveNotifications: async () => {
        try {
            const response = await api.get('/notifications/proactive');
            return response.data;
        } catch (error) {
            console.error('AI Proactive Error:', error);
            throw error;
        }
    }
};

export default aiService;