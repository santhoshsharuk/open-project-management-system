import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, X, Loader2, Clock, MessageSquare, GitBranch, GitPullRequest, Copy, Check, Kanban, CalendarDays, Search, Filter } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import type { Task, TaskStatus, Priority } from '../types';
import TimelineView from '../components/TimelineView';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: '📋 Todo', color: 'border-slate-500/30 bg-slate-500/5' },
    { id: 'in_progress', label: '⚡ In Progress', color: 'border-yellow-500/30 bg-yellow-500/5' },
    { id: 'done', label: '✅ Done', color: 'border-green-500/30 bg-green-500/5' },
];

const PRIORITY_STYLES: Record<Priority, string> = {
    low: 'text-slate-400 bg-slate-400/10',
    medium: 'text-blue-400 bg-blue-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    urgent: 'text-red-400 bg-red-400/10',
};

const PRIORITY_ICONS: Record<Priority, string> = {
    low: '▽', medium: '○', high: '▲', urgent: '🔥',
};

function AddTaskModal({ projectId, defaultStatus, onClose }: { projectId: string; defaultStatus: TaskStatus; onClose: () => void }) {
    const { addTask } = useProjectStore();
    const { orgUsers, user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [description] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [assignee, setAssignee] = useState(user?.id || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 400));
        addTask({ project_id: projectId, title, description, status: defaultStatus, priority, assigned_to: assignee, due_date: dueDate, labels: '', github_issue_id: undefined });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md animate-slide-up p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg text-slate-100">Add Task</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="label">Title</label>
                        <input id="task-title" type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Start Date</label>
                            <input type="date" className="input" /* will need start_date state if added, defaulting to none */ />
                        </div>
                        <div>
                            <label className="label">Due Date</label>
                            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Priority</label>
                            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Assignee</label>
                            <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                                <option value="">Unassigned</option>
                                {orgUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Due Date</label>
                        <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Add Task</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
    const { orgUsers } = useAuthStore();
    const [comment, setComment] = useState('');
    const [copied, setCopied] = useState(false);
    const assignee = orgUsers.find((u) => u.id === task.assigned_to);

    const branchName = `feature/${task.id.split('-')[0]}-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const handleCopyBranch = () => {
        navigator.clipboard.writeText(`git checkout -b ${branchName}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-lg animate-slide-up max-h-[80vh] flex flex-col">
                <div className="flex items-start justify-between p-5 border-b border-surface-600">
                    <div className="flex-1">
                        <h2 className="font-semibold text-slate-100">{task.title}</h2>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>{PRIORITY_ICONS[task.priority]} {task.priority}</span>
                            {task.labels && typeof task.labels === 'string' && task.labels.split(',').filter(Boolean).map((l) => <span key={l.trim()} className="badge bg-brand-500/10 text-brand-400">{l.trim()}</span>)}
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-1.5 ml-3 flex-shrink-0"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {task.description && (
                        <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 text-xs">Assignee</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">{assignee?.avatar}</div>
                                <span className="text-slate-200">{assignee?.name ?? '—'}</span>
                            </div>
                        </div>
                        {task.due_date && (
                            <div>
                                <span className="text-slate-500 text-xs">Due Date</span>
                                <div className="flex items-center gap-1 mt-1 text-slate-200">
                                    <Clock size={13} />
                                    {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Version Control */}
                    <div className="pt-2">
                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-3">
                            <GitBranch size={14} /> Version Control
                        </h3>
                        <div className="flex flex-col gap-2">
                            {task.github_pr ? (
                                <a href={task.github_pr} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 bg-brand-500/10 px-3 py-2 rounded-lg border border-brand-500/20">
                                    <GitPullRequest size={14} />
                                    <span>PR Linked: <strong>#{task.github_pr.split('/').pop()}</strong></span>
                                </a>
                            ) : (
                                <div className="flex items-center justify-between bg-surface-700/50 p-3 rounded-lg border border-surface-600">
                                    <div className="text-sm text-slate-300 min-w-0 pr-2">
                                        <span className="text-slate-400 text-xs block mb-1">No PR linked. Create a branch to start working:</span>
                                        <code className="text-xs text-brand-400 bg-surface-800 px-2 py-1 rounded inline-block select-all truncate max-w-[200px] sm:max-w-xs cursor-text">
                                            git checkout -b {branchName}
                                        </code>
                                    </div>
                                    <button onClick={handleCopyBranch} className="btn-secondary text-xs h-8 whitespace-nowrap shrink-0 flex items-center gap-1">
                                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                        {copied ? 'Copied' : 'Copy Cmd'}
                                    </button>
                                </div>
                            )}
                            {task.github_branch && (
                                <span className="flex items-center gap-2 text-sm text-slate-400 px-1 mt-1">
                                    <GitBranch size={14} /> Branch: {task.github_branch}
                                </span>
                            )}
                            {task.github_issue_url && (
                                <a href={task.github_issue_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mt-1 px-1">
                                    <span className="font-bold text-green-400">#</span> Issue: {task.github_issue_url.split('/').pop()}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="border-t border-surface-600 pt-5">
                        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mb-3">
                            <MessageSquare size={14} /> Comments ({task.comments.length})
                        </h3>
                        <div className="space-y-3">
                            {task.comments.map((c) => (
                                <div key={c.id} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{c.user_avatar}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-slate-200">{c.user_name}</span>
                                            <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 bg-surface-700 rounded-lg px-3 py-2">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-surface-600 flex gap-2">
                    <input type="text" className="input flex-1 h-9" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                    <button className="btn-primary h-9 px-3" onClick={() => setComment('')}>Send</button>
                </div>
            </div>
        </div>
    );
}

export default function ProjectBoard() {
    const { id: projectId } = useParams<{ id: string }>();
    const { projects, getProjectTasks, updateTask, getProjectSprints } = useProjectStore();
    const { orgUsers } = useAuthStore();

    const project = projects.find((p) => p.id === projectId);
    const [ciStatus, setCiStatus] = useState<'loading' | 'success' | 'failure' | 'in_progress' | 'queued' | null>(null);

    useEffect(() => {
        if (!project?.github_repo) return;
        const token = localStorage.getItem('devflow_github_token');
        if (!token) return;

        let isMounted = true;
        const fetchStatus = async () => {
            setCiStatus('loading');
            try {
                const res = await fetch(`https://api.github.com/repos/${project.github_repo}/actions/runs?per_page=1`, {
                    headers: { Authorization: `token ${token}` }
                });
                const data = await res.json();
                if (!isMounted) return;

                if (data && data.workflow_runs && data.workflow_runs.length > 0) {
                    const run = data.workflow_runs[0];
                    if (run.status === 'completed') {
                        setCiStatus(run.conclusion === 'success' ? 'success' : 'failure');
                    } else {
                        setCiStatus(run.status);
                    }
                } else {
                    setCiStatus(null);
                }
            } catch {
                if (isMounted) setCiStatus(null);
            }
        };

        fetchStatus();
        return () => { isMounted = false; };
    }, [project?.github_repo]);

    // Find active sprint
    const sprints = getProjectSprints(projectId ?? '');
    const activeSprint = sprints.find(s => s.status === 'active');

    // Fallback: If no active sprint, show all non-backlog tasks. If active, show only sprint tasks.
    const allTasks = getProjectTasks(projectId ?? '');
    const tasks = activeSprint
        ? allTasks.filter(t => t.sprint_id === activeSprint.id)
        : allTasks.filter(t => t.status !== 'backlog');

    const [showAddTask, setShowAddTask] = useState<TaskStatus | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board');

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterPriority && t.priority !== filterPriority) return false;
            if (filterAssignee && t.assigned_to !== filterAssignee) return false;
            return true;
        });
    }, [tasks, searchQuery, filterPriority, filterAssignee]);

    const activeFilterCount = [searchQuery, filterPriority, filterAssignee].filter(Boolean).length;



    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const taskId = result.draggableId;
        const newStatus = result.destination.droppableId as TaskStatus;
        updateTask(taskId, { status: newStatus });
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* CI/CD & Repo Banner */}
            {project?.github_repo && ciStatus && (
                <div className="mb-4 bg-surface-800 border border-surface-600 px-4 py-2.5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">{project.github_repo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {ciStatus === 'loading' && <span className="badge bg-slate-500/10 text-slate-400">CI: Loading…</span>}
                        {ciStatus === 'success' && <span className="badge bg-green-500/10 text-green-400"><Check size={12} /> CI passing</span>}
                        {ciStatus === 'failure' && <span className="badge bg-red-500/10 text-red-400"><X size={12} /> CI failing</span>}
                        {(ciStatus === 'in_progress' || ciStatus === 'queued') && <span className="badge bg-yellow-500/10 text-yellow-400"><Loader2 size={12} className="animate-spin" /> CI {ciStatus.replace('_', ' ')}</span>}
                    </div>
                </div>
            )}

            {/* Active Sprint Banner & View Toggle */}
            <div className={`mb-4 ${activeSprint ? 'bg-brand-500/10 border-brand-500/20' : 'bg-surface-800 border-surface-600'} border px-4 py-3 rounded-lg flex items-center justify-between`}>
                <div>
                    {activeSprint ? (
                        <>
                            <h2 className="text-brand-400 font-semibold text-sm">Active Sprint: {activeSprint.name}</h2>
                            <p className="text-slate-400 text-xs mt-0.5">{activeSprint.goal}</p>
                        </>
                    ) : (
                        <p className="text-slate-400 text-xs italic">No active sprint. Showing all unassigned tasks.</p>
                    )}
                </div>

                <div className="flex bg-surface-900 rounded-lg p-1 border border-surface-600">
                    <button
                        onClick={() => setViewMode('board')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-surface-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'}`}
                    >
                        <Kanban size={14} /> Board
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'timeline' ? 'bg-brand-500/20 text-brand-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'}`}
                    >
                        <CalendarDays size={14} /> Timeline
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text" placeholder="Search tasks…" value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 h-9 text-sm"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={14} /></button>}
                </div>
                <button onClick={() => setShowFilters(f => !f)} className={`btn-secondary h-9 text-xs ${activeFilterCount > 0 ? 'border-brand-500/50 text-brand-400' : ''}`}>
                    <Filter size={14} /> Filters {activeFilterCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
                </button>
                {activeFilterCount > 0 && (
                    <button onClick={() => { setSearchQuery(''); setFilterPriority(''); setFilterAssignee(''); }} className="text-xs text-slate-400 hover:text-slate-200">Clear all</button>
                )}
            </div>
            {showFilters && (
                <div className="mb-4 flex items-center gap-3 flex-wrap bg-surface-800 border border-surface-600 rounded-lg px-4 py-3 animate-fade-in">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Priority</label>
                        <select className="input h-8 text-xs min-w-[110px]" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | '')}>
                            <option value="">All</option>
                            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Assignee</label>
                        <select className="input h-8 text-xs min-w-[130px]" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                            <option value="">All</option>
                            {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {viewMode === 'board' ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
                        {COLUMNS.map((col) => {
                            const colTasks = filteredTasks.filter((t) => t.status === col.id);
                            return (
                                <div key={col.id} className={`kanban-col border ${col.color} flex-shrink-0`}>
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600">
                                        <span className="text-sm font-semibold text-slate-200">{col.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-surface-600 text-xs flex items-center justify-center text-slate-400 font-medium">{colTasks.length}</span>
                                            <button onClick={() => setShowAddTask(col.id)} className="btn-ghost p-1"><Plus size={14} /></button>
                                        </div>
                                    </div>

                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 p-3 space-y-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-brand-500/5' : ''}`}
                                            >
                                                {colTasks.map((task, idx) => {
                                                    const assignee = orgUsers.find((u) => u.id === task.assigned_to);
                                                    return (
                                                        <Draggable key={task.id} draggableId={task.id} index={idx}>
                                                            {(prov, snap) => (
                                                                <div
                                                                    ref={prov.innerRef}
                                                                    {...prov.draggableProps}
                                                                    {...prov.dragHandleProps}
                                                                    className={`task-card ${snap.isDragging ? 'rotate-1 shadow-glow' : ''}`}
                                                                    onClick={() => setSelectedTask(task)}
                                                                >
                                                                    <p className="text-sm text-slate-200 font-medium leading-snug mb-2">{task.title}</p>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`badge text-xs ${PRIORITY_STYLES[task.priority]}`}>{PRIORITY_ICONS[task.priority]} {task.priority}</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {task.comments.length > 0 && (
                                                                                <span className="flex items-center gap-0.5 text-xs text-slate-500">
                                                                                    <MessageSquare size={10} /> {task.comments.length}
                                                                                </span>
                                                                            )}
                                                                            {assignee && (
                                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white" title={assignee.name}>
                                                                                    {assignee.avatar?.[0]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                                                            <Clock size={10} />
                                                                            {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            ) : (
                <TimelineView tasks={filteredTasks} />
            )}

            {showAddTask && <AddTaskModal projectId={projectId!} defaultStatus={showAddTask} onClose={() => setShowAddTask(null)} />}
            {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
        </div>
    );
}
