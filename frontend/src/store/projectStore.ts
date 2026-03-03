import { create } from 'zustand';
import type { Project, Task, Sprint, Standup, Retrospective, ActivityLog, AppNotification, Invitation, TimeEntry, ProjectSummary } from '../types';
import api from '../lib/api';

interface ProjectState {
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  standups: Standup[];
  retrospectives: Retrospective[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  unreadCount: number;
  invitations: Invitation[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  addProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  getProjectTasks: (projectId: string) => Task[];
  
  // Agile
  getProjectSprints: (projectId: string) => Sprint[];
  getSprintStandups: (sprintId: string) => Standup[];
  getSprintRetrospectives: (sprintId: string) => Retrospective[];

  fetchSprints: (projectId: string) => Promise<void>;
  addSprint: (projectId: string, data: Partial<Sprint>) => Promise<void>;
  updateSprint: (projectId: string, sprintId: string, data: Partial<Sprint>) => Promise<void>;
  deleteSprint: (projectId: string, sprintId: string) => Promise<void>;

  fetchStandups: (projectId: string, sprintId: string) => Promise<void>;
  addStandup: (projectId: string, sprintId: string, data: Partial<Standup>) => Promise<void>;

  fetchRetrospectives: (projectId: string, sprintId: string) => Promise<void>;
  addRetrospective: (projectId: string, sprintId: string, data: Partial<Retrospective>) => Promise<void>;

  // Activity Feed
  fetchActivityLogs: (projectId: string) => Promise<void>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Invitations
  fetchInvitations: () => Promise<void>;
  sendInvitation: (email: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;

  // Pending invitations (for the current user)
  pendingInvites: Invitation[];
  fetchPendingInvites: () => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;

  // Time Tracking
  timeEntries: TimeEntry[];
  fetchTimeEntries: (projectId: string) => Promise<void>;
  addTimeEntry: (projectId: string, data: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (projectId: string, entryId: string) => Promise<void>;
  fetchProjectSummary: (projectId: string) => Promise<ProjectSummary>;
  closeProject: (projectId: string) => Promise<void>;
  reopenProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  tasks: [],
  sprints: [],
  standups: [],
  retrospectives: [],
  activityLogs: [],
  notifications: [],
  unreadCount: 0,
  invitations: [],
  pendingInvites: [],
  loading: false,
  timeEntries: [],

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/projects/');
      set({ projects: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchTasks: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/tasks/`);
    set((state) => ({
      tasks: [
        ...state.tasks.filter((t) => t.project_id !== projectId),
        ...data,
      ],
    }));
  },

  addProject: async (data) => {
    const { data: created } = await api.post('/projects/', data);
    set((state) => ({ projects: [created, ...state.projects] }));
  },

  updateProject: async (id, data) => {
    const { data: updated } = await api.patch(`/projects/${id}`, data);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.project_id !== id),
    }));
  },

  addTask: async (data) => {
    const { data: created } = await api.post(`/projects/${data.project_id}/tasks/`, data);
    set((state) => ({ tasks: [created, ...state.tasks] }));
  },

  updateTask: async (id, data) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const { data: updated } = await api.patch(`/projects/${task.project_id}/tasks/${id}`, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (projectId, taskId) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
  },

  getProjectTasks: (projectId) =>
    get().tasks.filter((t) => t.project_id === projectId),

  // -- Agile Getters --
  getProjectSprints: (projectId) => get().sprints.filter(s => s.project_id === projectId),
  getSprintStandups: (sprintId) => get().standups.filter(s => s.sprint_id === sprintId),
  getSprintRetrospectives: (sprintId) => get().retrospectives.filter(r => r.sprint_id === sprintId),

  // -- Sprints --
  fetchSprints: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/sprints/`);
    set((state) => ({ sprints: [...state.sprints.filter((s) => s.project_id !== projectId), ...data] }));
  },
  addSprint: async (projectId, data) => {
    const { data: created } = await api.post(`/projects/${projectId}/sprints/`, data);
    set((state) => ({ sprints: [created, ...state.sprints] }));
  },
  updateSprint: async (projectId, sprintId, data) => {
    const { data: updated } = await api.patch(`/projects/${projectId}/sprints/${sprintId}`, data);
    set((state) => ({ sprints: state.sprints.map((s) => (s.id === sprintId ? updated : s)) }));
  },
  deleteSprint: async (projectId, sprintId) => {
    await api.delete(`/projects/${projectId}/sprints/${sprintId}`);
    set((state) => ({ sprints: state.sprints.filter((s) => s.id !== sprintId) }));
  },

  // -- Standups --
  fetchStandups: async (projectId, sprintId) => {
    const { data } = await api.get(`/projects/${projectId}/sprints/${sprintId}/standups/`);
    set((state) => ({ standups: [...state.standups.filter((s) => s.sprint_id !== sprintId), ...data] }));
  },
  addStandup: async (projectId, sprintId, data) => {
    const { data: created } = await api.post(`/projects/${projectId}/sprints/${sprintId}/standups/`, data);
    set((state) => ({ standups: [created, ...state.standups] }));
  },

  // -- Retrospectives --
  fetchRetrospectives: async (projectId, sprintId) => {
    const { data } = await api.get(`/projects/${projectId}/sprints/${sprintId}/retrospectives/`);
    set((state) => ({ retrospectives: [...state.retrospectives.filter((r) => r.sprint_id !== sprintId), ...data] }));
  },
  addRetrospective: async (projectId, sprintId, data) => {
    const { data: created } = await api.post(`/projects/${projectId}/sprints/${sprintId}/retrospectives/`, data);
    set((state) => ({ retrospectives: [created, ...state.retrospectives] }));
  },

  // ─── Activity Feed ───────────────────────────────────────────────────────
  fetchActivityLogs: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/activity/`);
    set({ activityLogs: data });
  },

  // ─── Notifications ───────────────────────────────────────────────────────
  fetchNotifications: async () => {
    const { data } = await api.get('/notifications/');
    set({ notifications: data });
  },
  fetchUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count');
    set({ unreadCount: data.count });
  },
  markNotificationRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  markAllNotificationsRead: async () => {
    await api.patch('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  // ─── Invitations ─────────────────────────────────────────────────────────
  fetchInvitations: async () => {
    const { data } = await api.get('/invitations/');
    set({ invitations: data });
  },
  sendInvitation: async (email) => {
    const { data: created } = await api.post('/invitations/', { email });
    set((state) => ({ invitations: [created, ...state.invitations] }));
  },
  cancelInvitation: async (id) => {
    await api.delete(`/invitations/${id}`);
    set((state) => ({ invitations: state.invitations.filter((i) => i.id !== id) }));
  },

  // ─── Pending Invitations (current user) ────────────────────────────────
  fetchPendingInvites: async () => {
    try {
      const { data } = await api.get('/invitations/pending');
      set({ pendingInvites: data });
    } catch {
      set({ pendingInvites: [] });
    }
  },
  acceptInvitation: async (id) => {
    await api.patch(`/invitations/${id}/accept`);
    set((state) => ({ pendingInvites: state.pendingInvites.filter((i) => i.id !== id) }));
    // Reload auth to reflect new org
    window.location.reload();
  },

  // ─── Time Tracking ──────────────────────────────────────────────────────
  fetchTimeEntries: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/time-entries/`);
    set({ timeEntries: data });
  },
  addTimeEntry: async (projectId, data) => {
    const { data: created } = await api.post(`/projects/${projectId}/time-entries/`, data);
    set((state) => ({ timeEntries: [created, ...state.timeEntries] }));
  },
  deleteTimeEntry: async (projectId, entryId) => {
    await api.delete(`/projects/${projectId}/time-entries/${entryId}`);
    set((state) => ({ timeEntries: state.timeEntries.filter((e) => e.id !== entryId) }));
  },
  fetchProjectSummary: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/summary`);
    return data;
  },
  closeProject: async (projectId) => {
    await api.post(`/projects/${projectId}/close`);
    set((state) => ({
      projects: state.projects.map((p) => p.id === projectId ? { ...p, status: 'completed' as const, closed_at: new Date().toISOString() } : p),
    }));
  },
  reopenProject: async (projectId) => {
    await api.post(`/projects/${projectId}/reopen`);
    set((state) => ({
      projects: state.projects.map((p) => p.id === projectId ? { ...p, status: 'active' as const, closed_at: undefined } : p),
    }));
  },
}));
