import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../config/api';
import { useAdminSocket } from '../../hooks/useSocket';
import { BATCHES } from '../../lib/constants';
import { normalizeBatch, denormalizeBatch } from '../../utils/batchUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { X, BookOpen, BarChart3, FileText, Plus, Edit, Trash2, TrendingUp, UserSearch, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DEFAULT_DEMO_SECTIONS = ["Use of Tools", "Engagement with Tools", "Concept Visualization", "Interactive Visualization", "Relevancy of Using Tools"];

const questionIdNum = (q) => parseInt(String(q.id).replace(/^\D+/g, '') || 0, 10);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('performance');
    const [faculty, setFaculty] = useState([]);
    const [analysisList, setAnalysisList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState('All');
    const [demoSections, setDemoSections] = useState(DEFAULT_DEMO_SECTIONS);
    const [batches, setBatches] = useState(BATCHES);
    const [quizDuration, setQuizDuration] = useState(30);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [demoScores, setDemoScores] = useState({});
    const [saving, setSaving] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [selectedForAnalysis, setSelectedForAnalysis] = useState(null);

    const fetchFaculty = useCallback(async () => {
        try {
            const batchQuery = selectedBatch === 'All' ? 'All' : denormalizeBatch(selectedBatch);
            const data = await api.evaluations.faculty(batchQuery);
            setFaculty(data.map((f) => ({ 
                ...f, 
                uid: f.uid || f._id,
                batch: normalizeBatch(f.batch)
            })));
        } catch (e) {
            console.error(e);
        }
    }, [selectedBatch]);

    const fetchAnalysis = useCallback(async () => {
        try {
            const batchQuery = selectedBatch === 'All' ? 'All' : denormalizeBatch(selectedBatch);
            const data = await api.evaluations.analysis(batchQuery);
            setAnalysisList(data.map(f => ({
                ...f,
                batch: normalizeBatch(f.batch)
            })));
        } catch (e) {
            console.error(e);
        }
    }, [selectedBatch]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const config = await api.config.get();
                if (config.demoSections?.length) setDemoSections(config.demoSections);
                if (config.batches?.length) {
                    setBatches(config.batches.map(b => normalizeBatch(b)));
                } else {
                    setBatches(BATCHES);
                }
                if (config.quizDuration) setQuizDuration(config.quizDuration);
                await fetchFaculty();
                await fetchAnalysis();
                const qs = await api.quiz.list();
                qs.sort((a, b) => questionIdNum(a) - questionIdNum(b));
                setQuestions(qs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchFaculty();
        fetchAnalysis();
    }, [selectedBatch, fetchFaculty, fetchAnalysis]);

    useAdminSocket((event) => {
        if (event === 'updated' || event === 'submitted') {
            fetchFaculty();
            fetchAnalysis();
        }
    });

    const handleSaveQuizDuration = async () => {
        try {
            await api.config.update({ quizDuration: Number(quizDuration) });
            alert('Quiz duration updated!');
        } catch (e) {
            alert('Failed to update quiz duration');
        }
    };

    const handleOpenModal = (fac) => {
        setSelectedFaculty(fac);
        const initialScores = {};
        demoSections.forEach(sec => {
            initialScores[sec] = fac.demoSectionScores?.[sec] || '';
        });
        setDemoScores(initialScores);
        setIsModalOpen(true);
    };

    const handleScoreChange = (section, value) => {
        setDemoScores(prev => ({ ...prev, [section]: value }));
    };

    const calculateTotalDemo = () => {
        return Object.values(demoScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    };

    const handleSaveScore = async () => {
        for (const sec of demoSections) {
            const val = Number(demoScores[sec]);
            if (demoScores[sec] === '' || isNaN(val) || val < 0 || val > 10) {
                alert(`Please enter a valid score (0-10) for ${sec}.`);
                return;
            }
        }
        const totalDemo = calculateTotalDemo();
        setSaving(true);
        try {
            if (!selectedFaculty.employeeId) throw new Error("Missing Employee ID");
            await api.evaluations.updateDemo(selectedFaculty.employeeId, { demoScore: totalDemo, demoSectionScores: demoScores });
            setFaculty(prev => prev.map(f =>
                f.employeeId === selectedFaculty.employeeId ? { ...f, demoScore: totalDemo, demoSectionScores: demoScores, totalScore: (f.quizScore || 0) + totalDemo } : f
            ));
            setAnalysisList(prev => prev.map(f =>
                f.employeeId === selectedFaculty.employeeId ? { ...f, demoScore: totalDemo, demoSectionScores: demoScores, totalScore: (f.quizScore || 0) + totalDemo } : f
            ));
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message || "Failed to save evaluation.");
        } finally {
            setSaving(false);
        }
    };

    // Quiz Question Management
    const startEditQuestion = (q) => {
        setEditingQuestion({ ...q, options: [...q.options] });
        setShowQuestionModal(true);
    };

    const startAddQuestion = () => {
        setEditingQuestion({
            id: `q${questions.length + 1}`,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            section: '',
            marks: 2
        });
        setShowQuestionModal(true);
    };

    const saveQuestion = async () => {
        if (!editingQuestion.question || !editingQuestion.section) {
            alert("Please fill question and section.");
            return;
        }
        if (editingQuestion.options.some(opt => !opt.trim())) {
            alert("Please fill all options.");
            return;
        }
        setLoading(true);
        try {
            await api.quiz.update(editingQuestion.id, editingQuestion);
            setQuestions(prev => {
                const filtered = prev.filter(q => q.id !== editingQuestion.id);
                return [...filtered, editingQuestion].sort((a, b) => questionIdNum(a) - questionIdNum(b));
            });
            setShowQuestionModal(false);
            setEditingQuestion(null);
            alert("Question saved!");
        } catch (e) {
            alert(e.message || "Save failed.");
        } finally {
            setLoading(false);
        }
    };

    const deleteQuestion = async (questionId) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        setLoading(true);
        try {
            await api.quiz.delete(questionId);
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            alert("Question deleted!");
        } catch (e) {
            alert(e.message || "Delete failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        const element = document.getElementById('report-content');
        if (!element) {
            console.error("Report content element not found");
            alert("Could not find report content to download.");
            return;
        }
        
        try {
            setLoading(true);
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10; // 10mm margin
            const contentWidth = pdfWidth - (2 * margin);
            const contentHeight = pdfHeight - (2 * margin);
            
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = margin;
            
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= contentHeight;
            
            while (heightLeft > 0) {
                position -= contentHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= contentHeight;
            }
            
            pdf.save(`${selectedForAnalysis.name}_Report.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert(`Failed to generate PDF report: ${error.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredFaculty = selectedBatch === 'All'
        ? faculty
        : faculty.filter(f => f.batch === selectedBatch);

    // Performance Analytics Data
    const performanceData = filteredFaculty
        .filter(f => f.totalScore !== undefined && f.totalScore !== null)
        .map(f => ({
            name: f.name.split(' ')[0],
            quiz: f.quizScore || 0,
            demo: f.demoScore || 0,
            total: f.totalScore || 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    const avgScores = filteredFaculty.length > 0
        ? {
            quiz: (filteredFaculty.reduce((sum, f) => sum + (f.quizScore || 0), 0) / filteredFaculty.length).toFixed(1),
            demo: (filteredFaculty.reduce((sum, f) => sum + (f.demoScore || 0), 0) / filteredFaculty.length).toFixed(1),
            total: (filteredFaculty.reduce((sum, f) => sum + (f.totalScore || 0), 0) / filteredFaculty.length).toFixed(1)
        }
        : { quiz: 0, demo: 0, total: 0 };

    if (loading && faculty.length === 0) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500">Faculty Performance Analysis & Quiz Management</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <span className="text-gray-600 font-medium">Filter Batch:</span>
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className="input-field w-48"
                    >
                        <option value="All">All Batches</option>
                        {batches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-lg">
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('performance')}
                >
                    <BarChart3 size={18} className="inline mr-2" />
                    Performance Dashboard
                </button>
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'demo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('demo')}
                >
                    <BookOpen size={18} className="inline mr-2" />
                    Demo Evaluation
                </button>
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'questions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('questions')}
                >
                    <FileText size={18} className="inline mr-2" />
                    Quiz Questions
                </button>
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    <UserSearch size={18} className="inline mr-2" />
                    Individual Analysis
                </button>
            </div>

            {/* Performance Dashboard Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Average Quiz Score</p>
                                    <p className="text-3xl font-bold text-blue-600">{avgScores.quiz}</p>
                                    <p className="text-xs text-gray-400 mt-1">out of 50</p>
                                </div>
                                <TrendingUp className="text-blue-400" size={40} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Average Demo Score</p>
                                    <p className="text-3xl font-bold text-green-600">{avgScores.demo}</p>
                                    <p className="text-xs text-gray-400 mt-1">out of 50</p>
                                </div>
                                <TrendingUp className="text-green-400" size={40} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Average Total Score</p>
                                    <p className="text-3xl font-bold text-purple-600">{avgScores.total}</p>
                                    <p className="text-xs text-gray-400 mt-1">out of 100</p>
                                </div>
                                <TrendingUp className="text-purple-400" size={40} />
                            </div>
                        </div>
                    </div>

                    {/* Performance Chart */}
                    {performanceData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Top Performers Comparison</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="quiz" fill="#3B82F6" name="Quiz Score" />
                                    <Bar dataKey="demo" fill="#10B981" name="Demo Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Faculty List */}
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredFaculty
                                    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                                    .map((fac) => (
                                        <tr key={fac.uid} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{fac.name}</div>
                                                <div className="text-xs text-gray-500">{fac.department}</div>
                                            </td>
                                            <td className="px-6 py-4">{fac.quizScore || 0}</td>
                                            <td className="px-6 py-4">{fac.demoScore || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-lg">{fac.totalScore || 0}</span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Demo Evaluation Tab */}
            {activeTab === 'demo' && (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz (50)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demo (50)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (100)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredFaculty.map((fac) => (
                                <tr key={fac.uid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{fac.name}</div>
                                        <div className="text-xs text-gray-500">{fac.designation} • {fac.department}</div>
                                        <div className="text-xs text-gray-400">ID: {fac.employeeId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {fac.quizAttempted
                                            ? <span className="text-gray-900 font-medium">{fac.quizScore}</span>
                                            : <span className="text-red-400 italic text-xs">Pending</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {fac.demoScore !== null && fac.demoScore !== undefined
                                            ? <span className="text-green-600 font-medium">{fac.demoScore}</span>
                                            : <span className="text-gray-400 text-xs">Not Evaluated</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-lg font-bold text-blue-900">{fac.totalScore || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleOpenModal(fac)}
                                            disabled={!fac.quizAttempted}
                                            className="flex items-center justify-center mx-auto text-blue-600 hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <BookOpen size={18} className="mr-1" />
                                            Evaluate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Individual Faculty Analysis Tab */}
            {activeTab === 'analysis' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Faculty Analysis by Common Parameters</h2>
                    <p className="text-gray-600 text-sm">Select a faculty to view their scores across quiz sections and demo criteria.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b font-medium">Faculty List</div>
                            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {analysisList
                                    .filter((f) => selectedBatch === 'All' || f.batch === selectedBatch)
                                    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                                    .map((f) => (
                                        <li key={f.employeeId || f._id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedForAnalysis(f)}
                                                className={`w-full text-left px-4 py-3 hover:bg-purple-50 ${selectedForAnalysis?.employeeId === f.employeeId ? 'bg-purple-100 border-l-4 border-purple-600' : ''}`}
                                            >
                                                <span className="font-medium text-gray-900">{f.name}</span>
                                                <span className="block text-xs text-gray-500">{f.department} • {f.batch}</span>
                                                <span className="text-sm font-semibold text-purple-600">{f.totalScore ?? 0} pts</span>
                                            </button>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                            {selectedForAnalysis ? (
                                <div className="space-y-6" id="report-content">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedForAnalysis.name}</h3>
                                            <p className="text-sm text-gray-500">{selectedForAnalysis.designation} • {selectedForAnalysis.department} • {selectedForAnalysis.batch}</p>
                                        </div>
                                        <button
                                            onClick={handleDownloadReport}
                                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                            data-html2canvas-ignore="true"
                                        >
                                            <Download size={18} />
                                            <span>Download Report</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <p className="text-xs font-medium text-blue-700 uppercase">Quiz Score</p>
                                            <p className="text-2xl font-bold text-blue-900">{selectedForAnalysis.quizScore ?? 0} / 50</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <p className="text-xs font-medium text-green-700 uppercase">Demo Score</p>
                                            <p className="text-2xl font-bold text-green-900">{selectedForAnalysis.demoScore ?? 0} / 50</p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const qs = selectedForAnalysis.quizSectionScores || {};
                                        const ds = selectedForAnalysis.demoSectionScores || {};
                                        
                                        // Hardcoded sections to ensure order and mapping
                                        const QUIZ_SECTIONS = [
                                            "Modern Technology and Student Centric Learning",
                                            "Technology in Education",
                                            "Designing Technology Supported Activities",
                                            "Education Tool and Demonstration",
                                            "Ethics, Inclusivity and Appropriative of Tools"
                                        ];
                                        
                                        // DEFAULT_DEMO_SECTIONS are already available in scope
                                        
                                        // Map quiz sections to demo sections by index to create "Common Parameters"
                                        const combinedData = QUIZ_SECTIONS.map((qSec, index) => {
                                            const dSec = DEFAULT_DEMO_SECTIONS[index];
                                            const quizScore = Number(qs[qSec]) || 0;
                                            const demoScore = Number(ds[dSec]) || 0;
                                            return {
                                                name: qSec, // Use Quiz Section name as the common parameter name
                                                quiz: quizScore,
                                                demo: demoScore,
                                                total: quizScore + demoScore
                                            };
                                        });

                                        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

                                        return (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Quiz Pie Chart */}
                                                    <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
                                                        <h4 className="text-lg font-bold text-blue-800 mb-2 text-center">Quiz Performance</h4>
                                                        <p className="text-sm text-gray-500 text-center mb-4">Distribution of Quiz Scores</p>
                                                        <div className="h-64 w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={combinedData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                                                        outerRadius={80}
                                                                        fill="#3B82F6"
                                                                        dataKey="quiz"
                                                                    >
                                                                        {combinedData.map((entry, index) => (
                                                                            <Cell key={`cell-quiz-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip formatter={(value, name, props) => [`${value} / 10`, props.payload.name]} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>

                                                    {/* Demo Pie Chart */}
                                                    <div className="bg-white p-6 rounded-lg shadow border flex flex-col items-center">
                                                        <h4 className="text-lg font-bold text-green-800 mb-2 text-center">Demo Performance</h4>
                                                        <p className="text-sm text-gray-500 text-center mb-4">Distribution of Demo Scores</p>
                                                        <div className="h-64 w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={combinedData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                                                        outerRadius={80}
                                                                        fill="#10B981"
                                                                        dataKey="demo"
                                                                    >
                                                                        {combinedData.map((entry, index) => (
                                                                            <Cell key={`cell-demo-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip formatter={(value, name, props) => [`${value} / 10`, props.payload.name]} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-4 rounded-lg shadow border flex justify-center">
                                                     <div className="flex flex-wrap gap-4 justify-center">
                                                        {combinedData.map((entry, index) => (
                                                            <div key={index} className="flex items-center">
                                                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                                <span className="text-sm text-gray-600">{entry.name}</span>
                                                            </div>
                                                        ))}
                                                     </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-lg shadow border">
                                                     <h4 className="text-lg font-bold text-gray-800 mb-4">Detailed Score Breakdown</h4>
                                                     <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score (10)</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demo Score (10)</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (20)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {combinedData.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                                                        <td className="px-6 py-4 text-sm text-gray-500">{item.quiz}</td>
                                                                        <td className="px-6 py-4 text-sm text-gray-500">{item.demo}</td>
                                                                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{item.total}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                     </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {selectedForAnalysis.quizSectionScores && Object.keys(selectedForAnalysis.quizSectionScores).length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Quiz Sections (common parameters)</h4>
                                            <div className="space-y-2">
                                                {Object.entries(selectedForAnalysis.quizSectionScores).map(([section, score]) => (
                                                    <div key={section} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <span className="text-sm text-gray-700 truncate max-w-[70%]">{section}</span>
                                                        <span className="font-semibold">{score} / 10</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedForAnalysis.demoSectionScores && typeof selectedForAnalysis.demoSectionScores === 'object' && Object.keys(selectedForAnalysis.demoSectionScores).length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">Demo Sections (common parameters)</h4>
                                            <div className="space-y-2">
                                                {Object.entries(selectedForAnalysis.demoSectionScores).map(([section, score]) => (
                                                    <div key={section} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <span className="text-sm text-gray-700 truncate max-w-[70%]">{section}</span>
                                                        <span className="font-semibold">{score} / 10</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(!selectedForAnalysis.quizSectionScores || Object.keys(selectedForAnalysis.quizSectionScores || {}).length === 0) &&
                                        (!selectedForAnalysis.demoSectionScores || Object.keys(selectedForAnalysis.demoSectionScores || {}).length === 0) && (
                                        <p className="text-gray-500 text-sm">No section-wise data yet. Quiz or demo evaluation may be pending.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <UserSearch size={48} className="mb-4" />
                                    <p>Select a faculty from the list to view individual analysis by common parameters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Questions Tab */}
            {activeTab === 'questions' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                         <div className="flex items-center space-x-4">
                            <h3 className="font-semibold text-gray-700">Quiz Settings</h3>
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">Duration (mins):</label>
                                <input 
                                    type="number" 
                                    value={quizDuration} 
                                    onChange={(e) => setQuizDuration(e.target.value)}
                                    className="border rounded px-2 py-1 w-20"
                                />
                                <button 
                                    onClick={handleSaveQuizDuration}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setEditingQuestion(null);
                                setShowQuestionModal(true);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Question
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {questions.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{q.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-lg">{q.question}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{q.section}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => startEditQuestion(q)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center"
                                                >
                                                    <Edit size={14} className="mr-1" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteQuestion(q.id)}
                                                    className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center"
                                                >
                                                    <Trash2 size={14} className="mr-1" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Demo Evaluation Modal */}
            {isModalOpen && selectedFaculty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Demo Evaluation</h3>
                                <p className="text-sm text-gray-500">Evaluating: <span className="font-semibold text-blue-600">{selectedFaculty.name}</span></p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-6">
                                {demoSections.map((section, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="text-sm font-medium text-gray-700 mb-2 sm:mb-0 sm:w-2/3">{section}</label>
                                        <div className="flex items-center sm:w-1/3 justify-end">
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                className="block w-20 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                placeholder="/ 10"
                                                value={demoScores[section]}
                                                onChange={(e) => handleScoreChange(section, e.target.value)}
                                            />
                                            <span className="ml-2 text-gray-400 text-sm">/10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <div className="text-sm">
                                Total Demo Score: <span className="font-bold text-xl text-blue-600">{calculateTotalDemo()}</span> / 50
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button
                                    onClick={handleSaveScore}
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Submitting..." : "Submit Evaluation"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Edit Modal */}
            {showQuestionModal && editingQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Edit Question</h3>
                            <button onClick={() => { setShowQuestionModal(false); setEditingQuestion(null); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                                <textarea
                                    value={editingQuestion.question}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                    className="input-field"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                <input
                                    type="text"
                                    value={editingQuestion.section}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, section: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                                {editingQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="mb-2">
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...editingQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setEditingQuestion({ ...editingQuestion, options: newOptions });
                                            }}
                                            className="input-field"
                                            placeholder={`Option ${idx + 1}`}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer Index (0-3) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={editingQuestion.correctAnswer}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: parseInt(e.target.value) })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button onClick={() => { setShowQuestionModal(false); setEditingQuestion(null); }} className="btn btn-secondary">Cancel</button>
                                <button onClick={saveQuestion} className="btn btn-primary" disabled={loading}>
                                    {loading ? "Saving..." : "Save Question"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
