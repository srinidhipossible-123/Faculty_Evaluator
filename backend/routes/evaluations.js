import express from 'express';
import Evaluation from '../models/Evaluation.js';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Public: leaderboard (no auth)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const list = await Evaluation.find({})
      .sort({ totalScore: -1 })
      .limit(limit)
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use(protect);

// GET /api/evaluations - list all (admin/super_admin), with optional batch filter
router.get('/', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const { batch } = req.query;
    const filter = batch && batch !== 'All' ? { batch } : {};
    const evaluations = await Evaluation.find(filter).sort({ totalScore: -1 });
    res.json(evaluations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/evaluations/faculty - merged faculty + evaluation for admin dashboard
router.get('/faculty', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const { batch } = req.query;
    const userFilter = { role: 'participant' };
    if (batch && batch !== 'All') userFilter.batch = batch;
    const users = await User.find(userFilter).select('-password').lean();
    const evaluations = await Evaluation.find({}).lean();
    const evalMap = {};
    evaluations.forEach((e) => { evalMap[e.employeeId] = e; });
    const faculty = users.map((u) => ({
      ...u,
      uid: u._id.toString(),
      ...evalMap[u.employeeId],
    }));
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/evaluations/analysis - individual faculty analysis by common parameters (quiz sections, demo sections)
router.get('/analysis', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const { batch } = req.query;
    const userFilter = { role: 'participant' };
    if (batch && batch !== 'All') userFilter.batch = batch;
    const users = await User.find(userFilter).select('-password').lean();
    const evaluations = await Evaluation.find({}).lean();
    const evalMap = {};
    evaluations.forEach((e) => { evalMap[e.employeeId] = e; });
    const facultyWithScores = users.map((u) => {
      const e = evalMap[u.employeeId] || {};
      return {
        _id: u._id,
        uid: u._id.toString(),
        name: u.name,
        employeeId: u.employeeId,
        batch: u.batch,
        department: u.department,
        designation: u.designation,
        quizScore: e.quizScore,
        quizSectionScores: e.quizSectionScores || {},
        demoScore: e.demoScore,
        demoSectionScores: e.demoSectionScores || {},
        totalScore: e.totalScore,
      };
    });
    res.json(facultyWithScores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/evaluations/me - current user's evaluation (participant)
router.get('/me', async (req, res) => {
  try {
    const evalDoc = await Evaluation.findOne({ employeeId: req.user.employeeId });
    res.json(evalDoc || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/evaluations - submit quiz (participant)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can submit quiz' });
    }
    const { quizScore, quizSectionScores } = req.body;
    const evaluation = await Evaluation.findOneAndUpdate(
      { employeeId: req.user.employeeId },
      {
        employeeId: req.user.employeeId,
        userId: req.user._id,
        name: req.user.name,
        batch: req.user.batch,
        department: req.user.department,
        designation: req.user.designation,
        quizScore: quizScore ?? 0,
        quizSectionScores: quizSectionScores || {},
        totalScore: quizScore ?? 0,
        submittedAt: new Date(),
      },
      { new: true, upsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { quizAttempted: true });
    const io = req.app.get('io');
    if (io) io.to('admin-room').emit('evaluation:submitted', evaluation);
    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/evaluations/:employeeId - update demo scores (admin)
router.put('/:employeeId', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const { demoScore, demoSectionScores } = req.body;
    const evalDoc = await Evaluation.findOne({ employeeId: req.params.employeeId });
    if (!evalDoc) return res.status(404).json({ message: 'Evaluation not found' });
    const newTotal = (evalDoc.quizScore || 0) + (demoScore || 0);
    const updated = await Evaluation.findOneAndUpdate(
      { employeeId: req.params.employeeId },
      {
        demoScore: demoScore ?? evalDoc.demoScore,
        demoSectionScores: demoSectionScores ?? evalDoc.demoSectionScores,
        totalScore: newTotal,
        evaluatedBy: 'Admin',
      },
      { new: true }
    );
    const io = req.app.get('io');
    if (io) io.to('admin-room').emit('evaluation:updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
