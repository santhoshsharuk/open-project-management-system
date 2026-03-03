import { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Loader2, KanbanSquare, ListTodo, Users, History, ArrowLeft, BarChart3, Settings, Save, X, Activity, Timer } from 'lucide-react';
import type { Project } from '../types';

const TABS = [
    { id: '', label: 'Active Sprint', icon: KanbanSquare },
    { id: 'planning', label: 'Backlog & Sprints', icon: ListTodo },
    { id: 'standups', label: 'Standups', icon: Users },
    { id: 'retrospectives', label: 'Retrospectives', icon: History },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'time', label: 'Work Time', icon: Timer },
];

function ProjectSettingsModal({ project, onClose }: { project: Project, onClose: () => void }) {
    const { updateProject } = useProjectStore();
    const [discordUrl, setDiscordUrl] = useState(project.discord_webhook_url || '');
    const [slackUrl, setSlackUrl] = useState(project.slack_webhook_url || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await updateProject(project.id, {
            discord_webhook_url: discordUrl,
            slack_webhook_url: slackUrl
        });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-lg animate-slide-up p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-slate-100 text-lg">Project Settings</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="label">Discord Webhook URL</label>
                        <input type="url" className="input" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." />
                        <p className="text-[10px] text-slate-500 mt-1">Receive automated updates when tasks are marked Done.</p>
                    </div>
                    <div>
                        <label className="label">Slack Webhook URL</label>
                        <input type="url" className="input" value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
                        <p className="text-[10px] text-slate-500 mt-1">Receive automated updates when tasks are marked Done.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProjectLayout() {
    const { id: projectId } = useParams<{ id: string }>();
    const { pathname } = useLocation();
    const {
        projects, loading,
        fetchProjects, fetchTasks, fetchSprints
    } = useProjectStore();

    const [settingsOpen, setSettingsOpen] = useState(false);

    const project = projects.find((p) => p.id === projectId);

    // E.g. /projects/123/planning => "planning"
    // E.g. /projects/123 => ""
    const currentTab = pathname.split('/').pop() === projectId ? '' : pathname.split('/').pop() || '';

    useEffect(() => {
        if (projects.length === 0) fetchProjects();
        if (projectId) {
            fetchTasks(projectId);
            fetchSprints(projectId);
        }
    }, [projectId, fetchTasks, fetchProjects, fetchSprints, projects.length]);

    if (loading && !project) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 size={28} className="animate-spin text-brand-400" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                Project not found. <Link to="/projects" className="ml-2 text-brand-400">Back to Projects</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Project Header */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/projects" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
                        <div className="flex-1">
                            <h1 className="section-title">{project.name}</h1>
                            <p className="section-subtitle mt-0.5">{project.description}</p>
                        </div>
                    </div>

                    <button onClick={() => setSettingsOpen(true)} className="btn-secondary text-xs px-3 py-1.5">
                        <Settings size={14} /> Project Settings
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-surface-600 px-2 pb-0">
                    {TABS.map((tab) => {
                        const isActive = currentTab === tab.id;
                        const to = tab.id ? `/projects/${projectId}/${tab.id}` : `/projects/${projectId}`;
                        return (
                            <Link
                                key={tab.id}
                                to={to}
                                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${isActive
                                    ? 'border-brand-500 text-brand-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-surface-400'
                                    }`}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <Outlet context={{ project }} />
            </div>
            {settingsOpen && <ProjectSettingsModal project={project} onClose={() => setSettingsOpen(false)} />}
        </div>
    );
}
