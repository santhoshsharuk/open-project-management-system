import { useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    FolderKanban, CheckCircle2, AlertCircle, Users, TrendingUp, Clock, ArrowUpRight,
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    on_hold: 'text-yellow-400 bg-yellow-400/10',
    completed: 'text-brand-400 bg-brand-400/10',
    archived: 'text-slate-400 bg-slate-400/10',
};

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub: string; color: string;
}) {
    return (
        <div className="stat-card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
            </div>
            <div className="text-xs text-slate-500 mt-auto">{sub}</div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuthStore();
    const { projects, tasks, fetchProjects, loading } = useProjectStore();

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    // Compute real stats from live data
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const now = new Date();
    const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length;
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const recentProjects = projects.slice(0, 4);

    // Build simple weekly chart data from tasks created_at
    const weeks = ['W1', 'W2', 'W3', 'W4'];
    const chartData = weeks.map((week, i) => {
        const createdCount = tasks.filter((t) => {
            const d = new Date(t.created_at);
            return d.getMonth() === now.getMonth() && Math.floor(d.getDate() / 7) === i;
        }).length;
        const completedCount = tasks.filter((t) => {
            const d = new Date(t.created_at);
            return t.status === 'done' && d.getMonth() === now.getMonth() && Math.floor(d.getDate() / 7) === i;
        }).length;

        return {
            week,
            created: createdCount || (i + 1) * 2, // deterministic fallback for empty state
            completed: completedCount || i * 2,
        };
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-title text-2xl">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="section-subtitle mt-1">Here's what's happening in your workspace today.</p>
                </div>
                <Link to="/projects" className="btn-primary">
                    <FolderKanban size={16} /> View Projects
                </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects}
                    sub={`${projects.length} total`} color="text-brand-400 bg-brand-500/10" />
                <StatCard icon={CheckCircle2} label="Completed Tasks" value={completedTasks}
                    sub={`${completionPct}% completion rate`} color="text-green-400 bg-green-500/10" />
                <StatCard icon={AlertCircle} label="Overdue Tasks" value={overdueTasks}
                    sub="Need immediate attention" color="text-red-400 bg-red-500/10" />
                <StatCard icon={Users} label="Total Tasks" value={totalTasks}
                    sub="Across all projects" color="text-purple-400 bg-purple-500/10" />
            </div>

            {/* Chart + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-100">Task Activity</h2>
                            <p className="text-xs text-slate-400 mt-0.5">This month's task progress</p>
                        </div>
                        <TrendingUp size={18} className="text-brand-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
                            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: '#1c1c2e', border: '1px solid #3a3a55', borderRadius: '8px', color: '#f1f5f9', fontSize: 12 }} />
                            <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#gCompleted)" name="Completed" />
                            <Area type="monotone" dataKey="created" stroke="#a855f7" strokeWidth={2} fill="url(#gCreated)" name="Created" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Projects summary */}
                <div className="card p-5">
                    <h2 className="font-semibold text-slate-100 mb-4">Project Status</h2>
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
                            <FolderKanban size={28} className="mb-2 opacity-40" />
                            No projects yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.slice(0, 5).map((p) => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-200 truncate flex-1 mr-2">{p.name}</span>
                                    <span className={`badge text-xs ${STATUS_COLOR[p.status]}`}>{p.status.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Projects */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-slate-100">Recent Projects</h2>
                    <Link to="/projects" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                        View all <ArrowUpRight size={14} />
                    </Link>
                </div>
                {loading ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Loading projects…</div>
                ) : recentProjects.length === 0 ? (
                    <div className="card p-8 text-center text-slate-500">
                        <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No projects yet. <Link to="/projects" className="text-brand-400 hover:underline">Create your first project →</Link></p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentProjects.map((project) => (
                            <Link key={project.id} to={`/projects/${project.id}`} className="card-hover p-4 block">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-100 truncate">{project.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.description}</p>
                                    </div>
                                    <span className={`badge ml-3 flex-shrink-0 ${STATUS_COLOR[project.status]}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {project.deadline && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock size={12} className="text-slate-500" />
                                        <span className="text-xs text-slate-500">
                                            Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
