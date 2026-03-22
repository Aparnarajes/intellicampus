import api from './api';

/**
 * academicService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised HTTP client for all faculty/student academic operations.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const academicService = {
    // ── Student ───────────────────────────────────────────────────────────────
    getStudentDashboard: async () => {
        const response = await api.get('/student/dashboard');
        return response.data;
    },

    getStudentRoadmap: async () => {
        const response = await api.get('/analytics/student/roadmap');
        return response.data;
    },

    getStudentAnalytics: async () => {
        const response = await api.get('/analytics/student/analytics');
        return response.data;
    },

    getStudentProgress: async () => {
        const response = await api.get('/analytics/student/progress');
        return response.data;
    },

    // ── Faculty — Subjects ────────────────────────────────────────────────────
    /**
     * Returns the faculty's assigned subjects with subjectId, subjectCode,
     * subjectName, section from the DB (not static local data).
     */
    getFacultySubjects: async () => {
        const response = await api.get('/faculty/subjects');
        return response.data;
    },

    // ── Faculty — Students ────────────────────────────────────────────────────
    getStudents: async () => {
        const response = await api.get('/faculty/students');
        return response.data;
    },

    getStudentsBySubject: async (subjectCode, section) => {
        const response = await api.get('/faculty/students-by-subject', {
            params: { subjectCode, section },
        });
        return response.data;
    },

    // ── Faculty — Attendance ──────────────────────────────────────────────────
    /**
     * Mark single student attendance (backward compat).
     * Prefer markAttendanceBatch for full-class saves.
     */
    markAttendance: async (data) => {
        const response = await api.post('/faculty/attendance', data);
        return response.data;
    },

    /**
     * Save attendance for an entire class in one atomic request.
     * @param {string} subjectId   - Prisma Subject ID
     * @param {string} date        - ISO date string (e.g. '2026-03-03')
     * @param {Array}  records     - [{ studentId, status: 'PRESENT'|'ABSENT' }]
     */
    markAttendanceBatch: async (subjectId, date, records) => {
        const response = await api.post('/faculty/attendance/batch', {
            subjectId,
            date,
            records,
        });
        return response.data;
    },

    getAttendanceDates: async (subjectCode) => {
        const response = await api.get('/faculty/attendance/dates', {
            params: subjectCode ? { subjectCode } : {},
        });
        return response.data;
    },

    getSessionAttendance: async (date, subjectCode) => {
        const response = await api.get('/faculty/attendance/session', {
            params: { date, subjectCode },
        });
        return response.data;
    },

    updateAttendanceRecord: async (id, status) => {
        const response = await api.put(`/faculty/attendance/${id}`, { status });
        return response.data;
    },

    // ── Faculty — Marks ───────────────────────────────────────────────────────
    /**
     * Save marks for multiple students in one request.
     * @param {string} subjectCode
     * @param {string} testType     e.g. 'IA-1', 'IA-2', 'Final'
     * @param {number} maxMarks
     * @param {Array}  marksData    [{ studentId, marks }]
     */
    saveMarksBatch: async (subjectCode, testType, maxMarks, marksData) => {
        const response = await api.post('/marks/save', {
            subjectCode,
            testType,
            maxMarks,
            marksData,
        });
        return response.data;
    },

    /** @deprecated Use saveMarksBatch instead */
    updateMarks: async (data) => {
        const response = await api.patch('/faculty/marks', data);
        return response.data;
    },

    getMarks: async (subjectCode, testType, section) => {
        const response = await api.get('/marks', {
            params: { subjectCode, testType, section },
        });
        return response.data;
    },

    getMarksAnalysis: async (subjectCode, testType) => {
        const response = await api.get('/marks/analysis', {
            params: { subjectCode, testType },
        });
        return response.data;
    },

    // ── Faculty — Assignments ─────────────────────────────────────────────────
    createAssignment: async (data) => {
        const response = await api.post('/faculty/assignments', data);
        return response.data;
    },

    getAssignmentSubmissions: async (assignmentId) => {
        const response = await api.get(`/faculty/assignments/${assignmentId}/submissions`);
        return response.data;
    },

    gradeAssignment: async (assignmentId, studentId, marksAwarded, submissionStatus = 'SUBMITTED') => {
        const response = await api.patch(
            `/faculty/assignments/${assignmentId}/grade/${studentId}`,
            { marksAwarded, submissionStatus }
        );
        return response.data;
    },
};

export default academicService;
