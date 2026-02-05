import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  section: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number, required: true },
  marks: { type: Number, default: 2 },
}, { timestamps: true });

export default mongoose.model('QuizQuestion', quizQuestionSchema);
