import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../config/api';
import { Trophy, Star, LogIn, UserPlus, Sparkles, Users, X } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import logo from '../../assets/logo.png';
import sriImg from '../../assets/sri.jpeg';
import saiImg from '../../assets/sai.jpeg';

const LandingPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.evaluations
      .leaderboard(limit)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, [limit]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            {/* Animated Stars Background */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(100)].map((_, i) => (
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
                            animationDuration: `${Math.random() * 2 + 1}s`
                        }}
                    />
                ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white/20 animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 10 + 5}px`,
                            height: `${Math.random() * 10 + 5}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 10 + 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Header Navigation */}
            <header className="relative z-10 flex justify-between items-center p-6">
                <div className="flex items-center space-x-3">
                    <img src={logo} alt="GMU" className="h-8 w-8 rounded-sm object-contain" />
                    <h1 className="text-2xl font-bold text-white">GMU Evaluator</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowAbout(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all border border-white/20"
                    >
                        <Users size={18} />
                        <span>About Us</span>
                    </button>
                    <Link
                        to="/login"
                        className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all border border-white/20"
                    >
                        <LogIn size={18} />
                        <span>Login</span>
                    </Link>
                    <Link
                        to="/register"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                    >
                        <UserPlus size={18} />
                        <span>Register</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Hero Section */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-bold text-white leading-tight">
                                Faculty Evaluation
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400">
                                    System
                                </span>
                            </h2>
                            <p className="text-xl text-white/80">
                                Empowering educators through comprehensive assessment and performance analytics
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/register"
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
                            >
                                Admin Login
                            </Link>
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                        <div className="flex items-center space-x-3 mb-6">
                            <Trophy className="text-yellow-400" size={28} />
                            <h3 className="text-2xl font-bold text-white">Top Performers</h3>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-white/60">
                                <p>No evaluations yet. Be the first!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.employeeId || index}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                index === 1 ? 'bg-gray-300 text-gray-800' :
                                                index === 2 ? 'bg-orange-400 text-orange-900' :
                                                'bg-white/20 text-white'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{entry.name || 'Unknown'}</p>
                                                <p className="text-white/60 text-sm">{entry.department || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Star className="text-yellow-400" size={18} />
                                            <span className="text-white font-bold text-lg">{entry.totalScore || 0}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-center mt-4">
                                    <button
                                        onClick={() => setLimit((prev) => (prev >= 50 ? 10 : 50))}
                                        className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        {limit >= 50 ? 'Show Less' : 'Show More'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <div className="text-4xl mb-4">📊</div>
                        <h4 className="text-xl font-bold text-white mb-2">Performance Analytics</h4>
                        <p className="text-white/70">Comprehensive dashboards and insights for faculty performance</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <div className="text-4xl mb-4">🎯</div>
                        <h4 className="text-xl font-bold text-white mb-2">Skill Assessment</h4>
                        <p className="text-white/70">Evaluate proficiency in educational tools and teaching methods</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <div className="text-4xl mb-4">🚀</div>
                        <h4 className="text-xl font-bold text-white mb-2">Modern Platform</h4>
                        <p className="text-white/70">Built with cutting-edge technology for seamless experience</p>
                    </div>
                </div>
            </div>

            {/* About Us Modal */}
            {showAbout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100 animate-fadeIn">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Meet the Developers</h2>
                            <button onClick={() => setShowAbout(false)} className="text-white/80 hover:text-white transition-colors">
                                <X size={28} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                <img src={sriImg} alt="Srinidhi S Joshi" className="w-20 h-20 rounded-full object-cover border-4 border-indigo-200" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Srinidhi S Joshi</h3>
                                    <p className="text-indigo-600 font-medium">Developer</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                <img src={saiImg} alt="Shankar Sai N" className="w-20 h-20 rounded-full object-cover border-4 border-purple-200" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Shankar Sai N</h3>
                                    <p className="text-purple-600 font-medium">Developer</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors shadow-sm text-blue-800 font-medium">
                                Data Science Department
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t text-center text-gray-500 text-sm">
                            Faculty Evaluation System &copy; 2024
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
