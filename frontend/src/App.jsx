import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import SystemStatus from './components/common/SystemStatus';
import { initializeNeuralDiscovery } from './services/api';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetupPassword from './pages/auth/SetupPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageStudents from './pages/admin/ManageStudents';
import AssignSubjects from './pages/admin/AssignSubjects';
import ManageSubjects from './pages/admin/ManageSubjects';
import AcademicCalendar from './pages/admin/AcademicCalendar';
import Announcements from './pages/admin/Announcements';
import Reports from './pages/admin/Reports';
import AcademicIntelligence from './pages/admin/AcademicIntelligence';
import Security from './pages/admin/Security';
import AdminLayout from './components/admin/AdminLayout';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdaptivePaper from './pages/faculty/AdaptivePaper';
import MarkAttendance from './pages/faculty/MarkAttendance';
import StudentList from './pages/faculty/StudentList';
import AttendanceHistory from './pages/faculty/AttendanceHistory';
import MarksEntry from './pages/faculty/MarksEntry';
import SubjectDashboard from './pages/faculty/SubjectDashboard';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import NotesView from './pages/student/NotesView';
import QuestionPaper from './pages/student/QuestionPaper';
import YoutubeHelper from './pages/student/YoutubeHelper';
import Chatbot from './pages/student/Chatbot';
import AttendanceView from './pages/student/AttendanceView';
import MarksView from './pages/student/MarksView';
import Profile from './pages/student/Profile';
import AcademicDashboard from './pages/student/AcademicDashboard';
import AdvancedAnalytics from './pages/student/AdvancedAnalytics';
import PersonalLearningRoadmap from './pages/student/PersonalLearningRoadmap';
import AcademicManagement from './pages/faculty/AcademicManagement';

// Shared Analytics
const AnalyticsDashboard = lazy(() => import('./pages/shared/AnalyticsDashboard'));

const AppLayout = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    const role = user.role.toLowerCase();
    const themeClass = `theme-${role}`;

    return (
        <div className={`min-h-screen flex flex-col ${themeClass}`}>
            <SystemStatus />
            <Navbar />
            <div className="flex flex-1">
                <Sidebar themeClass={themeClass} />
                <main className="flex-1 lg:ml-72 p-6 lg:p-10 transition-all duration-500 overflow-x-hidden">
                    <div className="max-w-[1600px] mx-auto">
                        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-slate-500">Loading...</div>}>
                            <Outlet />
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

function AppRoutes() {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Initialising Ecosystem...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
            {!user && <SystemStatus />}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup-password" element={<SetupPassword />} />
                
                {/* Standard Layout Routes (Student/Faculty) */}
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to={`/${user?.role?.toLowerCase() || 'login'}`} replace />} />
                    
                    <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
                        <Route path="faculty" element={<AcademicManagement />} />
                        <Route path="faculty/adaptive-paper" element={<AdaptivePaper />} />
                        <Route path="faculty/students" element={<StudentList />} />
                        <Route path="faculty/mark-attendance" element={<MarkAttendance />} />
                        <Route path="faculty/marks" element={<MarksEntry />} />
                        <Route path="faculty/subject/:subjectCode" element={<SubjectDashboard />} />
                        <Route path="faculty/history" element={<AttendanceHistory />} />
                        <Route path="faculty/analytics" element={<AcademicManagement />} />
                        <Route path="faculty/profile/:id?" element={<Profile />} />
                        <Route path="faculty/calendar" element={<AcademicCalendar />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                        <Route path="student" element={<AcademicDashboard />} />
                        <Route path="student/notes" element={<NotesView />} />
                        <Route path="student/questions" element={<QuestionPaper />} />
                        <Route path="student/youtube" element={<YoutubeHelper />} />
                        <Route path="student/chatbot" element={<Chatbot />} />
                        <Route path="student/attendance" element={<AttendanceView />} />
                        <Route path="student/marks" element={<MarksView />} />
                        <Route path="student/analytics" element={<AdvancedAnalytics />} />
                        <Route path="student/roadmap" element={<PersonalLearningRoadmap />} />
                        <Route path="student/profile/:id?" element={<Profile />} />
                        <Route path="student/calendar" element={<AcademicCalendar />} />
                    </Route>
                </Route>

                {/* DEDICATED ADMIN PORTAL (Separate Layout) */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="admin" element={<AdminDashboard />} />
                        <Route path="admin/faculty" element={<ManageFaculty />} />
                        <Route path="admin/students" element={<ManageStudents />} />
                        <Route path="admin/subjects" element={<ManageSubjects />} />
                        <Route path="admin/calendar" element={<AcademicCalendar />} />
                        <Route path="admin/announcements" element={<Announcements />} />
                        <Route path="admin/assign" element={<AssignSubjects />} />
                        <Route path="admin/reports" element={<Reports />} />
                        <Route path="admin/security" element={<Security />} />
                        <Route path="admin/academic-intelligence" element={<AcademicIntelligence />} />
                        <Route path="admin/analytics" element={<AnalyticsDashboard />} />
                        <Route path="admin/profile" element={<Profile />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

function App() {
    useEffect(() => {
        initializeNeuralDiscovery();
    }, []);

    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
