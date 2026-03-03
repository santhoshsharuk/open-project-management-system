# DevFlow — Complete Software Breakdown
### Tutorial Video Script & Podcast Reference Guide

> Use this document as a guide for your YouTube tutorial video and podcast episodes.
> Each section has talking points, technical details, and demo walkthrough notes.

---

## 📌 INTRO — What is DevFlow?

**One-liner:** DevFlow is an open-source, GitHub-native project management dashboard built for developer teams.

**Talking Points:**
- DevFlow is a full-stack project management tool — think of it like a lightweight Jira or Linear, but open-source and built specifically for developers.
- It's designed to fit naturally into a developer's workflow — you connect your GitHub repos, track sprints, run standups, log work hours, and manage your entire team from one dashboard.
- Built as a single-person project in India, it proves that one developer can build production-grade SaaS software.
- The entire codebase is open-source under MIT license — anyone can fork it, self-host it, or contribute to it.

**Key Differentiators:**
- GitHub-native (OAuth SSO, repo sync, webhook support)
- Lightweight — no bloat, fast UI, simple setup
- Single-server deployment — one command to run both frontend and backend
- Built with modern tech stack (React 19, FastAPI, TypeScript)

---

## 🏗 TECH STACK — What Powers DevFlow?

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library — component-based, fast rendering |
| **TypeScript** | Type safety — catches bugs at compile time |
| **Vite 7** | Build tool — instant dev server, fast production builds |
| **Tailwind CSS v3** | Utility-first CSS — dark theme, responsive design |
| **Zustand** | State management — lightweight alternative to Redux |
| **Recharts** | Charts & analytics — burndown charts, workload graphs |
| **@hello-pangea/dnd** | Drag and drop — Kanban board task movement |
| **Axios** | HTTP client — API calls with JWT interceptor |
| **React Router v7** | Client-side routing — SPA navigation |
| **Lucide React** | Icon library — consistent, modern icons |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Python web framework — async, auto-docs, fast |
| **SQLAlchemy** | ORM — database models and queries |
| **SQLite 3** | Database — zero-config, file-based, perfect for self-hosting |
| **python-jose** | JWT — authentication tokens |
| **bcrypt** | Password hashing — secure credential storage |
| **httpx** | Async HTTP — GitHub API calls, webhooks |
| **Pydantic** | Data validation — request/response schemas |
| **uvicorn** | ASGI server — runs the FastAPI app |

### Deployment
| Method | Details |
|---|---|
| **Single Server** | Vite builds into FastAPI's static folder — one port serves everything |
| **Docker Compose** | Containerized deployment — one command setup |
| **Development** | Frontend on port 5173, Backend on port 8000 — hot reload on both |

**Video Demo Note:** Show the Swagger docs at `/docs` — FastAPI auto-generates interactive API documentation.

---

## 🔐 AUTHENTICATION SYSTEM — How Users Sign In

### Email/Password Registration
1. User fills in name, email, password, and organization name
2. Backend hashes the password with bcrypt
3. Creates a new Organization record
4. Creates a new User record linked to that organization
5. Returns a JWT token (valid for 7 days)
6. Frontend stores the token in `localStorage`

### GitHub SSO (Single Sign-On)
1. User clicks "Continue with GitHub" on the login page
2. Redirected to GitHub's OAuth authorization page
3. After approval, GitHub redirects back with a code
4. Backend exchanges the code for a GitHub access token
5. Fetches GitHub profile (name, email, avatar)
6. If user exists → logs them in and updates their GitHub avatar
7. If new user → creates account + organization automatically
8. Issues a DevFlow JWT and redirects to the dashboard

### JWT Token Flow
- Every API request includes the JWT in the `Authorization: Bearer <token>` header
- Axios interceptor automatically attaches the token
- On 401 response → clears token and redirects to login
- Tokens expire after 7 days

**Podcast Talking Point:** "We chose JWT over session-based auth because it's stateless — the backend doesn't need to store session data. This makes the API simpler and easier to scale."

---

## 🏢 ORGANIZATION & TEAM SYSTEM

### Multi-Tenant Architecture
- Every user belongs to an organization
- Organizations are isolated — users can only see their own org's data
- Two roles: **Admin** (full control) and **Member** (task-level access)

### Team Invitations
- Admins can invite team members by email
- Invited users see a pending invitation on their Settings page
- One click to accept and join the organization
- Admins can cancel pending invitations

**Video Demo Note:** Show the Settings page → Team Invitations section. Send an invite, then log in as the invited user and accept it.

---

## 📋 PROJECT MANAGEMENT

### Creating Projects
- Name, description, optional deadline
- Optional GitHub repo connection
- Optional Discord/Slack webhook URLs for notifications
- Projects start in "active" status

### Project Statuses
| Status | Meaning |
|---|---|
| **Active** | Currently being worked on |
| **On Hold** | Paused temporarily |
| **Completed** | All work done |
| **Archived** | Hidden from active view |

### Project Close/Reopen
- Admins can close a project — sets a `closed_at` timestamp
- Closed projects show total hours logged, task completion stats
- Projects can be reopened if needed

### Project Tabs
Each project has 7 tabs:
1. **Active Sprint** — Kanban board for the current sprint
2. **Backlog & Sprints** — Sprint planning, task assignment
3. **Standups** — Daily standup check-ins
4. **Retrospectives** — Sprint review notes
5. **Activity** — Timeline of all project events
6. **Analytics** — Burndown charts, workload distribution
7. **Work Time** — Time tracking, hour logging

**Video Demo Note:** Create a project, walk through each tab one by one.

---

## 📊 KANBAN BOARD — Drag & Drop Task Management

### How It Works
- Tasks are displayed as cards in columns: **Backlog → Todo → In Progress → Done**
- Drag a task card from one column to another to update its status
- Uses `@hello-pangea/dnd` library (fork of react-beautiful-dnd)
- Backend API is called immediately on drop to persist the change

### Task Properties
| Field | Description |
|---|---|
| Title | Task name |
| Description | Detailed description |
| Status | backlog, todo, in_progress, done |
| Priority | low, medium, high, urgent |
| Assignee | Team member responsible |
| Due Date | Deadline for completion |
| Sprint | Which sprint the task belongs to |
| Labels | Comma-separated tags |
| GitHub Issue | Linked GitHub issue URL |
| GitHub Branch | Associated branch name |
| GitHub PR | Pull request link |

### Completed Sprint Protection
- Once a sprint is marked as "completed," tasks inside it cannot be dragged out
- This prevents accidental changes to historical sprint data
- Both frontend (drag disabled) and backend (API validation) enforce this rule

**Podcast Talking Point:** "One interesting bug we caught — users could drag tasks out of completed sprints, which would corrupt sprint history. We fixed this with a dual-layer protection: the frontend disables dragging, and the backend rejects the API call even if someone bypasses the UI."

---

## 🏃 SPRINT MANAGEMENT

### Sprint Lifecycle
1. **Create Sprint** — Set name, goal, start date, end date
2. **Assign Tasks** — Drag tasks from backlog into the sprint
3. **Start Sprint** — Changes status from "planned" to "active"
4. **Work Through Sprint** — Move tasks across the board
5. **Complete Sprint** — Locks the sprint, triggers retrospective

### Sprint Statuses
| Status | Description |
|---|---|
| **Planned** | Sprint created but not started |
| **Active** | Currently in progress (only one active sprint per project) |
| **Completed** | Sprint finished — tasks locked |

### Burndown Chart
- Tracks task completion over time during a sprint
- X-axis: days of the sprint
- Y-axis: remaining tasks
- Ideal burndown line shows expected progress
- Actual line shows real progress
- Generated from backend data using Recharts

### Workload Distribution
- Shows how many tasks are assigned to each team member
- Helps identify if someone is overloaded
- Displayed as a bar chart in the Analytics tab

**Video Demo Note:** Create a sprint, add tasks, start the sprint, complete a few tasks, then show the burndown chart updating.

---

## 📝 DAILY STANDUPS

### How Standups Work
- Each team member submits a daily standup per sprint
- Three fields:
  1. **Yesterday** — What did you work on yesterday?
  2. **Today** — What are you planning to work on today?
  3. **Blockers** — Anything blocking your progress?
- Standups are timestamped and linked to the sprint
- Team can see each other's standups in chronological order

**Podcast Talking Point:** "Standups are one of those features that seem simple but are incredibly valuable for remote teams. Instead of scheduling a 15-minute meeting every day, team members just type their update when they start working. Everyone stays in sync without interrupting each other's flow."

---

## 🔄 SPRINT RETROSPECTIVES

### What's a Retrospective?
- After completing a sprint, the team reflects on what went well, what didn't, and what to improve
- Three sections:
  1. **What went well** — Celebrate wins
  2. **Needs improvement** — Identify problems
  3. **Action items** — Concrete steps for next sprint

- Retrospectives are saved and linked to the sprint
- Teams can reference past retros to track improvement over time

---

## ⏱ TIME TRACKING

### Logging Work Hours
- Team members log time entries per task or per project
- Each entry includes: task (optional), description, duration (in minutes), date
- Summary dashboard shows:
  - **Total hours** logged on the project
  - **Hours by member** — who's contributing the most
  - **Hours by task** — which tasks took the most effort
- Time entries can be deleted by the person who logged them

### Project Summary
- Total hours across all members
- Member-wise breakdown
- Task-wise breakdown
- Useful for billing, estimations, and sprint planning

**Video Demo Note:** Log a few time entries for different tasks, then show the summary cards and breakdown tables.

---

## 🔔 NOTIFICATIONS

### In-App Notifications
- Bell icon in the header shows unread count
- Notifications are triggered by:
  - Task assignments
  - Due date reminders (automated — runs every 6 hours)
  - Overdue task alerts
  - Team activity
- Click a notification to navigate to the relevant project/task
- Mark individual or all notifications as read

### Discord & Slack Webhooks
- Set a Discord or Slack webhook URL on a project
- When events happen (task created, sprint started, due date reminder), a message is automatically posted to the channel
- Uses standard webhook format — works with any Discord/Slack workspace

### Due Date Reminders (Background Task)
- A background loop runs every 6 hours on the server
- Checks for tasks due within the next 24 hours → sends "due soon" notification
- Checks for overdue tasks → sends "overdue" alert
- Sends both in-app notifications and Discord/Slack webhook messages

**Podcast Talking Point:** "The background task system is interesting — instead of using a separate task queue like Celery, we use Python's built-in asyncio. When the FastAPI server starts, it launches a coroutine that runs in an infinite loop, checking for due tasks every 6 hours. It's simple, no extra infrastructure needed."

---

## 🐙 GITHUB INTEGRATION

### Repository Connection
- OAuth flow connects your GitHub account
- Select a repository to link with a DevFlow project
- GitHub webhook receiver at `/webhooks/github/{org_id}`

### GitHub Profile Integration
- Connect your GitHub profile from Settings page
- Your GitHub avatar becomes your DevFlow profile picture
- Shows `@username` with link to your GitHub profile
- Sidebar and all user avatars use your GitHub photo
- Can disconnect at any time

### GitHub SSO
- One-click login with GitHub
- No password needed — GitHub handles authentication
- Profile info (name, email, avatar) auto-synced

**Video Demo Note:** Show the GitHub Integration page, connect a repo. Then go to Settings and connect your GitHub profile — show the avatar updating.

---

## 📈 ANALYTICS

### Burndown Charts
- Track sprint progress visually
- Compare actual vs. ideal task completion rate
- Helps teams identify when they're falling behind

### Workload Distribution
- Bar chart showing tasks per team member
- Filter by sprint or view overall project workload
- Identifies unbalanced task distribution

### Activity Feed
- Chronological timeline of all project events
- Shows who did what and when
- Events: task created, status changed, sprint started/completed, comments added

---

## ⚙️ SETTINGS PAGE

### Profile Section
- **GitHub Avatar** — auto-synced from GitHub when connected
- **Display Name** — editable
- **Email** — editable
- **Role** — read-only (admin/member)
- **Discord User ID** — for Discord @mentions
- **Connect/Disconnect GitHub** — link your GitHub profile

### Organization Section
- Organization name
- Current plan (Free / Pro / Growth)

### Notification Preferences
- Toggle email notifications
- Toggle Slack notifications

### Security
- Change password
- Enable 2FA (planned)
- Delete account

### Team Invitations
- Send invitations by email
- View sent invitations and their status
- Accept pending invitations from other orgs

---

## 🏗 ARCHITECTURE — How It All Fits Together

### Frontend Architecture
```
User Browser
    ↓
React App (SPA)
    ↓
Zustand Store (authStore, projectStore)
    ↓
Axios API Client (with JWT interceptor)
    ↓
FastAPI Backend (REST API)
```

### Backend Architecture
```
FastAPI App
    ├── CORS Middleware
    ├── 13 API Routers
    │   ├── auth (register, login, profile)
    │   ├── oauth (GitHub SSO, profile connect)
    │   ├── orgs (organization details)
    │   ├── projects (CRUD)
    │   ├── tasks (CRUD + sprint protection)
    │   ├── sprints (CRUD + burndown + workload)
    │   ├── standups (daily check-ins)
    │   ├── retrospectives (sprint reviews)
    │   ├── github (webhook receiver)
    │   ├── activity (project timeline)
    │   ├── notifications (in-app alerts)
    │   ├── invitations (team management)
    │   └── time_tracking (hours + close/reopen)
    ├── Background Task (due-date reminders)
    ├── Static File Server (production SPA)
    └── SQLite Database (devflow.db)
```

### Database Schema (12 Tables)
```
organizations ──┐
                 ├── users
                 ├── projects ──┬── tasks ──── comments
                 │              ├── sprints ──┬── standups
                 │              │             └── retrospectives
                 │              ├── activity_logs
                 │              └── time_entries
                 ├── github_integrations
                 ├── invitations
                 └── notifications
```

### Production Deployment (Single Server)
```
npm run build (frontend)
    ↓
Outputs to backend/static/
    ↓
uvicorn main:app --port 8000
    ↓
FastAPI serves:
    /api/* → JSON responses (REST API)
    /assets/* → JS, CSS bundles
    /* → index.html (SPA fallback)
    ↓
Everything on ONE port (8000)
```

---

## 💰 BUSINESS MODEL — Open Core + SaaS

### Free (Community / Self-Hosted)
- Full source code on GitHub
- All core features included
- Self-host on your own server
- Community support via GitHub Issues

### Pro Plan — ₹699/month (~$8/month)
- Hosted version (no server management)
- Unlimited projects
- Advanced analytics
- Priority support

### Growth Plan — ₹1999/month (~$24/month)
- Everything in Pro
- AI-powered analytics
- AI delay prediction
- Enterprise features (future)

**Podcast Talking Point:** "The open-core model is genius for developer tools. You give away the full product for free — developers love you, they star your repo, they contribute. But companies who don't want to manage servers will gladly pay ₹699/month for a hosted version. It's a win-win."

---

## 🗺 ROADMAP — What's Next?

### Completed ✅
- Authentication (email + GitHub SSO)
- Multi-tenant organization system
- Project CRUD with GitHub repo connection
- Kanban board with drag & drop
- Sprint planning, burndown charts, workload analytics
- Daily standups and retrospectives
- Activity feed and timeline
- In-app notifications with due-date reminders
- Discord and Slack webhook integration
- Team invitations (send, accept, cancel)
- Time tracking and work hour logging
- Project close/reopen
- GitHub profile integration (avatar, username sync)
- Single-server production bundle
- Responsive dark theme UI

### Planned 🔲
- AI delay prediction (ML model for task completion estimates)
- Pull request tracking (link PRs to tasks automatically)
- Advanced analytics dashboard
- Subscription/billing system (Razorpay/Stripe)
- Email notification delivery
- File attachments on tasks
- Task dependencies (blocked by / blocks)
- Custom fields on tasks
- Recurring tasks
- Mobile responsive improvements
- Public API with API keys
- Bulk task operations
- Export data (CSV, PDF reports)

---

## 🎬 VIDEO DEMO WALKTHROUGH ORDER

Use this order when recording your tutorial video:

1. **Landing Page** — Show the marketing page, feature highlights, pricing
2. **Registration** — Create a new account, explain org creation
3. **GitHub SSO** — Show "Continue with GitHub" login flow
4. **Dashboard** — Overview of active projects, task counts
5. **Create Project** — Fill out project details, connect GitHub repo
6. **Kanban Board** — Create tasks, drag between columns, show priorities
7. **Sprint Planning** — Create a sprint, assign tasks, start the sprint
8. **Daily Standups** — Submit a standup, view team standups
9. **Burndown Chart** — Show the Analytics tab with charts
10. **Time Tracking** — Log work hours, view summary
11. **Sprint Complete** — Complete the sprint, show tasks are locked
12. **Retrospective** — Write a retro for the completed sprint
13. **Activity Feed** — Show the project timeline
14. **Notifications** — Show the bell icon, due-date alerts
15. **Settings** — Connect GitHub profile, show avatar sync
16. **Team Invite** — Send an invite, accept it as another user
17. **Close Project** — Close the project, show summary
18. **Production Build** — Run `npm run build`, start single server
19. **API Docs** — Show Swagger UI at `/docs`

---

## 🎙 PODCAST EPISODE IDEAS

### Episode 1: "Building a Full-Stack SaaS as a Solo Developer"
- Why I built DevFlow
- Choosing the tech stack (React + FastAPI + SQLite)
- How long it took and what I learned
- Open-source strategy

### Episode 2: "GitHub Integration Deep Dive"
- OAuth flow explained
- Webhook architecture
- Profile sync feature
- Challenges with GitHub's API

### Episode 3: "Sprint Management for Dev Teams"
- Why sprints matter
- Building the burndown chart
- Standup and retro features
- Completed sprint protection (the bug story)

### Episode 4: "From Side Project to SaaS"
- Open-core business model
- Pricing strategy for India
- Self-hosting vs. managed hosting
- Getting your first 50 customers

### Episode 5: "Technical Architecture"
- Single-server deployment trick
- Background tasks without Celery
- JWT auth vs. sessions
- SQLite in production — when it works

---

## 📊 KEY NUMBERS

| Metric | Value |
|---|---|
| Total frontend pages | 16 |
| Total React components | 3 shared + 16 pages |
| Backend routers | 13 |
| API endpoints | 50+ |
| Database tables | 12 |
| Lines of code (estimated) | ~8,000+ |
| Dependencies (frontend) | 8 runtime + 11 dev |
| Dependencies (backend) | 10 |
| Build time (frontend) | ~15 seconds |
| Bundle size (gzipped) | ~270 KB JS + 7.5 KB CSS |

---

## 🔗 LINKS

- **GitHub:** https://github.com/santhoshsharuk/open-project-management-system
- **Demo Video:** https://youtu.be/oGESWRfU_80
- **API Docs:** http://localhost:8000/docs (when running locally)

---

*Built by Santhosh · India 🇮🇳*
*Mission: Build simple tools for serious builders.*
