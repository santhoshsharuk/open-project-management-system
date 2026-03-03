import type { Task } from '../types';

export default function TimelineView({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return <div className="p-8 text-center text-slate-500">No tasks to display in timeline.</div>;
    }

    // Determine the date range
    const validTasks = tasks.filter(t => t.due_date || t.start_date || t.created_at);

    let minDate = new Date();
    let maxDate = new Date();

    if (validTasks.length > 0) {
        const startDates = validTasks.map(t => new Date(t.start_date || t.created_at).getTime());
        const endDates = validTasks.map(t => new Date(t.due_date || t.start_date || t.created_at).getTime());

        minDate = new Date(Math.min(...startDates));
        maxDate = new Date(Math.max(...endDates));
    }

    // Add some padding to dates (e.g. 3 days before min, 7 days after max)
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);

    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Generate days for header
    const days: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    const getTaskStyle = (task: Task) => {
        const start = new Date(task.start_date || task.created_at);
        const end = new Date(task.due_date || task.start_date || task.created_at);

        // ensure start <= end
        if (start > end) start.setTime(end.getTime());

        const leftDays = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        const durationDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);

        return {
            left: `${(leftDays / totalDays) * 100}%`,
            width: `${(durationDays / totalDays) * 100}%`
        };
    };

    const STATUS_COLORS: Record<string, string> = {
        todo: 'bg-slate-500',
        in_progress: 'bg-yellow-500',
        done: 'bg-green-500',
        backlog: 'bg-slate-700'
    };

    return (
        <div className="bg-surface-800 rounded-lg border border-surface-600 overflow-x-auto flex-1 flex flex-col min-h-0">
            <div className="min-w-[800px] inline-block w-full h-full pb-4">
                {/* Header */}
                <div className="flex border-b border-surface-600 bg-surface-900 sticky top-0 z-10">
                    <div className="w-1/4 min-w-[200px] p-3 font-semibold text-xs text-slate-400 border-r border-surface-600 sticky left-0 bg-surface-900 z-20">Task</div>
                    <div className="flex-1 flex relative">
                        {days.map((d, i) => {
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 flex-shrink-0 border-r border-surface-600/30 p-2 text-center text-[10px] ${isToday ? 'bg-brand-500/10 text-brand-400' : 'text-slate-500'} relative`}
                                    style={{ minWidth: '40px' }}
                                >
                                    <div className="font-medium text-slate-300">{d.getDate()}</div>
                                    <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rows */}
                <div className="flex flex-col">
                    {tasks.map(task => (
                        <div key={task.id} className="flex border-b border-surface-600/50 hover:bg-surface-700/30 transition-colors group">
                            <div className="w-1/4 min-w-[200px] p-3 text-sm text-slate-200 border-r border-surface-600 sticky left-0 bg-surface-800 group-hover:bg-surface-700/80 z-10 truncate">
                                {task.title}
                            </div>
                            <div className="flex-1 relative py-2" style={{ minWidth: `${totalDays * 40}px` }}>
                                {/* Background grid lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {days.map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-surface-600/10" style={{ minWidth: '40px' }} />
                                    ))}
                                </div>

                                {/* Timeline Bar */}
                                <div
                                    className={`absolute top-2 bottom-2 rounded-md ${STATUS_COLORS[task.status] || 'bg-brand-500'} opacity-80 hover:opacity-100 transition-opacity flex items-center px-2 cursor-help backdrop-blur-sm`}
                                    style={getTaskStyle(task)}
                                    title={`${task.title} (${task.status})`}
                                >
                                    <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                                        {task.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
