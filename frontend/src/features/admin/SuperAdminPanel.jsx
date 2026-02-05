import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { INITIAL_BATCHES, DESIGNATIONS } from '../../lib/dbSetup';
import { normalizeBatch, denormalizeBatch } from '../../utils/batchUtils';
import { RotateCcw, Database, Plus, Save, X, Edit, UserPlus } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const SuperAdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users'); // users | config | questions
    const [loading, setLoading] = useState(false);

    // Data States
    const [users, setUsers] = useState([]);
    const [config, setConfig] = useState({ batches: [], demoSections: [] });
    const [questions, setQuestions] = useState([]);

    // Editing States
    const [editingConfigType, setEditingConfigType] = useState(null); // 'batches' | 'demoSections'
    const [tempConfigList, setTempConfigList] = useState([]);
    const [newConfigItem, setNewConfigItem] = useState('');

    const [editingQuestion, setEditingQuestion] = useState(null);

    // Credential Creation States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        designation: '',
        department: '',
        batch: '',
        role: 'participant'
    });

    // Edit Faculty States
    const [editingUser, setEditingUser] = useState(null);
    const [batches, setBatches] = useState(INITIAL_BATCHES);
    const [designations, setDesignations] = useState(DESIGNATIONS);

    useEffect(() => {
        fetchUsers();
        fetchConfig();
        fetchQuestions();
        loadBatchesAndDesignations();
    }, []);

    const loadBatchesAndDesignations = async () => {
        try {
            const data = await api.config.get();
            if (data.batches) setBatches(data.batches.map(b => normalizeBatch(b)));
            if (data.designations) setDesignations(data.designations);
        } catch (e) { console.log("Using default config"); }
    };

    const fetchUsers = async () => {
        try {
            const list = await api.users.list();
            setUsers(list.map((u) => ({ 
                ...u, 
                uid: u._id,
                batch: normalizeBatch(u.batch)
            })));
        } catch (e) { console.error(e); }
    };

    const fetchConfig = async () => {
        try {
            const data = await api.config.get();
            setConfig({ 
                batches: (data.batches || []).map(b => normalizeBatch(b)), 
                demoSections: data.demoSections || [], 
                designations: data.designations || [] 
            });
        } catch (e) { console.error(e); }
    };

    const fetchQuestions = async () => {
        try {
            const qs = await api.quiz.list();
            const num = (x) => parseInt(String(x.id).replace(/^\D+/g, '') || 0, 10);
            qs.sort((a, b) => num(a) - num(b));
            setQuestions(qs);
        } catch (e) { console.error(e); }
    };

    const handleInitDB = async () => {
        alert("Run seed on the backend: in the backend folder run 'npm run seed' to create database and demo users.");
    };

    const handleRoleChange = async (id, role) => {
        try {
            await api.users.update(id, { role });
            setUsers(users.map((u) => (u._id === id || u.uid === id ? { ...u, role } : u)));
        } catch (e) { alert(e.message || "Failed"); }
    };

    const handleResetAttempt = async (user) => {
        if (!confirm(`Reset quiz for ${user.name}? This will delete their evaluation.`)) return;
        try {
            await api.users.resetAttempt(user._id || user.uid);
            setUsers(users.map((u) => (u._id === user._id || u.uid === user.uid ? { ...u, quizAttempted: false } : u)));
            alert("Quiz attempt reset successfully.");
        } catch (e) { alert(e.message || "Failed to reset."); }
    };

    const startEditConfig = (type) => {
        setEditingConfigType(type);
        setTempConfigList([...(config[type] || [])]);
        setNewConfigItem('');
    };

    const addConfigItem = () => {
        if (!newConfigItem.trim()) return;
        setTempConfigList([...tempConfigList, newConfigItem]);
        setNewConfigItem('');
    };

    const removeConfigItem = (idx) => {
        setTempConfigList(tempConfigList.filter((_, i) => i !== idx));
    };

    const saveConfig = async () => {
        setLoading(true);
        try {
            const payload = { ...config, [editingConfigType]: tempConfigList };
            await api.config.update({ batches: payload.batches, demoSections: payload.demoSections, designations: payload.designations });
            setConfig(payload);
            setEditingConfigType(null);
            alert("Configuration updated!");
        } catch (e) { alert(e.message || "Save failed."); } finally { setLoading(false); }
    };

    const startEditQuestion = (q) => {
        setEditingQuestion({ ...q, options: q.options ? [...q.options] : [] });
    };

    const saveQuestion = async () => {
        setLoading(true);
        try {
            await api.quiz.update(editingQuestion.id, editingQuestion);
            setQuestions(questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)));
            setEditingQuestion(null);
            alert("Question updated!");
        } catch (e) { alert(e.message || "Save failed."); } finally { setLoading(false); }
    };

    const handleCreateCredentials = async () => {
        if (!newUser.name || !newUser.email || !newUser.password || !newUser.employeeId) {
            alert("Please fill all required fields.");
            return;
        }
        if (newUser.password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const userToCreate = { ...newUser, batch: denormalizeBatch(newUser.batch) };
            await api.users.create(userToCreate);
            alert("User created successfully!");
            setShowCreateModal(false);
            setNewUser({ name: '', email: '', password: '', employeeId: '', designation: '', department: '', batch: '', role: 'participant' });
            fetchUsers();
        } catch (error) {
            alert(error.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    const startEditFaculty = (user) => {
        setEditingUser({ ...user });
    };

    const saveFacultyEdit = async () => {
        if (!editingUser) return;
        if (!editingUser.name || !editingUser.email || !editingUser.employeeId) {
            alert("Please fill all required fields.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: editingUser.name,
                email: editingUser.email,
                employeeId: editingUser.employeeId,
                designation: editingUser.designation || '',
                department: editingUser.department || '',
                batch: denormalizeBatch(editingUser.batch) || '',
                role: editingUser.role,
            };
            if (editingUser.password) {
                payload.password = editingUser.password;
            }
            await api.users.update(editingUser._id || editingUser.uid, payload);
            alert("Faculty details updated successfully!");
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            alert(error.message || "Failed to update.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Super Admin Control Board</h1>
                <button onClick={handleInitDB} className="btn btn-secondary text-xs flex items-center">
                    <Database size={14} className="mr-1" /> Initialize / Reset DB Defaults
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('users')}>User Management</button>
                <button className={`px-4 py-2 font-medium ${activeTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('config')}>System Config</button>
                <button className={`px-4 py-2 font-medium ${activeTab === 'questions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('questions')}>Quiz Questions</button>
            </div>

            {loading && <LoadingSpinner />}

            {/* View: User Management */}
            {activeTab === 'users' && !loading && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">User Management</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary flex items-center"
                        >
                            <UserPlus size={16} className="mr-2" />
                            Create Credentials
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u._id || u.uid} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                            {u.employeeId && <div className="text-xs text-gray-400">ID: {u.employeeId}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u._id || u.uid, e.target.value)}
                                                className="text-xs border rounded p-1"
                                            >
                                                <option value="participant">Participant</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.quizAttempted ?
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Quiz Done</span> :
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Pending</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {u.role === 'participant' && (
                                                    <button
                                                        onClick={() => startEditFaculty(u)}
                                                        className="text-blue-500 hover:text-blue-700 text-xs flex items-center"
                                                    >
                                                        <Edit size={14} className="mr-1" /> Edit
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleResetAttempt({ ...u, _id: u._id || u.uid })}
                                                    className="text-red-500 hover:text-red-700 text-xs flex items-center"
                                                    disabled={!u.quizAttempted}
                                                >
                                                    <RotateCcw size={14} className="mr-1" /> Reset
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

            {/* View: Config */}
            {activeTab === 'config' && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Batches Wrapper */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Batches</h3>
                            {editingConfigType !== 'batches' && (
                                <button onClick={() => startEditConfig('batches')} className="text-blue-600 text-sm hover:underline flex items-center"><Edit size={14} className="mr-1" /> Edit</button>
                            )}
                        </div>
                        {editingConfigType === 'batches' ? (
                            <div className="space-y-2">
                                <ul className="space-y-2 mb-4">
                                    {tempConfigList.map((item, idx) => (
                                        <li key={idx} className="flex justify-between bg-gray-50 p-2 rounded text-sm">
                                            {item}
                                            <button onClick={() => removeConfigItem(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex gap-2">
                                    <input type="text" value={newConfigItem} onChange={(e) => setNewConfigItem(e.target.value)} className="border p-2 rounded text-sm flex-1" placeholder="Add Batch..." />
                                    <button onClick={addConfigItem} className="bg-green-100 text-green-700 p-2 rounded"><Plus size={16} /></button>
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <button onClick={() => setEditingConfigType(null)} className="text-gray-500 text-sm">Cancel</button>
                                    <button onClick={saveConfig} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center"><Save size={14} className="mr-1" /> Save</button>
                                </div>
                            </div>
                        ) : (
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                {config.batches?.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                        )}
                    </div>

                    {/* Demo Sections Wrapper */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Demo Evaluation Sections</h3>
                            {editingConfigType !== 'demoSections' && (
                                <button onClick={() => startEditConfig('demoSections')} className="text-blue-600 text-sm hover:underline flex items-center"><Edit size={14} className="mr-1" /> Edit</button>
                            )}
                        </div>
                        {editingConfigType === 'demoSections' ? (
                            <div className="space-y-2">
                                <ul className="space-y-2 mb-4">
                                    {tempConfigList.map((item, idx) => (
                                        <li key={idx} className="flex justify-between bg-gray-50 p-2 rounded text-sm">
                                            {item}
                                            <button onClick={() => removeConfigItem(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex gap-2">
                                    <input type="text" value={newConfigItem} onChange={(e) => setNewConfigItem(e.target.value)} className="border p-2 rounded text-sm flex-1" placeholder="Add Section..." />
                                    <button onClick={addConfigItem} className="bg-green-100 text-green-700 p-2 rounded"><Plus size={16} /></button>
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                    <button onClick={() => setEditingConfigType(null)} className="text-gray-500 text-sm">Cancel</button>
                                    <button onClick={saveConfig} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center"><Save size={14} className="mr-1" /> Save</button>
                                </div>
                            </div>
                        ) : (
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                {config.demoSections?.map((ds, i) => <li key={i}>{ds}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* View: Questions */}
            {activeTab === 'questions' && !loading && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {editingQuestion ? (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Edit Question {editingQuestion.id}</h3>
                                <button onClick={() => setEditingQuestion(null)} className="text-gray-500 hover:text-gray-800"><X /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Question Text</label>
                                    <textarea
                                        value={editingQuestion.question}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                        className="mt-1 w-full border rounded p-2 text-sm"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Section</label>
                                    <input
                                        type="text"
                                        value={editingQuestion.section}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, section: e.target.value })}
                                        className="mt-1 w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Correct Answer Index (0-3)</label>
                                    <input
                                        type="number"
                                        min="0" max="3"
                                        value={editingQuestion.correctAnswer}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: parseInt(e.target.value) })}
                                        className="mt-1 w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button onClick={saveQuestion} className="bg-blue-600 text-white px-6 py-2 rounded shadow">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {questions.map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-xs font-mono text-gray-500">{q.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-lg truncate">{q.question}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">{q.section}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => startEditQuestion(q)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create Credentials Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Create User Credentials</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="input-field"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                                    <input
                                        type="text"
                                        value={newUser.employeeId}
                                        onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="participant">Faculty</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                {newUser.role === 'participant' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                            <select
                                                value={newUser.designation}
                                                onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="">Select Designation</option>
                                                {designations.map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <input
                                                type="text"
                                                value={newUser.department}
                                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                            <select
                                                value={newUser.batch}
                                                onChange={(e) => setNewUser({ ...newUser, batch: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="">Select Batch</option>
                                                {batches.map((b) => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleCreateCredentials} className="btn btn-primary" disabled={loading}>
                                    {loading ? <LoadingSpinner size={20} /> : "Create User"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Faculty Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Edit Faculty Registration</h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={editingUser.name || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={editingUser.email || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                                    <input
                                        type="password"
                                        value={editingUser.password || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                        className="input-field"
                                        placeholder="Leave blank to keep current"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                                    <input
                                        type="text"
                                        value={editingUser.employeeId || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <select
                                        value={editingUser.designation || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Select Designation</option>
                                        {designations.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={editingUser.department || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                    <select
                                        value={editingUser.batch || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, batch: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">Select Batch</option>
                                        {batches.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button onClick={() => setEditingUser(null)} className="btn btn-secondary">Cancel</button>
                                <button onClick={saveFacultyEdit} className="btn btn-primary" disabled={loading}>
                                    {loading ? <LoadingSpinner size={20} /> : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPanel;
