import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { Clock, Plus, Trash2, Timer, Users, CheckCircle2, XCircle, RotateCcw, BarChart3, CalendarDays, ListTodo } from 'lucide-react';
import type { ProjectSummary, Task } from '../types';

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export default function TimeTracking() {
    const { id: projectId } = useParams<{ id: string }>();
    const { projects, getProjectTasks, timeEntries, fetchTimeEntries, addTimeEntry, deleteTimeEntry, closeProject, reopenProject } = useProjectStore();
    const { user } = useAuthStore();

    const [showLogForm, setShowLogForm] = useState(false);
    const [summary, setSummary] = useState<ProjectSummary | null>(null);
    const [closeConfirm, setCloseConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [taskId, setTaskId] = useState('');
    const [description, setDescription] = useState('');
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(30);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const project = projects.find(p => p.id === projectId);
    const tasks = getProjectTasks(projectId || '');
    const isClosed = project?.status === 'completed' || project?.status === 'archived';

    const loadSummary = async () => {
        if (!projectId) return;
        try {
            const { fetchProjectSummary } = useProjectStore.getState();
            const data = await fetchProjectSummary(projectId);
            setSummary(data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        if (!projectId) return;
        fetchTimeEntries(projectId);
        loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, fetchTimeEntries]);

    const totalLogged = useMemo(() => {
        return timeEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
    }, [timeEntries]);

    const handleLogTime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;
        const totalMinutes = hours * 60 + minutes;
        if (totalMinutes <= 0) return;

        await addTimeEntry(projectId, {
            task_id: taskId || undefined,
            description,
            duration_minutes: totalMinutes,
            date: new Date(date).toISOString(),
        });
        setShowLogForm(false);
        setTaskId('');
        setDescription('');
        setHours(0);
        setMinutes(30);
        loadSummary();
    };

    const handleClose = async () => {
        if (!projectId) return;
        setActionLoading(true);
        try {
            await closeProject(projectId);
            await loadSummary();
        } catch { /* ignore */ }
        setActionLoading(false);
        setCloseConfirm(false);
    };

    const handleReopen = async () => {
        if (!projectId) return;
        setActionLoading(true);
        try {
            await reopenProject(projectId);
            await loadSummary();
        } catch { /* ignore */ }
        setActionLoading(false);
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!projectId) return;
        await deleteTimeEntry(projectId, entryId);
        loadSummary();
    };

    if (!projectId) return null;

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-6 overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex items-center justify-between bg-surface-800/50 p-6 rounded-2xl border border-surface-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Timer className="text-brand-400" size={28} /> Work Time & Project Summary
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Log work hours, view total project time, and close the project when done.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isClosed && (
                        <button onClick={() => setShowLogForm(true)} className="btn-primary text-sm">
                            <Plus size={16} /> Log Time
                        </button>
                    )}
                    {!isClosed && user?.role === 'admin' && (
                        <button onClick={() => setCloseConfirm(true)} className="btn-secondary text-sm text-red-400 border-red-500/30 hover:bg-red-500/10">
                            <XCircle size={16} /> Close Project
                        </button>
                    )}
                    {isClosed && user?.role === 'admin' && (
                        <button onClick={handleReopen} disabled={actionLoading} className="btn-secondary text-sm text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                            <RotateCcw size={16} /> Reopen Project
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner for Closed Project */}
            {isClosed && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <div>
                        <span className="text-emerald-300 font-semibold">Project Closed</span>
                        {project?.closed_at && (
                            <span className="text-emerald-400/70 text-sm ml-2">
                                on {new Date(project.closed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5 border-surface-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                            <Clock size={20} className="text-brand-400" />
                        </div>
                        <span className="text-sm text-slate-400">Total Time</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{formatDuration(totalLogged)}</div>
                    <div className="text-xs text-slate-500 mt-1">{(totalLogged / 60).toFixed(1)} hours logged</div>
                </div>
                <div className="card p-5 border-surface-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                            <ListTodo size={20} className="text-emerald-400" />
                        </div>
                        <span className="text-sm text-slate-400">Tasks</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                        {summary?.completed_tasks ?? 0}<span className="text-slate-500">/{summary?.total_tasks ?? 0}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">tasks completed</div>
                </div>
                <div className="card p-5 border-surface-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <Users size={20} className="text-purple-400" />
                        </div>
                        <span className="text-sm text-slate-400">Contributors</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{summary?.member_hours?.length ?? 0}</div>
                    <div className="text-xs text-slate-500 mt-1">team members logged time</div>
                </div>
                <div className="card p-5 border-surface-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <CalendarDays size={20} className="text-amber-400" />
                        </div>
                        <span className="text-sm text-slate-400">Time Entries</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">{timeEntries.length}</div>
                    <div className="text-xs text-slate-500 mt-1">work sessions logged</div>
                </div>
            </div>

            {/* Member & Task Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Member Hours */}
                <div className="card p-6 border-surface-700/50">
                    <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
                        <Users size={16} className="text-purple-400" /> Hours by Member
                    </h3>
                    {summary?.member_hours && summary.member_hours.length > 0 ? (
                        <div className="space-y-3">
                            {summary.member_hours.map((m) => {
                                const pct = summary.total_time_minutes > 0 ? (m.minutes / summary.total_time_minutes) * 100 : 0;
                                return (
                                    <div key={m.user_id}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-slate-300">{m.name}</span>
                                            <span className="text-slate-400">{formatDuration(m.minutes)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-500 py-8 border border-dashed border-surface-600 rounded-lg">
                            No time logged yet
                        </div>
                    )}
                </div>

                {/* Task Time */}
                <div className="card p-6 border-surface-700/50">
                    <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
                        <BarChart3 size={16} className="text-emerald-400" /> Hours by Task
                    </h3>
                    {summary?.task_time && summary.task_time.length > 0 ? (
                        <div className="space-y-3">
                            {summary.task_time.map((t) => {
                                const pct = summary.total_time_minutes > 0 ? (t.minutes / summary.total_time_minutes) * 100 : 0;
                                return (
                                    <div key={t.task_id}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-slate-300 truncate max-w-[200px]">{t.title}</span>
                                            <span className="text-slate-400">{formatDuration(t.minutes)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-500 py-8 border border-dashed border-surface-600 rounded-lg">
                            No task-specific time logged yet
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Time Entries */}
            <div className="card p-6 border-surface-700/50">
                <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-brand-400" /> Recent Time Entries
                </h3>
                {timeEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-surface-600">
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Member</th>
                                    <th className="pb-3 font-medium">Task</th>
                                    <th className="pb-3 font-medium">Description</th>
                                    <th className="pb-3 font-medium text-right">Duration</th>
                                    <th className="pb-3 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-700">
                                {timeEntries.map((entry) => (
                                    <tr key={entry.id} className="group hover:bg-surface-700/30 transition-colors">
                                        <td className="py-3 text-slate-300">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 text-slate-300">{entry.user_name || 'Unknown'}</td>
                                        <td className="py-3">
                                            {entry.task_title ? (
                                                <span className="badge text-xs bg-brand-500/10 text-brand-400">{entry.task_title}</span>
                                            ) : (
                                                <span className="text-slate-500">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-slate-400 truncate max-w-[200px]">{entry.description || '—'}</td>
                                        <td className="py-3 text-right font-medium text-slate-200">{formatDuration(entry.duration_minutes)}</td>
                                        <td className="py-3 text-right">
                                            {(entry.user_id === user?.id || user?.role === 'admin') && !isClosed && (
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1 text-red-400 hover:bg-red-400/10"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-sm text-slate-500 py-8 border border-dashed border-surface-600 rounded-lg">
                        No time entries yet. Click "Log Time" to start tracking work.
                    </div>
                )}
            </div>

            {/* Log Time Modal */}
            {showLogForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="card w-full max-w-md animate-slide-up p-6">
                        <h2 className="font-semibold text-lg text-slate-100 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-brand-400" /> Log Work Time
                        </h2>
                        <form onSubmit={handleLogTime} className="space-y-4">
                            <div>
                                <label className="label">Task (optional)</label>
                                <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                                    <option value="">General (no specific task)</option>
                                    {tasks.map((t: Task) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Hours</label>
                                    <input type="number" className="input" min="0" max="24" value={hours} onChange={(e) => setHours(parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="label">Minutes</label>
                                    <input type="number" className="input" min="0" max="59" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Date</label>
                                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Description</label>
                                <textarea className="input h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on?" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowLogForm(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={hours * 60 + minutes <= 0}>
                                    <Clock size={14} /> Log {formatDuration(hours * 60 + minutes)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Project Confirm Modal */}
            {closeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="card w-full max-w-sm animate-slide-up p-6">
                        <h2 className="font-semibold text-lg text-slate-100 mb-2">Close Project?</h2>
                        <p className="text-sm text-slate-400 mb-1">
                            This will mark the project as <span className="text-emerald-400 font-medium">Completed</span>.
                        </p>
                        <p className="text-sm text-slate-500 mb-5">
                            No new time entries can be logged after closing. You can reopen it later if needed.
                        </p>

                        {summary && (
                            <div className="bg-surface-800 rounded-lg p-4 mb-5 border border-surface-600 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total tasks</span>
                                    <span className="text-slate-200 font-medium">{summary.total_tasks}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Completed tasks</span>
                                    <span className="text-emerald-400 font-medium">{summary.completed_tasks}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total time logged</span>
                                    <span className="text-brand-400 font-medium">{formatDuration(summary.total_time_minutes)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setCloseConfirm(false)} className="btn-ghost">Cancel</button>
                            <button onClick={handleClose} disabled={actionLoading} className="btn-primary bg-red-500 hover:bg-red-600 border-red-500">
                                {actionLoading ? 'Closing...' : 'Close Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
