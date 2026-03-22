import api from './api';

/**
 * adminService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Services for managing the closed-campus pre-registration database.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Students ──────────────────────────────────────────────────────────────────

export const listStudents = (params = {}) => api.get('/admin/students', { params });

export const addStudent = (studentData) => api.post('/admin/students', studentData);

export const updateStudent = (id, studentData) => api.put(`/admin/students/${id}`, studentData);

export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

export const bulkImportStudents = (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    return api.post('/admin/students/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const bulkDeleteStudents = (ids) => api.post('/admin/students/bulk-delete', { ids });

export const exportStudentsCSV = (params = {}) => api.get('/admin/students/export', { params, responseType: 'blob' });

// ── Faculty ───────────────────────────────────────────────────────────────────

export const listFaculty = (params = {}) => api.get('/admin/faculty', { params });

export const addFaculty = (facultyData) => api.post('/admin/faculty', facultyData);

export const updateFaculty = (id, facultyData) => api.patch(`/admin/faculty/${id}`, facultyData);

export const deleteFaculty = (id) => api.delete(`/admin/faculty/${id}`);

export const bulkImportFaculty = (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    return api.post('/admin/faculty/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// ── User Controls ─────────────────────────────────────────────────────────────

export const toggleUserAccount = (userId, isActive, reason = '') =>
    api.patch(`/admin/users/${userId}/toggle`, { isActive, reason });

export const updateFacultyAssignments = (id, data) =>
    api.patch(`/admin/faculty/${id}/assignments`, data);

export const getAdminStats = () => api.get('/admin/stats');
export const getSystemHealth = () => api.get('/admin/health');

// ── Academic Infrastructure ───────────────────────────────────────────────────

export const listSubjects = (params = {}) => api.get('/academic-admin/subjects', { params });
export const createSubject = (data) => api.post('/academic-admin/subjects', data);
export const updateSubject = (id, data) => api.patch(`/academic-admin/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/academic-admin/subjects/${id}`);

// Legacy Academic Calendar (Redirect or Maintain if used elsewhere)
export const listCalendarEvents = () => api.get('/academic-admin/calendar');

// NEW Dynamic Event Matrix
export const listEvents = (params = {}) => api.get('/events', { params });
export const createEvent = (data) => api.post('/admin/events/create', data);
export const updateEvent = (id, data) => api.put(`/admin/events/${id}/update`, data);
export const deleteEvent = (id) => api.delete(`/admin/events/${id}/delete`);

export const listAnnouncements = () => api.get('/academic-admin/announcements');
export const createAnnouncement = (data) => api.post('/academic-admin/announcements', data);
export const deleteAnnouncement = (id) => api.delete(`/academic-admin/announcements/${id}`);

export default {
    listStudents, addStudent, updateStudent, deleteStudent, bulkImportStudents, bulkDeleteStudents, exportStudentsCSV,
    listFaculty, addFaculty, updateFaculty, deleteFaculty, bulkImportFaculty,
    toggleUserAccount, getAdminStats, updateFacultyAssignments, getSystemHealth,
    listSubjects, createSubject, updateSubject, deleteSubject,
    listCalendarEvents,
    listEvents, createEvent, updateEvent, deleteEvent,
    listAnnouncements, createAnnouncement, deleteAnnouncement
};
