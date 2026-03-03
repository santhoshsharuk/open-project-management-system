import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectLayout from './pages/ProjectLayout';
import ProjectBoard from './pages/ProjectBoard';
import SprintPlanning from './pages/SprintPlanning';
import Standups from './pages/Standups';
import Retrospectives from './pages/Retrospectives';
import Analytics from './pages/Analytics';
import ActivityFeed from './pages/ActivityFeed';
import TimeTracking from './pages/TimeTracking';
import GithubIntegration from './pages/GithubIntegration';
import SettingsPage from './pages/Settings';
import Pricing from './pages/Pricing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    // Wait for Zustand to load auth state from localStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);

  // Don't render routing until we know if the user is logged in
  if (!hydrated) {
    return <div className="h-screen flex items-center justify-center bg-brand-950/20 text-brand-500">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected (inside Layout) */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />

          <Route path="/projects/:id" element={<ProjectLayout />}>
            <Route index element={<ProjectBoard />} />
            <Route path="planning" element={<SprintPlanning />} />
            <Route path="standups" element={<Standups />} />
            <Route path="retrospectives" element={<Retrospectives />} />
            <Route path="activity" element={<ActivityFeed />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="time" element={<TimeTracking />} />
          </Route>

          <Route path="/github" element={<GithubIntegration />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
