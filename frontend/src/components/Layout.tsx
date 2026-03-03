import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FolderKanban, Github, Settings, LogOut,
    ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import NotificationCenter from './NotificationCenter';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/github', icon: Github, label: 'GitHub' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
    const { user, org, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-surface-900">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-surface-800 border-r border-surface-600 flex flex-col transition-all duration-200 relative`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-600">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-glow">
                        <FolderKanban size={16} className="text-white" />
                    </div>
                    {sidebarOpen && (
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">DevFlow</div>
                            <div className="text-xs text-slate-400 truncate">{org?.name ?? 'My Org'}</div>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {sidebarOpen && (
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main</p>
                    )}
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                isActive ? 'sidebar-item-active' : 'sidebar-item'
                            }
                            title={!sidebarOpen ? label : undefined}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="border-t border-surface-600 p-3">
                    <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
                        {user?.github_avatar_url ? (
                            <img src={user.github_avatar_url} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                            </div>
                        )}
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
                                <div className="text-xs text-slate-400 truncate">{user?.role}</div>
                            </div>
                        )}
                        {sidebarOpen && (
                            <button onClick={handleLogout} className="btn-ghost p-1.5" title="Logout">
                                <LogOut size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Toggle button */}
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-surface-600 border border-surface-400 flex items-center justify-center hover:bg-brand-600 transition-colors z-10"
                >
                    <ChevronDown size={12} className={`text-slate-300 transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
                </button>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top bar with notifications */}
                <div className="flex items-center justify-end px-6 py-3 border-b border-surface-700/50 bg-surface-800/30">
                    <NotificationCenter />
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
