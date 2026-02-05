import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import { INITIAL_BATCHES, DESIGNATIONS } from '../../lib/dbSetup';
import { normalizeBatch, denormalizeBatch } from '../../utils/batchUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [designations, setDesignations] = useState(DESIGNATIONS);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    designation: '',
    department: '',
    batch: '',
  });

  useEffect(() => {
    api.config
      .get()
      .then((data) => {
        if (data.batches?.length) setBatches(data.batches.map(b => normalizeBatch(b)));
        if (data.designations?.length) setDesignations(data.designations);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    try {
      const payload = { ...formData, batch: denormalizeBatch(formData.batch) };
      const { token, user } = await api.auth.register(payload);
      login(token, user);
      navigate('/quiz');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          <h2 className="mt-2 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-white">Faculty Registration</h2>
          <p className="mt-2 text-center text-sm text-white/80">Faculty Evaluation System</p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-red-200 bg-red-500/20 rounded border border-red-300 text-sm text-center">{error}</div>
          )}
          <div className="space-y-4">
            <input
              name="name"
              type="text"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              name="employeeId"
              type="text"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleChange}
            />
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                name="designation"
                required
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={formData.designation}
                onChange={handleChange}
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                name="department"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
              />
            </div>
            <select
              name="batch"
              required
              className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.batch}
              onChange={handleChange}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 transition-all shadow-lg"
            >
              {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Create Account & Start Quiz'}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-white hover:text-white/80 underline">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
