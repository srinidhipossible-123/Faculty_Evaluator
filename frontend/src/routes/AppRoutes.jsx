import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LandingPage from '../features/landing/LandingPage';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import DashboardLayout from '../components/layout/DashboardLayout';
import FacultyDashboard from '../features/dashboard/FacultyDashboard';
import AdminDashboard from '../features/admin/AdminDashboard';
import SuperAdminPanel from '../features/admin/SuperAdminPanel';
import QuizEngine from '../features/quiz/QuizEngine';
import { ROLES } from '../lib/constants';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes wrapped in DashboardLayout */}
            <Route element={<DashboardLayout />}>
                {/* Participant Routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.PARTICIPANT, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/dashboard" element={<FacultyDashboard />} />
                    <Route path="/quiz" element={<QuizEngine />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* Super Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                    <Route path="/super-admin" element={<SuperAdminPanel />} />
                </Route>
            </Route>

            {/* Default Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
