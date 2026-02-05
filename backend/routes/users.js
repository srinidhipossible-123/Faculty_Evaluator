import express from 'express';
import User from '../models/User.js';
import { protect, restrictTo } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// All routes require auth
router.use(protect);

// GET /api/users - list users (admin/super_admin)
router.get('/', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/participants - list only participants (for admin dashboard)
router.get('/participants', restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'participant' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users - create user (super_admin only - create credentials)
router.post('/', restrictTo('super_admin'), async (req, res) => {
  try {
    const { name, email, password, employeeId, designation, department, batch, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({
      name,
      email,
      password,
      employeeId: employeeId || '',
      designation: designation || '',
      department: department || '',
      batch: batch || '',
      role: role || 'participant',
      quizAttempted: false,
    });
    const out = await User.findById(user._id).select('-password');
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id - update user (super_admin or self for profile)
router.put('/:id', async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const isSelf = req.user._id.toString() === req.params.id;
    if (!isSuperAdmin && !isSelf) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updates = { ...req.body };
    delete updates.password;
    // delete updates.email; // Allow email updates
    if (req.body.password && (isSuperAdmin || isSelf)) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/reset-attempt - reset quiz attempt (super_admin)
router.patch('/:id/reset-attempt', restrictTo('super_admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { quizAttempted: false },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const Evaluation = (await import('../models/Evaluation.js')).default;
    await Evaluation.findOneAndDelete({ employeeId: user.employeeId });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
