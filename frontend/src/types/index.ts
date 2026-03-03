// Core types for the Project Management Dashboard

export type Role = 'admin' | 'member';
export type PlanType = 'free' | 'pro' | 'growth';
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Organization {
  id: string;
  name: string;
  plan_type: PlanType;
  subscription_status: 'active' | 'inactive' | 'trial';
  created_at: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization_id: string;
  discord_user_id?: string;
  github_username?: string;
  github_avatar_url?: string;
  avatar?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  organization_id: string;
  status: ProjectStatus;
  task_count: number;
  completed_tasks: number;
  members: string[];
  github_repo?: string;
  discord_webhook_url?: string;
  slack_webhook_url?: string;
  closed_at?: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  sprint_id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigned_to?: string;
  github_issue_id?: number;
  github_issue_url?: string;
  github_branch?: string;
  github_pr?: string;
  start_date?: string | null;
  due_date?: string;
  labels?: string;
  comments: TaskComment[];
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface GithubIntegration {
  id: string;
  organization_id: string;
  repo_name: string;
  repo_id: string;
  connected: boolean;
  synced_at?: string;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  team_members: number;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
  created_at: string;
}

export interface Standup {
  id: string;
  sprint_id: string;
  user_id: string;
  date: string;
  yesterday_work: string;
  today_plan: string;
  blockers: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Retrospective {
  id: string;
  sprint_id: string;
  went_well: string;
  needs_improvement: string;
  action_items: string;
  created_at: string;
}

// ─── Activity Log ───────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

// ─── Notification ───────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  project_id?: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// ─── Invitation ─────────────────────────────────────────────────────────────
export interface Invitation {
  id: string;
  email: string;
  organization_id: string;
  invited_by: string;
  inviter_name?: string;
  organization_name?: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

// ─── Time Tracking ──────────────────────────────────────────────────────────
export interface TimeEntry {
  id: string;
  project_id: string;
  task_id?: string;
  user_id: string;
  description: string;
  duration_minutes: number;
  date: string;
  created_at: string;
  user_name?: string;
  task_title?: string;
}

export interface ProjectSummary {
  total_tasks: number;
  completed_tasks: number;
  total_time_minutes: number;
  total_time_hours: number;
  member_hours: { user_id: string; name: string; minutes: number; hours: number }[];
  task_time: { task_id: string; title: string; minutes: number; hours: number }[];
  status: string;
  created_at?: string;
  closed_at?: string;
}
