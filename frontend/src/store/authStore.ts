import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '../types';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  org: Organization | null;
  orgUsers: User[];
  isAuthenticated: boolean;
  fetchOrgUsers: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, orgName: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      org: null,
      orgUsers: [],
      isAuthenticated: false,

      fetchOrgUsers: async () => {
        try {
          const { data } = await api.get('/auth/users');
          set({ orgUsers: data });
        } catch (error) {
          console.error('Failed to fetch org users', error);
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('pm-auth-token', data.access_token);
          const { data: me } = await api.get('/auth/me');
          const { data: org } = await api.get(`/orgs/${me.organization_id}`);
          set({ user: me, org, isAuthenticated: true });
          get().fetchOrgUsers();
          return true;
        } catch {
          return false;
        }
      },

      loginWithToken: async (token: string) => {
        try {
          localStorage.setItem('pm-auth-token', token);
          const { data: me } = await api.get('/auth/me');
          const { data: org } = await api.get(`/orgs/${me.organization_id}`);
          set({ user: me, org, isAuthenticated: true });
          get().fetchOrgUsers();
          return true;
        } catch {
          localStorage.removeItem('pm-auth-token');
          return false;
        }
      },

      register: async (name: string, email: string, password: string, orgName: string) => {
        try {
          const { data } = await api.post('/auth/register', {
            name, email, password, org_name: orgName,
          });
          localStorage.setItem('pm-auth-token', data.access_token);
          const { data: me } = await api.get('/auth/me');
          const { data: org } = await api.get(`/orgs/${me.organization_id}`);
          set({ user: me, org, isAuthenticated: true });
          get().fetchOrgUsers();
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('pm-auth-token');
        set({ user: null, org: null, orgUsers: [], isAuthenticated: false });
      },
    }),
    {
      name: 'pm-auth',
      // Don't persist the token in zustand state — it's in localStorage directly
      partialize: (state) => ({ user: state.user, org: state.org, isAuthenticated: state.isAuthenticated }),
    }
  )
);
