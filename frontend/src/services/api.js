import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let CURRENT_BASE_URL = VITE_API_URL;

const api = axios.create({
    baseURL: CURRENT_BASE_URL,
    timeout: 30000, // Institutional standard (30s)
    headers: { 'Content-Type': 'application/json' }
});

const FALLBACK_URLS = [
    VITE_API_URL,
    'http://localhost:5000/api',
    'http://127.0.0.1:5000/api',
];

/**
 * Autonomous Neural Discovery
 * Proactively identifies the active scholastic engine. 
 * Prioritizes Production ENV over local vectors.
 */
export const initializeNeuralDiscovery = async () => {
    console.log(`[NEURAL_GATEWAY] Active Vector: ${CURRENT_BASE_URL}`);
    
    // In production, we assume the VITE_API_URL is the absolute source of truth.
    if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
        return { ok: true, url: VITE_API_URL };
    }

    // Dev probing protocol
    for (const url of FALLBACK_URLS) {
        try {
            const res = await axios.get(`${url.replace('/api', '')}/health`, { timeout: 2000 });
            if (res.data?.status === 'ok') {
                api.defaults.baseURL = url;
                CURRENT_BASE_URL = url;
                console.log(`[NEURAL_GATEWAY] Institutional Link established: ${url}`);
                return { ok: true, url };
            }
        } catch (err) {
            console.warn(`[NEURAL_GATEWAY] Vector ${url} unreachable.`);
        }
    }
    return { ok: false, issue: 'All scholastic vectors unresponsive (GATEWAY_OFFLINE)' };
};

// Interceptor for verbose logging and fallback
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('intellicampus_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Add correlation ID for tracing
    config.headers['x-correlation-id'] = Math.random().toString(36).substring(7);
    
    console.log(`[API_REQ] ${config.method.toUpperCase()} | ${config.baseURL}${config.url}`);
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Log deep error details
        console.error('[API_ERROR_FULL_CAPTURE]:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            code: error.code,
            config: error.config?.url
        });

        // Retry with fallback if it's a network error (backend down)
        if (!error.response && !originalRequest._retry) {
            originalRequest._retry = true;
            for (const fallback of FALLBACK_URLS) {
                console.warn(`[API_FALLBACK] Attempting connection via: ${fallback}`);
                try {
                    api.defaults.baseURL = fallback;
                    originalRequest.baseURL = fallback;
                    return await api(originalRequest);
                } catch (retryErr) {
                    console.error(`[API_FALLBACK_FAIL] ${fallback} unreachable.`);
                }
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Institutional Health Check
 */
export const checkSystemHealth = async () => {
    try {
        const res = await axios.get(`${api.defaults.baseURL}/health`, { timeout: 3000 });
        return { ok: true, status: res.data?.status || 'responsive' };
    } catch (err) {
        // Categorize Failure
        if (!err.response) return { ok: false, issue: 'Backend not running (Connection Refused)', code: 'ENGINE_OFFLINE' };
        if (err.response.status === 403) return { ok: false, issue: 'CORS Blocked (Identity Rejected)', code: 'CORS_DENIED' };
        return { ok: false, issue: err.message, code: 'UNKNOWN_FAILURE' };
    }
};

export default api;