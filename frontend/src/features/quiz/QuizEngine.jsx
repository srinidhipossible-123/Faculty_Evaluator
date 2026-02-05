import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const QuizEngine = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [hasStarted, setHasStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [duration, setDuration] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (userData?.quizAttempted) navigate('/dashboard');
  }, [userData, navigate]);

  useEffect(() => {
    api.auth
      .me()
      .then((u) => {
        if (u?.quizAttempted) navigate('/dashboard');
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qs, config] = await Promise.all([
          api.quiz.list(),
          api.config.get()
        ]);
        
        const sorted = [...qs].sort((a, b) => {
          const numA = parseInt(String(a.id).replace(/^\D+/g, '') || 0);
          const numB = parseInt(String(b.id).replace(/^\D+/g, '') || 0);
          return numA - numB;
        });
        setQuestions(sorted);
        if (config.quizDuration) setDuration(config.quizDuration);
      } catch (err) {
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (hasStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [hasStarted, timeLeft]);

  const startQuiz = () => {
    setHasStarted(true);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateResults = () => {
    let totalScore = 0;
    const sectionScores = {};
    questions.forEach((q) => {
      if (!sectionScores[q.section]) sectionScores[q.section] = 0;
      if (answers[q.id] === q.correctAnswer) {
        const marks = q.marks || 2;
        totalScore += marks;
        sectionScores[q.section] += marks;
      }
    });
    return { totalScore, sectionScores };
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && Object.keys(answers).length < questions.length) {
      alert(`You have answered ${Object.keys(answers).length} of ${questions.length} questions. Please answer all.`);
      return;
    }
    setSubmitting(true);
    try {
      const { totalScore, sectionScores } = calculateResults();
      await api.evaluations.submit({ quizScore: totalScore, quizSectionScores: sectionScores });
      navigate('/dashboard?submitted=1');
    } catch (err) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!userData || loadingQuestions) return <LoadingSpinner />;
  if (userData.quizAttempted) return null;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle className="mx-auto mb-4" />
        <p>Quiz content is not initialized. Please contact Admin.</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <CheckCircle className="mr-3" />
              Faculty Evaluation Quiz
            </h1>
            <p className="text-blue-100 mt-2">Please review the rules before starting.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-bold text-blue-900">Assessment Structure</h3>
              <p className="text-blue-800 mt-1">This quiz evaluates proficiency in Educational Tools, Teaching Strategies, and Technology.</p>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="font-semibold text-lg border-b pb-2">Rules & Guidelines:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Format:</strong> 25 Multiple Choice Questions (MCQs).</li>
                <li><strong>Duration:</strong> {duration} Minutes.</li>
                <li><strong>Sections:</strong> 5 Sections, 5 questions each, 10 marks per section. Total: 50 Marks.</li>
                <li><strong>Scoring:</strong> Each question carries <strong>2 Marks</strong>.</li>
                <li><strong>Attempt:</strong> You have <strong>ONE</strong> attempt only.</li>
              </ul>
            </div>
            <div className="pt-6 border-t flex justify-end">
              <button onClick={startQuiz} className="btn btn-primary text-lg px-8 shadow-lg hover:scale-105 transform transition">
                Start Quiz Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sections = {};
  questions.forEach((q) => {
    if (!sections[q.section]) sections[q.section] = [];
    sections[q.section].push(q);
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border-l-4 border-blue-600 flex justify-between items-center sticky top-20 z-10 opacity-95">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proficiency in Educational Tools</h1>
          <p className="text-sm text-gray-500">Attempting evaluation for: <span className="font-semibold text-blue-600">{userData.name}</span></p>
        </div>
        <div className="flex items-center space-x-6">
          {timeLeft !== null && (
            <div className={`flex items-center text-2xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
              <Clock className="mr-2" size={24} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-right">
            <span className="block text-2xl font-bold text-blue-600">{Object.keys(answers).length} / {questions.length}</span>
            <span className="text-xs text-gray-500 uppercase font-bold">Answered</span>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {Object.entries(sections).map(([sectionName, sectionQuestions], secIdx) => (
          <div key={sectionName} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Section {secIdx + 1}: {sectionName}</h2>
            </div>
            <div className="p-6 space-y-8">
              {sectionQuestions.map((q) => (
                <div key={q.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                  <p className="text-lg font-medium text-gray-900 mb-4">{q.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(q.options || []).map((option, optIndex) => (
                      <div
                        key={optIndex}
                        onClick={() => handleOptionSelect(q.id, optIndex)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center ${
                          answers[q.id] === optIndex ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 ${answers[q.id] === optIndex ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                          {answers[q.id] === optIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className={answers[q.id] === optIndex ? 'text-blue-900 font-medium' : 'text-gray-700'}>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end sticky bottom-4 z-10">
        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary text-lg px-8 py-4 shadow-xl transform transition hover:-translate-y-1">
          {submitting ? <LoadingSpinner size={24} className="text-white" /> : 'Submit Final Evaluation'}
        </button>
      </div>
    </div>
  );
};

export default QuizEngine;
