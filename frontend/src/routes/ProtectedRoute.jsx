import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, userData, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // AuthContext handles the main loading, but double check here
        return <div className="p-4 text-center">Checking permissions...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!userData) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (userData && allowedRoles && !allowedRoles.includes(userData.role)) {
        // Redirect based on their actua role to avoid infinite loops or 403 pages usually
        if (userData.role === 'admin') return <Navigate to="/admin" replace />;
        if (userData.role === 'super_admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
