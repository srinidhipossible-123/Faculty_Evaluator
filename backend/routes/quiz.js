import express from 'express';
import QuizQuestion from '../models/QuizQuestion.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quiz - list all questions (auth required for faculty; admin can manage)
router.get('/', protect, async (req, res) => {
  try {
    const questions = await QuizQuestion.find({}).sort({ id: 1 });
    // Sort by numeric part of id
    questions.sort((a, b) => {
      const numA = parseInt(String(a.id).replace(/^\D+/g, '') || 0);
      const numB = parseInt(String(b.id).replace(/^\D+/g, '') || 0);
      return numA - numB;
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/quiz - add question (admin/super_admin)
router.post('/', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const q = await QuizQuestion.create(req.body);
    res.status(201).json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/quiz/:id - update question
router.put('/:id', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const q = await QuizQuestion.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/quiz/:id - delete question
router.delete('/:id', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const q = await QuizQuestion.findOneAndDelete({ id: req.params.id });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
