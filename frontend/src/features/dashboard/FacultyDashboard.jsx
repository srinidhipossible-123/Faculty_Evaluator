import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';
import { Trophy, TrendingUp, Award, AlertTriangle, Layers } from 'lucide-react';

const StatsCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-transparent hover:border-l-blue-500 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
        <h4 className="text-3xl font-bold mt-2 text-gray-900">{value}</h4>
        {subtext && <p className="text-sm text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const FacultyDashboard = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const submitted = new URLSearchParams(location.search).get('submitted') === '1';
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.employeeId) {
      setLoading(false);
      return;
    }
    api.evaluations
      .me()
      .then(setEvaluation)
      .catch(() => setEvaluation(null))
      .finally(() => setLoading(false));
  }, [userData?.employeeId]);

  if (loading) return <LoadingSpinner />;

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900">User Profile Not Found</h2>
      </div>
    );
  }

  if (!userData?.quizAttempted) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">Welcome, {userData.name}!</h2>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mt-8 inline-block max-w-lg">
          <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-yellow-800">Pending Actions</h3>
          <p className="mt-2 text-yellow-700">You have not attempted the Faculty Evaluation Quiz yet.</p>
          <a href="/quiz" className="btn btn-primary mt-4">Take Quiz Now</a>
        </div>
      </div>
    );
  }

  const barData = [
    { name: 'Quiz', score: evaluation?.quizScore || 0, total: 50, fill: '#4F46E5' },
    { name: 'Demo', score: evaluation?.demoScore || 0, total: 50, fill: '#10B981' },
  ];

  let radarData = [];
  if (evaluation?.demoSectionScores && typeof evaluation.demoSectionScores === 'object') {
    Object.entries(evaluation.demoSectionScores).forEach(([key, val]) => {
      radarData.push({
        subject: key.substring(0, 15) + (key.length > 15 ? '...' : ''),
        A: (Number(val) / 10) * 100,
        fullMark: 100,
      });
    });
  } else {
    radarData = [
      { subject: 'Pedagogy', A: 0, fullMark: 100 },
      { subject: 'Tech', A: 0, fullMark: 100 },
      { subject: 'Content', A: 0, fullMark: 100 },
      { subject: 'Class Mgmt', A: 0, fullMark: 100 },
    ];
  }

  return (
    <div className="space-y-8">
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-4">
            <Trophy className="text-green-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-900">Submission Successful</h4>
            <p className="text-sm text-green-700">Your quiz has been submitted successfully. You cannot re-attempt without admin reset.</p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Performance Profile</h1>
        <p className="text-gray-500">Evaluation Summary for {userData.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Total Score" value={evaluation ? `${evaluation.totalScore}/100` : '0/100'} subtext={evaluation?.demoScore === null ? 'Waiting for Demo Eval' : 'Completed'} icon={Trophy} color="bg-indigo-600" />
        <StatsCard title="Quiz Score" value={evaluation ? `${evaluation.quizScore}/50` : '0/50'} subtext="Objective Assessment" icon={Award} color="bg-blue-500" />
        <StatsCard title="Demo Score" value={evaluation?.demoScore != null ? `${evaluation.demoScore}/50` : 'Pending'} subtext="Subjective Assessment" icon={TrendingUp} color="bg-green-500" />
        <StatsCard title="Batch" value={userData.batch || 'N/A'} subtext="" icon={Layers} color="bg-gray-400" />
      </div>

      {userData.quizAttempted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-4">
            <AlertTriangle className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Quiz Completed</h4>
            <p className="text-sm text-blue-700">You have already submitted your evaluation quiz. If you wish to re-attempt, please contact the <strong>Super Admin</strong> to reset your session.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Performance Comparison</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Quiz', value: evaluation?.quizScore || 0, fill: '#4F46E5' },
                    { name: 'Demo', value: evaluation?.demoScore || 0, fill: '#10B981' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {[
                    { name: 'Quiz', value: evaluation?.quizScore || 0, fill: '#4F46E5' },
                    { name: 'Demo', value: evaluation?.demoScore || 0, fill: '#10B981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Demo Proficiency Analysis</h3>
          {evaluation?.demoScore != null ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Performance %" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">Waiting for Demo Evaluation to generate analysis...</div>
          )}
        </div>
      </div>

      {evaluation?.demoSectionScores && typeof evaluation.demoSectionScores === 'object' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Evaluator Feedback (Section-wise)</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(evaluation.demoSectionScores).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <span className="font-medium text-gray-700">{k}</span>
                <span className="font-bold text-gray-900">{v} / 10</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
