import type { Project, Task, User, Organization, DashboardStats, TaskComment } from '../types';

// ─── Auth Mock ────────────────────────────────────────────────────────────────
export const MOCK_ORG: Organization = {
  id: 'org-1',
  name: 'DevStudio Inc.',
  plan_type: 'pro',
  subscription_status: 'active',
  created_at: '2024-01-10T00:00:00Z',
};

export const MOCK_USERS: User[] = [
  { id: 'u-1', name: 'Santhosh Kumar', email: 'santhosh@devstudio.io', role: 'admin', organization_id: 'org-1', avatar: 'SK', created_at: '2024-01-10T00:00:00Z' },
  { id: 'u-2', name: 'Priya Rajan', email: 'priya@devstudio.io', role: 'member', organization_id: 'org-1', avatar: 'PR', created_at: '2024-01-15T00:00:00Z' },
  { id: 'u-3', name: 'Arjun Mehta', email: 'arjun@devstudio.io', role: 'member', organization_id: 'org-1', avatar: 'AM', created_at: '2024-01-20T00:00:00Z' },
  { id: 'u-4', name: 'Neha Das', email: 'neha@devstudio.io', role: 'member', organization_id: 'org-1', avatar: 'ND', created_at: '2024-02-01T00:00:00Z' },
];

// ─── Projects Mock ────────────────────────────────────────────────────────────
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1', name: 'SheetKadai - E-Commerce Platform', description: 'Full-stack SaaS e-commerce platform with Google Sheets as a backend for small businesses.',
    deadline: '2026-04-15', organization_id: 'org-1', status: 'active',
    task_count: 18, completed_tasks: 11, members: ['u-1', 'u-2', 'u-3'],
    github_repo: 'santhosh/sheetkadai', created_at: '2024-11-01T00:00:00Z',
  },
  {
    id: 'proj-2', name: 'PM Dashboard (This App)', description: 'Open-source project management dashboard with GitHub integration and SaaS monetization.',
    deadline: '2026-05-30', organization_id: 'org-1', status: 'active',
    task_count: 24, completed_tasks: 6, members: ['u-1', 'u-4'],
    github_repo: 'santhosh/pm-dashboard', created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'proj-3', name: 'Internship Matching Engine', description: 'AI-powered matching system for PM internship candidates using Gemini Flash.',
    deadline: '2026-03-20', organization_id: 'org-1', status: 'completed',
    task_count: 12, completed_tasks: 12, members: ['u-1', 'u-2'],
    created_at: '2024-12-10T00:00:00Z',
  },
  {
    id: 'proj-4', name: 'Mobile App - React Native', description: 'Companion mobile app for SheetKadai store owners to manage orders on the go.',
    deadline: '2026-07-01', organization_id: 'org-1', status: 'on_hold',
    task_count: 9, completed_tasks: 2, members: ['u-3', 'u-4'],
    created_at: '2025-02-01T00:00:00Z',
  },
];

// ─── Tasks Mock ───────────────────────────────────────────────────────────────
const baseComments: TaskComment[] = [
  { id: 'cm-1', task_id: 'task-1', user_id: 'u-2', user_name: 'Priya Rajan', user_avatar: 'PR', content: 'Reviewed the design — looks great! Let me know when it\'s ready for code review.', created_at: '2026-02-20T09:30:00Z' },
  { id: 'cm-2', task_id: 'task-1', user_id: 'u-1', user_name: 'Santhosh Kumar', user_avatar: 'SK', content: 'Will push the PR by EOD today.', created_at: '2026-02-20T11:00:00Z' },
];

export const MOCK_TASKS: Task[] = [
  { id: 'task-1', project_id: 'proj-1', title: 'Implement GitHub OAuth login', description: 'Add GitHub OAuth 2.0 login flow so users can authenticate using their GitHub accounts.', status: 'in_progress', priority: 'high', assigned_to: 'u-1', due_date: '2026-03-05', labels: "auth,backend", comments: baseComments, created_at: '2026-02-15T00:00:00Z' },
  { id: 'task-2', project_id: 'proj-1', title: 'Kanban board drag & drop', description: 'Implement drag-and-drop between kanban columns using @hello-pangea/dnd.', status: 'done', priority: 'high', assigned_to: 'u-2', due_date: '2026-02-25', labels: "frontend,ui", comments: [], created_at: '2026-02-10T00:00:00Z' },
  { id: 'task-3', project_id: 'proj-1', title: 'Design landing page', description: 'Create a compelling landing page with hero, features, pricing sections.', status: 'done', priority: 'medium', assigned_to: 'u-3', due_date: '2026-02-20', labels: "design,frontend", comments: [], created_at: '2026-02-08T00:00:00Z' },
  { id: 'task-4', project_id: 'proj-1', title: 'Setup PostgreSQL schema', description: 'Define all database tables and run migrations using Alembic.', status: 'todo', priority: 'high', assigned_to: 'u-1', due_date: '2026-03-10', labels: "backend,db", comments: [], created_at: '2026-02-18T00:00:00Z' },
  { id: 'task-5', project_id: 'proj-1', title: 'Write API documentation', description: 'Use FastAPI auto-docs + add descriptions to all endpoints.', status: 'todo', priority: 'low', assigned_to: 'u-4', due_date: '2026-03-15', labels: "docs", comments: [], created_at: '2026-02-19T00:00:00Z' },
  { id: 'task-6', project_id: 'proj-1', title: 'Implement webhook handler', description: 'Process GitHub webhook events to auto-close tasks when issues are merged/closed.', status: 'todo', priority: 'urgent', assigned_to: 'u-2', due_date: '2026-03-08', labels: "backend,github", comments: [], created_at: '2026-02-20T00:00:00Z' },
  { id: 'task-7', project_id: 'proj-2', title: 'Build dashboard stats API', description: 'Returns aggregated stats: active projects, tasks, overdue count.', status: 'in_progress', priority: 'medium', assigned_to: 'u-1', due_date: '2026-03-12', labels: "backend,api", comments: [], created_at: '2026-02-22T00:00:00Z' },
  { id: 'task-8', project_id: 'proj-2', title: 'Recharts activity chart', description: 'Display weekly task completion trend using Recharts AreaChart.', status: 'todo', priority: 'medium', assigned_to: 'u-4', due_date: '2026-03-20', labels: "frontend,analytics", comments: [], created_at: '2026-02-23T00:00:00Z' },
  { id: 'task-9', project_id: 'proj-2', title: 'Multi-tenant org system', description: 'Implement organization scoping for all API queries.', status: 'done', priority: 'urgent', assigned_to: 'u-1', due_date: '2026-02-28', labels: "backend,auth", comments: [], created_at: '2026-02-14T00:00:00Z' },
];

// ─── Dashboard Stats Mock ─────────────────────────────────────────────────────
export const MOCK_STATS: DashboardStats = {
  total_projects: 4,
  active_projects: 2,
  total_tasks: 63,
  completed_tasks: 31,
  overdue_tasks: 3,
  team_members: 4,
};

export const MOCK_CHART_DATA = [
  { week: 'Jan W1', completed: 4, created: 8 },
  { week: 'Jan W2', completed: 7, created: 5 },
  { week: 'Jan W3', completed: 5, created: 9 },
  { week: 'Jan W4', completed: 10, created: 6 },
  { week: 'Feb W1', completed: 8, created: 11 },
  { week: 'Feb W2', completed: 12, created: 7 },
  { week: 'Feb W3', completed: 9, created: 10 },
  { week: 'Feb W4', completed: 14, created: 8 },
];
