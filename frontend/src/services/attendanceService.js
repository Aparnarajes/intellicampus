import api from './api';

export const markAttendance = async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
};

// Student fetches their OWN attendance (uses JWT token, no ID needed)
export const getMyAttendance = async () => {
    const response = await api.get('/attendance/me');
    return response.data;
};

// Used by faculty/admin to look up a specific student by ID
export const getStudentAttendance = async (studentId) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
};

export const getBatchAttendance = async (batch, subject) => {
    const response = await api.get('/attendance/batch', {
        params: { batch, subject }
    });
    return response.data;
};

// Fetch all records for a specific date, subject, and batch
export const getSessionAttendance = async (date, subject, batch) => {
    const response = await api.get('/attendance/session', {
        params: { date, subject, batch }
    });
    return response.data;
};

// Get dates that have attendance records
export const getAttendanceDates = async (subject, batch) => {
    const response = await api.get('/attendance/dates', {
        params: { subject, batch }
    });
    return response.data;
};

// Update a single record (status)
export const updateAttendanceRecord = async (id, status) => {
    const response = await api.put(`/attendance/${id}`, { status });
    return response.data;
};