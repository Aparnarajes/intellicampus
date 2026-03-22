import api from './api';

export const getStudents = async () => {
    const response = await api.get('/users/students');
    return response.data;
};

export const getFaculty = async () => {
    const response = await api.get('/users/faculty');
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await api.get('/users/stats');
    return response.data;
};

export const getFacultyStats = async () => {
    const response = await api.get('/users/faculty-stats');
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/student/update-profile', profileData);
        if (response.data.success) {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, ...response.data.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (storageError) {
                console.error('Error updating localStorage:', storageError);
            }
        }
        return response.data;
    } catch (error) {
        console.error('userService.updateProfile error:', error);
        throw error;
    }
};

export const getSkillRecommendations = async (profile) => {
    const response = await api.post('/ai/recommend-skills', profile);
    return response.data;
};

// Admin/Faculty specific: Get any user profile
export const getUserProfile = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// Admin/Faculty specific: Update any user profile
export const updateUserProfile = async (id, profileData) => {
    try {
        const response = await api.put(`/users/${id}`, profileData);
        return response.data;
    } catch (error) {
        console.error('userService.updateUserProfile error:', error);
        throw error;
    }
};
export const getAnnouncements = async () => {
    const response = await api.get('/users/announcements');
    return response.data;
};

export const getEvents = async (params = {}) => {
    const response = await api.get('/users/events', { params });
    return response.data;
};
