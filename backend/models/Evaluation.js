import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  batch: { type: String },
  department: { type: String },
  designation: { type: String },
  quizScore: { type: Number, default: 0 },
  quizSectionScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  demoScore: { type: Number, default: null },
  demoSectionScores: { type: mongoose.Schema.Types.Mixed, default: null },
  totalScore: { type: Number, default: 0 },
  evaluatedBy: { type: String },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

evaluationSchema.index({ totalScore: -1 });

export default mongoose.model('Evaluation', evaluationSchema);
