import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'main' },
  batches: [{ type: String }],
  demoSections: [{ type: String }],
  designations: [{ type: String }],
  quizDuration: { type: Number, default: 30 }, // Default 30 minutes
}, { timestamps: true });

export default mongoose.model('SystemConfig', systemConfigSchema);
