import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Clock, X, Loader2, Search, Trash2, Github } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import type { ProjectStatus } from '../types';

const STATUS_STYLES: Record<ProjectStatus, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    on_hold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    completed: 'text-brand-400 bg-brand-400/10 border-brand-400/20',
    archived: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

function CreateProjectModal({ onClose }: { onClose: () => void }) {
    const { addProject } = useProjectStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    // GitHub Integration fields
    const token = localStorage.getItem('devflow_github_token');
    const hasToken = !!token;

    const [githubRepo, setGithubRepo] = useState('');
    const [repos, setRepos] = useState<{ full_name: string; id: number }[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(hasToken);

    useEffect(() => {
        if (!token) return;

        // Fetch up to 100 recent repos the user has access to
        fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter to only repositories they have connected if you want, 
                    // or just show all of them. Showing all of them enables easy connection.
                    setRepos(data.map(r => ({ full_name: r.full_name, id: r.id })));
                }
            })
            .catch(() => { })
            .finally(() => setLoadingRepos(false));
    }, [token]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await addProject({
            name,
            description,
            deadline: deadline || undefined,
            github_repo: githubRepo || undefined,
        });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md animate-slide-up p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-slate-100 text-lg">New Project</h2>
                    <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="label">Project Name</label>
                        <input id="proj-name" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Customer Portal v2" required />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea className="input resize-none h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
                    </div>
                    <div>
                        <label className="label">Deadline</label>
                        <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
                    </div>

                    <div>
                        <label className="label flex items-center gap-1.5"><Github size={14} /> Link GitHub Repository (Optional)</label>
                        {!hasToken ? (
                            <div className="text-xs text-slate-500 bg-surface-700 p-3 rounded-lg border border-surface-600">
                                <span>Connect GitHub in the Integration tab to link a repository.</span>
                            </div>
                        ) : loadingRepos ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                                <Loader2 size={12} className="animate-spin" /> Fetching your repositories...
                            </div>
                        ) : (
                            <select
                                className="input"
                                value={githubRepo}
                                onChange={(e) => setGithubRepo(e.target.value)}
                            >
                                <option value="">-- Do not link a repository --</option>
                                {repos.map(r => (
                                    <option key={r.id} value={r.full_name}>{r.full_name}</option>
                                ))}
                            </select>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1.5">Linking a repository enables PR Tracking, Branch creation, and CI/CD Analytics automatically.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Create</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Projects() {
    const { projects, deleteProject, fetchProjects } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | ProjectStatus>('all');

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const filtered = projects.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || p.status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-title text-2xl">Projects</h1>
                    <p className="section-subtitle mt-1">{projects.length} projects in your workspace</p>
                </div>
                <button id="create-project-btn" onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" className="input pl-9 h-9" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {(['all', 'active', 'on_hold', 'completed', 'archived'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${filter === s ? 'bg-brand-600 border-brand-500 text-white' : 'bg-surface-700 border-surface-500 text-slate-400 hover:text-slate-200'}`}
                    >
                        {s === 'all' ? 'All' : s.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Project grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((project) => {
                    const pct = project.task_count > 0 ? Math.round((project.completed_tasks / project.task_count) * 100) : 0;
                    return (
                        <div key={project.id} className="card-hover p-5 flex flex-col gap-3 group relative">
                            <button
                                onClick={(e) => { e.preventDefault(); if (confirm('Delete this project?')) deleteProject(project.id); }}
                                className="absolute top-3 right-3 btn-ghost p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                                    <FolderKanban size={17} className="text-brand-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-100 leading-tight truncate pr-6">{project.name}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{project.completed_tasks}/{project.task_count} tasks</span>
                                    <span className="font-medium text-slate-200">{pct}%</span>
                                </div>
                                <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock size={11} />
                                    <span>Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <span className={`badge border ${STATUS_STYLES[project.status]}`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>

                            {project.github_repo && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.57v-2C6 20.46 5.28 18.26 5.28 18.26c-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.41-1.3.75-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.69.83.57A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    {project.github_repo}
                                </div>
                            )}

                            <Link to={`/projects/${project.id}`} className="btn-secondary w-full justify-center text-xs py-1.5 mt-auto">
                                Open Board →
                            </Link>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-500">
                        <FolderKanban size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No projects found.</p>
                    </div>
                )}
            </div>

            {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
