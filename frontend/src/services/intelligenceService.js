import api from './api';

export const getStudentPredictiveScore = async () => {
    const response = await api.get('/intelligence/predictive-score');
    return response.data;
};

export const getBatchPatterns = async (batch) => {
    const response = await api.get(`/intelligence/batch-patterns/${batch}`);
    return response.data;
};
