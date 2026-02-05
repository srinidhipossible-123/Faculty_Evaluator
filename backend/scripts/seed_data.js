import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import QuizQuestion from '../models/QuizQuestion.js';
import SystemConfig from '../models/SystemConfig.js';
import Evaluation from '../models/Evaluation.js';

const REAL_QUIZ_QUESTIONS = [
  { id: 'q1', section: 'Modern Technology and Student Centric Learning', question: 'Modern teaching focuses more on:', options: ['Memorizing textbooks', 'Conceptual understanding', 'Repetition drills', 'Copying notes'], correctAnswer: 1, marks: 2 },
  { id: 'q2', section: 'Modern Technology and Student Centric Learning', question: 'The faculty role in modern teaching is mainly as a:', options: ['Dictator', 'Examiner', 'Facilitator and mentor', 'Silent observer'], correctAnswer: 2, marks: 2 },
  { id: 'q3', section: 'Modern Technology and Student Centric Learning', question: 'Student-centric teaching promotes:', options: ['Passive learning', 'Active participation', 'Only lectures', 'No assessment'], correctAnswer: 1, marks: 2 },
  { id: 'q4', section: 'Modern Technology and Student Centric Learning', question: 'Which is NOT a modern teaching strategy?', options: ['Flipped classroom', 'Inquiry-based learning', 'Rote memorization', 'Gamification'], correctAnswer: 2, marks: 2 },
  { id: 'q5', section: 'Modern Technology and Student Centric Learning', question: 'Flipped classroom means:', options: ['Students learn only in class', 'Students learn concepts at home and apply in class', 'Teachers stop teaching', 'No homework is given'], correctAnswer: 1, marks: 2 },
  { id: 'q6', section: 'Technology in Education', question: 'A key advantage of technology in education is:', options: ['Less engagement', 'Increased interaction', 'No collaboration', 'More boredom'], correctAnswer: 1, marks: 2 },
  { id: 'q7', section: 'Technology in Education', question: 'Personalized learning paths are enabled mainly through:', options: ['Chalkboard', 'AI-driven platforms', 'Paper tests', 'Dictation'], correctAnswer: 1, marks: 2 },
  { id: 'q8', section: 'Technology in Education', question: 'Instant feedback is possible using:', options: ['Online quizzes', 'Only textbooks', 'Handwritten notes', 'Blackboards'], correctAnswer: 0, marks: 2 },
  { id: 'q9', section: 'Technology in Education', question: 'Technology-supported learning should focus on:', options: ['Tools only', 'Learning outcomes, not tools', 'Entertainment', 'Social media use'], correctAnswer: 1, marks: 2 },
  { id: 'q10', section: 'Technology in Education', question: 'Global learning access is supported by:', options: ['Traditional chalk', 'E-learning platforms', 'No internet tools', 'Oral tests only'], correctAnswer: 1, marks: 2 },
  { id: 'q11', section: 'Designing Technology Supported Activities', question: 'The first step in designing a tech-supported activity is:', options: ['Buy devices', 'Identify learning outcomes', 'Show videos', 'Skip assessment'], correctAnswer: 1, marks: 2 },
  { id: 'q12', section: 'Designing Technology Supported Activities', question: 'Tools should be selected based on:', options: ['Fashion', 'Cost only', 'Learning objectives', 'Random choice'], correctAnswer: 2, marks: 2 },
  { id: 'q13', section: 'Designing Technology Supported Activities', question: 'Effective learning activities require:', options: ['Clear learning outcomes', 'Only lectures', 'No feedback', 'Only assignments'], correctAnswer: 0, marks: 2 },
  { id: 'q14', section: 'Designing Technology Supported Activities', question: 'Which is an example of technology-supported activity?', options: ['Writing without discussion', 'Simulation for dynamic process', 'Only dictation', 'Reading silently'], correctAnswer: 1, marks: 2 },
  { id: 'q15', section: 'Designing Technology Supported Activities', question: 'Assessment should be:', options: ['Ignored', 'Aligned with outcomes', 'Only surprise tests', 'Unplanned'], correctAnswer: 1, marks: 2 },
  { id: 'q16', section: 'Education Tool and Demonstration', question: 'Digital tools for demonstrations include:', options: ['Simulations and videos', 'Only chalk', 'Only notebooks', 'None'], correctAnswer: 0, marks: 2 },
  { id: 'q17', section: 'Education Tool and Demonstration', question: 'Physical demonstration tools include:', options: ['Models, kits, prototypes', 'Only YouTube', 'Online quizzes', 'Social media'], correctAnswer: 0, marks: 2 },
  { id: 'q18', section: 'Education Tool and Demonstration', question: 'Simulations are best used for:', options: ['Static concepts', 'Dynamic processes', 'Only exams', 'Grammar'], correctAnswer: 1, marks: 2 },
  { id: 'q19', section: 'Education Tool and Demonstration', question: 'Videos are most effective when used with:', options: ['Pause-and-discuss strategy', 'Skipping content', 'No interaction', 'Only entertainment'], correctAnswer: 0, marks: 2 },
  { id: 'q20', section: 'Education Tool and Demonstration', question: 'Digital + Physical demonstration helps by:', options: ['Reducing clarity', 'Reinforcing understanding', 'Avoiding questions', 'Removing observation'], correctAnswer: 1, marks: 2 },
  { id: 'q21', section: 'Ethics, Inclusivity and Appropriative of Tools', question: 'Ethical use of digital tools includes:', options: ['Copying without attribution', 'Respecting copyrights', 'Plagiarism', 'Fake content'], correctAnswer: 1, marks: 2 },
  { id: 'q22', section: 'Ethics, Inclusivity and Appropriative of Tools', question: 'Unethical practice is:', options: ['Using AI with disclosure', 'Submitting AI work as original', 'Providing attribution', 'Using simulations properly'], correctAnswer: 1, marks: 2 },
  { id: 'q23', section: 'Ethics, Inclusivity and Appropriative of Tools', question: 'Inclusive technology ensures learning for:', options: ['Only toppers', 'All students including disabilities', 'Only teachers', 'Only urban students'], correctAnswer: 1, marks: 2 },
  { id: 'q24', section: 'Ethics, Inclusivity and Appropriative of Tools', question: 'Best practice for inclusive videos is:', options: ['No captions', 'Captions and subtitles', 'Dark visuals', 'Fast playback only'], correctAnswer: 1, marks: 2 },
  { id: 'q25', section: 'Ethics, Inclusivity and Appropriative of Tools', question: 'Appropriate technology use means:', options: ['Using tools unnecessarily', 'Aligning tools with learning outcomes', 'Using videos always', 'Avoiding pedagogy'], correctAnswer: 1, marks: 2 },
];

const INITIAL_BATCHES = ['Batch A', 'Batch B', 'Batch C', 'Batch D', 'Batch E', 'Batch F', 'Batch G', 'Batch H'];
const INITIAL_DEMO_SECTIONS = ['Use of Tools', 'Engagement with Tools', 'Concept Visualization', 'Interactive Visualization', 'Relevancy of Using Tools'];
const DESIGNATIONS = ['Tutor', 'Assistant Professor', 'Associate Professor', 'Professor'];

const DEMO_USERS = [
  { email: 'super@faculty.com', password: 'admin123', role: 'super_admin', name: 'Super Admin', employeeId: 'SUPER001' },
  { email: 'admin@faculty.com', password: 'admin123', role: 'admin', name: 'Admin User', employeeId: 'ADM001' },
  { email: 'faculty1@faculty.com', password: 'password123', role: 'participant', name: 'Dr. Faculty One', employeeId: 'FAC001', designation: 'Professor', department: 'General', batch: 'Batch A' },
  { email: 'faculty2@faculty.com', password: 'password123', role: 'participant', name: 'Mr. Faculty Two', employeeId: 'FAC002', designation: 'Tutor', department: 'General', batch: 'Batch B' },
  { email: 'faculty3@faculty.com', password: 'password123', role: 'participant', name: 'Ms. Faculty Three', employeeId: 'FAC003', designation: 'Assistant Professor', department: 'General', batch: 'Batch A' },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/faculty_evaluation';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // System config
  await SystemConfig.findOneAndUpdate(
    { key: 'main' },
    { key: 'main', batches: INITIAL_BATCHES, demoSections: INITIAL_DEMO_SECTIONS, designations: DESIGNATIONS },
    { upsert: true, new: true }
  );
  console.log('System config seeded');

  // Quiz questions
  for (const q of REAL_QUIZ_QUESTIONS) {
    await QuizQuestion.findOneAndUpdate({ id: q.id }, q, { upsert: true, new: true });
  }
  console.log('Quiz questions seeded:', REAL_QUIZ_QUESTIONS.length);

  // Users
  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('User exists, skip:', u.email);
      continue;
    }
    await User.create({
      name: u.name,
      email: u.email,
      password: u.password,
      employeeId: u.employeeId || '',
      designation: u.designation || '',
      department: u.department || 'General',
      batch: u.batch || '',
      role: u.role,
      quizAttempted: false,
    });
    console.log('Created user:', u.email);
  }

  console.log('Seed completed successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
