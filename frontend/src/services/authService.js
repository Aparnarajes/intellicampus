import api from './api';

const TOKEN_KEY = 'intellicampus_token';
const USER_KEY = 'intellicampus_user';

/**
 * Login with email + password
 */
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { token, user };
};

/**
 * Register a new student
 */
export const registerUser = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
};

/**
 * Resend verification email
 */
export const resendVerification = async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
};

/**
 * Forgot password - request reset link
 */
export const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
};

/**
 * Get current profile
 */
export const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
};

/**
 * Update profile
 */
export const updateProfile = async (profileData) => {
    const response = await api.patch('/auth/profile', profileData);
    const { user } = response.data;
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return response.data;
};

/**
 * Logout
 */
export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (err) {
        console.error('Logout error:', err);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const isAuthenticated = () => !!getToken();

/**
 * Initiate account setup (First-time login)
 */
export const initiateSetup = async (email) => {
    const response = await api.post('/auth/initiate-setup', { email });
    return response.data;
};

export default { 
    login, 
    registerUser, 
    initiateSetup,
    verifyEmail, 
    resendVerification, 
    forgotPassword, 
    resetPassword, 
    getProfile, 
    updateProfile,
    logout, 
    getToken, 
    getStoredUser, 
    isAuthenticated 
};