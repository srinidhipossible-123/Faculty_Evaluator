import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// GET /api/config - get main config (batches, demoSections, designations)
router.get('/', async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ key: 'main' });
    if (!config) {
      config = await SystemConfig.create({
        key: 'main',
        batches: [],
        demoSections: [],
        designations: [],
        quizDuration: 30,
      });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/config - update config (admin/super_admin)
router.put('/', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  try {
    const { batches, demoSections, designations, quizDuration } = req.body;
    const updateData = { batches, demoSections, designations };
    if (quizDuration !== undefined) updateData.quizDuration = quizDuration;
    
    const config = await SystemConfig.findOneAndUpdate(
      { key: 'main' },
      { $set: updateData },
      { new: true, upsert: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
