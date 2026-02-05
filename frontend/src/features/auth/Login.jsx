import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginType, setLoginType] = useState('faculty');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const email = formData.email.trim();
      const hasAt = email.includes('@');
      const domainPart = hasAt ? email.split('@')[1] : '';
      const hasDotInDomain = domainPart.includes('.');
      if (!hasAt || !hasDotInDomain) {
        throw new Error('Please enter a valid email like "super@faculty.com".');
      }
      const data = await api.auth.login(email, formData.password);
      const token = data.token;
      const userData = data.user || data;
      if (!token || !userData) {
        throw new Error('Invalid response from server.');
      }
      const role = userData.role;
      if (loginType === 'admin') {
        if (role !== 'admin' && role !== 'super_admin') {
          throw new Error('Access Denied: You are not an Administrator.');
        }
        login(token, userData);
        navigate('/admin');
      } else {
        if (role === 'admin' || role === 'super_admin') {
          throw new Error('Please use the Admin Login portal.');
        }
        login(token, userData);
        if (!userData.quizAttempted) navigate('/quiz');
        else navigate('/dashboard');
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network error')) {
        setError('Cannot reach backend. Ensure it is running and proxy is configured.');
      } else {
        setError(msg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random(),
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
      </div>
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-white/20 relative z-10">
        <div>
          <h2 className="mt-2 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-white">
            {loginType === 'admin' ? 'Admin Portal' : 'Faculty Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-white/80">Faculty Evaluation System</p>
          <div className="mt-4 text-center">
            <Link to="/" className="inline-block px-3 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30 border border-white/30">
              Home
            </Link>
          </div>
        </div>
        <div className="flex bg-white/20 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLoginType('faculty')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'faculty' ? 'bg-white text-purple-600 shadow-lg' : 'text-white hover:text-white/80'
            }`}
          >
            Faculty Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginType === 'admin' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:text-white/80'
            }`}
          >
            Admin Login
          </button>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-red-200 bg-red-500/20 rounded border border-red-300 text-sm text-center">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={loginType === 'admin' ? 'Admin Email' : 'Faculty Email'}
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 shadow-lg transition-all ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
              }`}
            >
              {loading ? <LoadingSpinner size={20} className="text-white" /> : loginType === 'admin' ? 'Sign In as Admin' : 'Sign In'}
            </button>
          </div>
          {loginType === 'faculty' && (
            <div className="text-center text-sm">
              <Link to="/register" className="font-medium text-white hover:text-white/80 underline">
                Don't have an account? Sign up
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
