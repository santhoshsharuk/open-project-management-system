# 🚀 DevFlow — Project Management Dashboard

> Open-source, GitHub-native PM dashboard for developer teams. Built in India 🇮🇳

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

### 🎬 Demo Video

[![DevFlow Demo](https://img.youtube.com/vi/oGESWRfU_80/maxresdefault.jpg)](https://youtu.be/oGESWRfU_80)

▶️ [Watch the full demo on YouTube](https://youtu.be/oGESWRfU_80)

---

## 🌟 Features

| Feature | Community (Free) | Pro | Growth |
|---|---|---|---|
| Kanban Board | ✅ | ✅ | ✅ |
| GitHub Sync & OAuth SSO | ✅ | ✅ | ✅ |
| Sprint Planning & Burndown | ✅ | ✅ | ✅ |
| Daily Standups | ✅ | ✅ | ✅ |
| Sprint Retrospectives | ✅ | ✅ | ✅ |
| Activity Feed | ✅ | ✅ | ✅ |
| In-App Notifications | ✅ | ✅ | ✅ |
| Team Invitations | ✅ | ✅ | ✅ |
| Time Tracking & Work Logging | ✅ | ✅ | ✅ |
| Project Close / Reopen | ✅ | ✅ | ✅ |
| GitHub Profile Integration | ✅ | ✅ | ✅ |
| Discord / Slack Webhooks | ✅ | ✅ | ✅ |
| Unlimited Projects | ❌ | ✅ | ✅ |
| Analytics | Basic | Advanced | AI-powered |
| AI Delay Prediction | ❌ | ❌ | ✅ |
| Price | Free | ₹699/mo | ₹1999/mo |

---

## 🏗 Tech Stack

**Frontend:** React 19 + TypeScript + Vite 7 + Tailwind CSS v3 + Zustand + Recharts + @hello-pangea/dnd  
**Backend:** FastAPI + SQLAlchemy + SQLite 3 + JWT (python-jose) + httpx  
**Deployment:** Single-server bundle (Vite → FastAPI static) · Docker Compose

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows  (source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Edit with your GitHub OAuth keys

# Run database migration
python migrate_db.py

# Start API server
uvicorn main:app --reload
# → http://localhost:8000/docs
```

### 2. Frontend (Development)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Production Bundle (Single Server)

Build the frontend into the backend and serve everything from one port:

```bash
# Build frontend → outputs to backend/static/
cd frontend
npm run build

# Serve API + frontend on one port
cd ../backend
uvicorn main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000  (serves both API and UI)
```

### 4. Docker Compose

```bash
docker-compose up --build
# → http://localhost:8000
```

---

## 📁 Project Structure

```
project_managem/
├── frontend/                     # React + Vite + TypeScript
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx       # Marketing landing page
│       │   ├── Login.tsx         # Login + GitHub SSO
│       │   ├── Register.tsx      # Registration
│       │   ├── Dashboard.tsx     # Overview dashboard
│       │   ├── Projects.tsx      # Project list
│       │   ├── ProjectLayout.tsx # Project tabs layout
│       │   ├── ProjectBoard.tsx  # Kanban board (drag & drop)
│       │   ├── SprintPlanning.tsx# Sprint management & task assignment
│       │   ├── Standups.tsx      # Daily standups
│       │   ├── Retrospectives.tsx# Sprint retrospectives
│       │   ├── Analytics.tsx     # Burndown charts & workload
│       │   ├── ActivityFeed.tsx  # Project activity timeline
│       │   ├── TimeTracking.tsx  # Work hours logging & project summary
│       │   ├── GithubIntegration.tsx # GitHub repo connection
│       │   ├── Settings.tsx      # Profile, GitHub connect, notifications, team
│       │   └── Pricing.tsx       # Plan comparison
│       ├── components/
│       │   ├── Layout.tsx        # Sidebar + header + GitHub avatar
│       │   ├── NotificationCenter.tsx # In-app notification dropdown
│       │   └── TimelineView.tsx  # Timeline visualization
│       ├── store/
│       │   ├── authStore.ts      # Auth state (Zustand)
│       │   └── projectStore.ts   # Projects, tasks, sprints, time entries (Zustand)
│       ├── lib/
│       │   └── api.ts            # Axios instance with JWT interceptor
│       ├── types/
│       │   └── index.ts          # TypeScript interfaces
│       └── data/
│           └── mockData.ts       # Demo data
├── backend/                      # FastAPI
│   ├── main.py                   # App + CORS + SPA static serving + background tasks
│   ├── database.py               # SQLAlchemy engine (SQLite)
│   ├── models.py                 # ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── auth.py                   # JWT helpers + get_current_user dependency
│   ├── notifications.py          # Discord/Slack webhook + in-app notifications
│   ├── migrate_db.py             # Database migration script
│   └── routers/
│       ├── auth.py               # Register, login, profile CRUD
│       ├── oauth.py              # GitHub OAuth SSO + profile connect/disconnect
│       ├── orgs.py               # Organization management
│       ├── projects.py           # Project CRUD
│       ├── tasks.py              # Task CRUD + completed sprint protection
│       ├── sprints.py            # Sprint CRUD + burndown + workload
│       ├── standups.py           # Daily standups
│       ├── retrospectives.py     # Sprint retrospectives
│       ├── github.py             # GitHub webhook receiver
│       ├── activity.py           # Activity feed
│       ├── notifications.py      # In-app notifications
│       ├── invitations.py        # Team invitations
│       └── time_tracking.py      # Time entries + project summary + close/reopen
├── docker-compose.yml
└── plan.md                       # Product roadmap
```

---

## 🔌 API Endpoints

### Auth & Users
```
POST   /auth/register              # Create account + organization
POST   /auth/login                 # Email/password login → JWT
GET    /auth/me                    # Current user profile
PATCH  /auth/me                    # Update profile (name, email, discord, github)
GET    /auth/users                 # List organization members
```

### GitHub OAuth
```
GET    /auth/github/               # GitHub OAuth → repo connection
GET    /auth/github/login          # GitHub SSO login
GET    /auth/github/callback       # OAuth callback handler
GET    /auth/github/connect        # Link GitHub profile (redirect)
POST   /auth/github/connect        # Link GitHub profile (token)
DELETE /auth/github/connect        # Unlink GitHub profile
```

### Organizations
```
GET    /orgs/{org_id}              # Get organization details
```

### Projects
```
GET    /projects                   # List projects
POST   /projects                   # Create project
GET    /projects/{id}              # Get project
PATCH  /projects/{id}              # Update project
DELETE /projects/{id}              # Delete project
```

### Tasks
```
GET    /projects/{id}/tasks        # List tasks
POST   /projects/{id}/tasks        # Create task
PATCH  /projects/{id}/tasks/{tid}  # Update task (status, sprint, assignee…)
DELETE /projects/{id}/tasks/{tid}  # Delete task
```

### Sprints
```
GET    /projects/{id}/sprints      # List sprints
POST   /projects/{id}/sprints      # Create sprint
PATCH  /projects/{id}/sprints/{sid}# Update sprint (start, complete)
DELETE /projects/{id}/sprints/{sid}# Delete sprint
GET    /projects/{id}/sprints/{sid}/burndown  # Burndown chart data
GET    /projects/{id}/workload     # Team workload distribution
```

### Standups & Retrospectives
```
GET    /projects/{id}/sprints/{sid}/standups        # List standups
POST   /projects/{id}/sprints/{sid}/standups        # Submit standup
GET    /projects/{id}/sprints/{sid}/retrospectives  # List retros
POST   /projects/{id}/sprints/{sid}/retrospectives  # Create retro
PATCH  /projects/{id}/sprints/{sid}/retrospectives/{rid}  # Update retro
```

### Time Tracking
```
GET    /projects/{id}/time-entries # List time entries
POST   /projects/{id}/time-entries # Log time
DELETE /projects/{id}/time-entries/{eid}  # Delete entry
GET    /projects/{id}/summary      # Project hours summary
POST   /projects/{id}/close        # Close project
POST   /projects/{id}/reopen       # Reopen project
```

### Activity & Notifications
```
GET    /projects/{id}/activity     # Activity feed
GET    /notifications              # User notifications
GET    /notifications/unread-count # Unread count
PATCH  /notifications/{nid}/read   # Mark as read
PATCH  /notifications/read-all     # Mark all as read
```

### Invitations
```
POST   /invitations                # Send team invitation
GET    /invitations                # List sent invitations
GET    /invitations/pending        # Pending invitations for current user
PATCH  /invitations/{iid}/accept   # Accept invitation
DELETE /invitations/{iid}          # Cancel invitation
```

### Webhooks
```
POST   /webhooks/github/{org_id}   # GitHub webhook receiver
```

---

## ⚙️ Environment Variables

Create `backend/.env` from `.env.example`:

```env
SECRET_KEY=your-jwt-secret-key
GITHUB_CLIENT_ID=your-github-oauth-app-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

Frontend (optional — defaults to `http://localhost:8000`):

```env
VITE_API_URL=http://localhost:8000
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

Built by **Santhosh** · India 🇮🇳  
_Mission: Build simple tools for serious builders._
