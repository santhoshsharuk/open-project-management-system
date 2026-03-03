import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Activity, GitBranch, CheckCircle2, PlusCircle, Trash2, Play, RotateCcw, Users } from 'lucide-react';

const ACTION_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
    task_created:  { icon: PlusCircle,    color: 'text-emerald-400' },
    task_updated:  { icon: CheckCircle2,  color: 'text-brand-400' },
    task_deleted:  { icon: Trash2,        color: 'text-red-400' },
    sprint_created:{ icon: Play,          color: 'text-blue-400' },
    sprint_updated:{ icon: GitBranch,     color: 'text-yellow-400' },
    sprint_deleted:{ icon: Trash2,        color: 'text-red-400' },
    standup_created:{ icon: Users,        color: 'text-purple-400' },
    retro_created: { icon: RotateCcw,     color: 'text-pink-400' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function ActivityFeed() {
    const { id: projectId } = useParams<{ id: string }>();
    const { activityLogs, fetchActivityLogs } = useProjectStore();

    useEffect(() => {
        if (projectId) fetchActivityLogs(projectId);
    }, [projectId, fetchActivityLogs]);

    if (!projectId) return null;

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-6 overflow-y-auto pb-8">
            <div className="flex items-center justify-between bg-surface-800/50 p-6 rounded-2xl border border-surface-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Activity size={24} className="text-brand-400" /> Activity Feed
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Real-time log of all actions in this project.
                    </p>
                </div>
                <button
                    onClick={() => fetchActivityLogs(projectId)}
                    className="btn-secondary text-xs"
                >
                    Refresh
                </button>
            </div>

            {activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Activity size={48} className="text-slate-600 mb-4" />
                    <p className="text-lg font-medium">No activity yet</p>
                    <p className="text-sm text-slate-500 mt-1">Actions like creating tasks, starting sprints, posting standups will appear here.</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-surface-600" />

                    <div className="space-y-1">
                        {activityLogs.map((log) => {
                            const config = ACTION_ICONS[log.action] || { icon: Activity, color: 'text-slate-400' };
                            const Icon = config.icon;
                            return (
                                <div key={log.id} className="relative flex items-start gap-4 pl-12 pr-4 py-3 hover:bg-surface-800/40 rounded-xl transition-colors group">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-[17px] top-4 w-[18px] h-[18px] rounded-full bg-surface-800 border-2 border-surface-600 flex items-center justify-center group-hover:border-brand-500/50 transition-colors`}>
                                        <Icon size={10} className={config.color} />
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-surface-600 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                                        {log.user_avatar || 'U'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-200">
                                            <span className="font-medium text-slate-100">{log.user_name || 'Unknown'}</span>
                                            {' '}
                                            <span className="text-slate-400">{log.message.replace(log.user_name || '', '').trim()}</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">{timeAgo(log.created_at)}</p>
                                    </div>

                                    {/* Badge */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.color} bg-surface-800 border-surface-600 flex-shrink-0 mt-0.5`}>
                                        {log.entity_type}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
