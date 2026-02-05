# Faculty Evaluation System – Backend

Node.js + Express + MongoDB API with Socket.io for real-time admin updates.

## Setup

1. Copy `.env.example` to `.env` and set:
   - `MONGODB_URI` – your MongoDB connection string (e.g. `mongodb://localhost:27017/faculty_evaluation`)
   - Optionally `JWT_SECRET`, `PORT`, `CORS_ORIGIN`

2. Install and run:
   ```bash
   npm install
   npm run seed    # create DB, config, quiz questions, demo users
   npm run dev     # start server (default port 8000)
   ```

## Seed data

- **Config:** batches (Batch A–H), demo sections (Use of Tools, Engagement with Tools, etc.), designations.
- **Quiz:** 25 questions (5 sections × 5 questions, 2 marks each).
- **Users:** Super Admin, Admin, and 3 faculty (see `scripts/seed_data.js` for emails/passwords).

After running `npm run seed`, you can log in as:
- `super@faculty.com` / `admin123` (Super Admin)
- `admin@faculty.com` / `admin123` (Admin)
- `faculty1@faculty.com` / `password123` (Faculty)

## API

- `POST /api/auth/register` – register faculty
- `POST /api/auth/login` – login (returns JWT + user)
- `GET /api/auth/me` – current user (Bearer token)
- `GET /api/config` – batches, demoSections, designations
- `GET/POST/PUT/DELETE /api/quiz` – quiz questions (admin)
- `GET /api/evaluations/leaderboard` – public leaderboard
- `GET /api/evaluations/faculty` – faculty + evaluations (admin)
- `GET /api/evaluations/analysis` – faculty analysis by common parameters (admin)
- `POST /api/evaluations` – submit quiz (participant)
- `PUT /api/evaluations/:employeeId` – update demo scores (admin)
- `GET/POST/PUT/PATCH /api/users` – user management (super admin)

## WebSocket

Socket.io namespace: same origin as API. Admin client can emit `admin:subscribe` and listen for:
- `evaluation:submitted` – new quiz submission
- `evaluation:updated` – demo evaluation updated

Used for real-time updates on the admin dashboard.
