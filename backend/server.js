import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import quizRoutes from './routes/quiz.js';
import evaluationRoutes from './routes/evaluations.js';
import configRoutes from './routes/config.js';

await connectDB();

const app = express();
const httpServer = createServer(app);

io.on('connection', (socket) => {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.includes(',') ? corsOrigin.split(',').map((o) => o.trim()) : [corsOrigin, 'http://127.0.0.1:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Attach io to app so routes can emit
app.set('io', io);

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

// Socket.io: real-time admin updates (e.g. new evaluation, faculty list change)// Attach io to app so routes can emit
