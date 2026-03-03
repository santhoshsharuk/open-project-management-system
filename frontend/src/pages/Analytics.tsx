import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Target, Users, PieChart as PieChartIcon, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Custom tooltip styling for Recharts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string; }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface-800 border border-surface-600 p-3 rounded-lg shadow-xl shadow-black/50 backdrop-blur-md">
                <p className="font-semibold text-slate-200 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-300">{entry.name}</span>
                        </div>
                        <span className="font-medium text-slate-100">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const { id: projectId } = useParams<{ id: string }>();
    const { projects, getProjectTasks, getProjectSprints } = useProjectStore();
    const { orgUsers } = useAuthStore();

    const [ciData, setCiData] = useState<{ success: number; failed: number } | null>(null);

    const project = projects.find(p => p.id === projectId);
    const tasks = getProjectTasks(projectId || '');
    const sprints = getProjectSprints(projectId || '');
    const activeSprint = sprints.find(s => s.status === 'active');

    // 1. Sprint Burn-down Data (fetched from API)
    const [burnDownData, setBurnDownData] = useState<any[]>([]);
    const [workloadApiData, setWorkloadApiData] = useState<any[]>([]);

    useEffect(() => {
        if (!activeSprint || !projectId) return;
        api.get(`/projects/${projectId}/sprints/${activeSprint.id}/burndown`)
            .then(({ data }) => setBurnDownData(data.days || []))
            .catch(() => {});
    }, [activeSprint, projectId]);

    useEffect(() => {
        if (!projectId) return;
        api.get(`/projects/${projectId}/workload`)
            .then(({ data }) => setWorkloadApiData(data.map((d: any) => ({ name: d.name, tasks: d.open_tasks }))))
            .catch(() => {});
    }, [projectId]);

    // 2. Team Workload - use API data if available, else fallback to local calc
    const workloadFallback = useMemo(() => {
        const openTasks = tasks.filter(t => t.status !== 'done');
        const counts: Record<string, number> = {};
        openTasks.forEach(t => {
            const assignee = t.assigned_to || 'Unassigned';
            counts[assignee] = (counts[assignee] || 0) + 1;
        });

        return Object.entries(counts).map(([userId, count]) => {
            const user = orgUsers.find(u => u.id === userId);
            return {
                name: user ? user.name : 'Unassigned',
                tasks: count
            };
        });
    }, [tasks, orgUsers]);

    const workloadData = workloadApiData.length > 0 ? workloadApiData : workloadFallback;

    // 3. Cumulative Flow (Distribution over time - Simplified to status counts snapshot)
    const cfdData = useMemo(() => {
        return [
            { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length },
            { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length },
            { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
            { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
        ].filter(d => d.value > 0);
    }, [tasks]);

    // 4. Fetch CI/CD Data
    useEffect(() => {
        if (!project?.github_repo) return;
        const token = localStorage.getItem('devflow_github_token');
        if (!token) return;

        let isMounted = true;
        fetch(`https://api.github.com/repos/${project.github_repo}/actions/runs?per_page=10`, {
            headers: { Authorization: `token ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data && data.workflow_runs) {
                    let success = 0;
                    let failed = 0;
                    data.workflow_runs.forEach((run: { conclusion: string }) => {
                        if (run.conclusion === 'success') success++;
                        else if (run.conclusion === 'failure') failed++;
                    });
                    setCiData({ success, failed });
                }
            })
            .catch(() => { });

        return () => { isMounted = false; };
    }, [project?.github_repo]);

    // Safety check - MUST BE AFTER ALL HOOKS
    if (!projectId) return null;

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-6 overflow-y-auto pb-8">
            <div className="flex items-center justify-between bg-surface-800/50 p-6 rounded-2xl border border-surface-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">Analytics & Reporting</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Track sprint progress, team workload, and technical health in real-time.
                    </p>
                </div>
            </div>

            {/* Hidden SVG gradients for Recharts */}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sprint Burn-down */}
                <div className="card p-6 border-surface-700/50 hover:border-brand-500/30 transition-colors shadow-lg shadow-black/20 group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <Target size={16} className="text-brand-400" /> Active Sprint Burn-down
                        </h3>
                        {activeSprint && <span className="badge text-brand-400 bg-brand-400/10 border-brand-400/20">{activeSprint.name}</span>}
                    </div>
                    {activeSprint && burnDownData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={burnDownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                                    <Area type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} fill="url(#colorIdeal)" name="Ideal Trend" strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={3} fill="url(#colorRemaining)" name="Actual Remaining" activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-surface-600 rounded-xl bg-surface-800/30">
                            <Target size={32} className="text-slate-600 mb-3" />
                            <span className="text-slate-400 text-sm font-medium">No active sprint found</span>
                            <span className="text-slate-500 text-xs mt-1">Start a sprint to see the burn-down chart.</span>
                        </div>
                    )}
                </div>

                {/* Team Workload */}
                <div className="card p-6 border-surface-700/50 hover:border-emerald-500/30 transition-colors shadow-lg shadow-black/20 group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <Users size={16} className="text-emerald-400" /> Team Workload
                        </h3>
                        <span className="text-xs text-slate-400">Open Tasks</span>
                    </div>
                    {workloadData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} opacity={0.4} />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={10} />
                                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={90} tickLine={false} axisLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />
                                    <Bar dataKey="tasks" fill="url(#barGradient)" radius={[0, 6, 6, 0]} name="Open Tasks" barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-surface-600 rounded-xl bg-surface-800/30">
                            <Users size={32} className="text-slate-600 mb-3" />
                            <span className="text-slate-400 text-sm font-medium">No open tasks assigned</span>
                            <span className="text-slate-500 text-xs mt-1">Your team has no ongoing workload!</span>
                        </div>
                    )}
                </div>

                {/* Task Distribution (CFD Proxy) */}
                <div className="card p-6 border-surface-700/50 hover:border-purple-500/30 transition-colors shadow-lg shadow-black/20 group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <PieChartIcon size={16} className="text-purple-400" /> Status Distribution
                        </h3>
                        <span className="text-xs text-slate-400">All Project Tasks</span>
                    </div>
                    {cfdData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={cfdData}
                                        cx="50%" cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                                    >
                                        {cfdData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-md" stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-surface-600 rounded-xl bg-surface-800/30">
                            <PieChartIcon size={32} className="text-slate-600 mb-3" />
                            <span className="text-slate-400 text-sm font-medium">No tasks in project</span>
                            <span className="text-slate-500 text-xs mt-1">Create some tasks to see distribution.</span>
                        </div>
                    )}
                </div>

                {/* Technical Health */}
                <div className="card p-6 border-surface-700/50 hover:border-blue-500/30 transition-colors shadow-lg shadow-black/20 group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" /> Technical Health
                        </h3>
                        {project?.github_repo ? (
                            <span className="text-xs text-slate-400 truncate max-w-[150px]">{project.github_repo.split('/')[1] || project.github_repo}</span>
                        ) : (
                            <span className="text-xs text-slate-400">CI/CD Run History</span>
                        )}
                    </div>
                    {!project?.github_repo ? (
                        <div className="h-[280px] flex flex-col items-center justify-center border-2 border-dashed border-surface-600 rounded-xl bg-surface-800/30">
                            <Activity size={32} className="text-slate-600 mb-3" />
                            <span className="text-slate-400 text-sm font-medium">No GitHub repository linked</span>
                            <span className="text-slate-500 text-xs mt-1">Connect a repo to see CI/CD success rates.</span>
                        </div>
                    ) : ciData ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Success', value: ciData.success },
                                            { name: 'Failed', value: ciData.failed }
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" stroke="rgba(0,0,0,0.1)" strokeWidth={2} /> {/* Success */}
                                        <Cell fill="#ef4444" stroke="rgba(0,0,0,0.1)" strokeWidth={2} /> {/* Failed */}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />

                                    {/* Center Text overlay */}
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-100 font-bold text-2xl">
                                        {ciData.success + ciData.failed > 0
                                            ? `${Math.round((ciData.success / (ciData.success + ciData.failed)) * 100)}%`
                                            : '0%'}
                                    </text>
                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-xs">
                                        Passing
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center border border-surface-700 rounded-xl bg-surface-800/20">
                            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3"></div>
                            <span className="text-brand-400 text-sm font-medium animate-pulse">Fetching Action Runs...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
