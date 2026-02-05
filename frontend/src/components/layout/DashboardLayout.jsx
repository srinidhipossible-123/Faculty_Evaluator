import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ClipboardCheck, Users, Settings, LogOut, Menu, X, ShieldAlert, Sparkles } from 'lucide-react';
import { ROLES } from '../../lib/constants';
import logo from '../../assets/logo.png';

const DashboardLayout = () => {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navItems = [];

    // Define navigation based on roles
    if (userData?.role === ROLES.PARTICIPANT) {
        navItems.push({ label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard });
        navItems.push({ label: 'Take Quiz', path: '/quiz', icon: ClipboardCheck });
    }

    if (userData?.role === ROLES.ADMIN || userData?.role === ROLES.SUPER_ADMIN) {
        navItems.push({ label: 'Admin Dashboard', path: '/admin', icon: Users });
    }

    if (userData?.role === ROLES.SUPER_ADMIN) {
        navItems.push({ label: 'Super Admin Panel', path: '/super-admin', icon: ShieldAlert });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex relative overflow-hidden">
            {/* Cosmic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-purple-200/30 animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            opacity: Math.random() * 0.5 + 0.2,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 2 + 2}s`
                        }}
                    />
                ))}
            </div>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/90 backdrop-blur-md border-r border-purple-200/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-purple-200/50 bg-gradient-to-r from-purple-500 to-indigo-500">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="text-yellow-300" size={24} />
                        <span className="text-xl font-bold text-white">FacultyEval</span>
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {userData && (
                        <div className="px-4 py-3 mb-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200/50">
                            <p className="text-sm font-medium text-purple-900">{userData.name}</p>
                            <p className="text-xs text-purple-600 capitalize">{userData.role.replace('_', ' ')}</p>
                        </div>
                    )}

                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg cosmic-glow'
                                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                                }`
                            }
                        >
                            <item.icon size={20} className="mr-3" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-purple-200/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} className="mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white/90 backdrop-blur-md border-b border-purple-200/50 shadow-sm">
                    <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center space-x-2">
                        <img src={logo} alt="GMU" className="h-6 w-6 rounded-sm object-contain" />
                        <span className="text-lg font-semibold text-gray-900">GMU Evaluator</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-700 p-2"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Desktop Header with Logout */}
                <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white/90 backdrop-blur-md border-b border-purple-200/50 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="text-purple-500" size={24} />
                        <span className="text-xl font-bold text-gray-900">FacultyEval</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{userData?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <div className="relative">
                        {/* Logout button in top-right corner */}
                        <button
                            onClick={handleLogout}
                            className="fixed top-4 right-4 z-50 lg:hidden p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
