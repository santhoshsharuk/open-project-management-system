import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, MessageSquare, ListTodo, Calendar, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import type { Task, Sprint } from '../types';

const PRIORITY_STYLES: Record<string, string> = {
    low: 'text-slate-400 bg-slate-400/10',
    medium: 'text-blue-400 bg-blue-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    urgent: 'text-red-400 bg-red-400/10',
};

function CreateSprintModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const { addSprint } = useProjectStore();
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addSprint(projectId, { name, goal, start_date: startDate || null, end_date: endDate || null });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card w-full max-w-md animate-slide-up p-6">
                <h2 className="font-semibold text-lg text-slate-100 mb-4">Create Sprint</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Name</label>
                        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sprint 1" />
                    </div>
                    <div>
                        <label className="label">Sprint Goal</label>
                        <textarea className="input h-20" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What do we want to achieve?" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Start Date</label>
                            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                        <button type="submit" className="btn-primary">Create Sprint</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TaskItem({ task, index, isDragDisabled }: { task: Task; index: number; isDragDisabled?: boolean }) {
    const { orgUsers } = useAuthStore();
    const assignee = orgUsers.find((u) => u.id === task.assigned_to);
    return (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-card py-2 px-3 flex flex-col gap-2 ${snapshot.isDragging ? 'rotate-1 shadow-glow' : ''}`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-200">{task.title}</span>
                        <span className={`badge shrink-0 text-[10px] ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1"><MessageSquare size={12} /> {task.comments?.length || 0}</span>
                            {task.due_date && <span className="flex items-center gap-1"><Clock size={12} /> {new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                        {assignee && (
                            <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] text-white" title={assignee.name}>
                                {assignee.avatar?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default function SprintPlanning() {
    const { id: projectId } = useParams<{ id: string }>();
    const { getProjectSprints, getProjectTasks, updateTask, updateSprint, deleteSprint } = useProjectStore();

    const [showCreateSprint, setShowCreateSprint] = useState(false);

    if (!projectId) return null;

    const sprints = getProjectSprints(projectId);
    const tasks = getProjectTasks(projectId);

    // Unassigned tasks go to the backlog
    const backlogTasks = tasks.filter((t) => !t.sprint_id);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const taskId = result.draggableId;
        const sourceId = result.source.droppableId;
        const destId = result.destination.droppableId; // 'backlog' or sprint.id

        // Prevent dragging tasks out of completed sprints
        if (sourceId !== 'backlog') {
            const sourceSprint = sprints.find(s => s.id === sourceId);
            if (sourceSprint?.status === 'completed') return;
        }

        const sprint_id = destId === 'backlog' ? null : destId;
        updateTask(taskId, { sprint_id: sprint_id || undefined });
    };

    const handleStartSprint = (sprint: Sprint) => {
        // Can only have one active sprint usually, but let's just mark this one active
        updateSprint(projectId, sprint.id, { status: 'active' });
    };

    const handleCompleteSprint = (sprint: Sprint) => {
        updateSprint(projectId, sprint.id, { status: 'completed' });
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-1 overflow-hidden">
            <DragDropContext onDragEnd={onDragEnd}>

                {/* Left side: Backlog */}
                <div className="w-full md:w-1/3 flex flex-col bg-surface-800/50 rounded-xl border border-surface-600 overflow-hidden">
                    <div className="p-4 border-b border-surface-600 flex items-center justify-between bg-surface-800">
                        <div className="flex items-center gap-2 font-medium text-slate-200">
                            <ListTodo size={18} className="text-brand-400" />
                            Backlog <span className="text-sm text-slate-500 font-normal">({backlogTasks.length})</span>
                        </div>
                    </div>

                    <Droppable droppableId="backlog">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 overflow-y-auto p-4 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-surface-700/50' : ''}`}
                            >
                                {backlogTasks.length === 0 && <div className="text-center text-sm text-slate-500 mt-4">Backlog is empty</div>}
                                {backlogTasks.map((task, idx) => (
                                    <TaskItem key={task.id} task={task} index={idx} />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* Right side: Sprints */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                            <Calendar size={18} className="text-brand-400" /> Sprints
                        </h2>
                        <button onClick={() => setShowCreateSprint(true)} className="btn-secondary text-sm h-8">
                            <Plus size={14} /> Create Sprint
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-8">
                        {sprints.length === 0 && (
                            <div className="card p-8 text-center text-slate-400 border-dashed">
                                No sprints created yet. Create one to start planning!
                            </div>
                        )}

                        {sprints.map(sprint => {
                            const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
                            const isActive = sprint.status === 'active';
                            const isCompleted = sprint.status === 'completed';

                            return (
                                <div key={sprint.id} className={`card overflow-hidden ${isActive ? 'border-brand-500/50 shadow-glow' : ''} ${isCompleted ? 'opacity-70' : ''}`}>
                                    <div className={`p-4 border-b border-surface-600 flex flex-wrap gap-4 items-center justify-between ${isActive ? 'bg-brand-500/5' : ''}`}>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-medium text-slate-100">{sprint.name}</h3>
                                                <span className={`badge text-xs px-2 ${isActive ? 'bg-brand-500/20 text-brand-400' : isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-surface-600 text-slate-300'}`}>
                                                    {sprint.status.toUpperCase()}
                                                </span>
                                            </div>
                                            {sprint.goal && <p className="text-sm text-slate-400 mt-1">{sprint.goal}</p>}
                                            {sprint.start_date && sprint.end_date && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!isActive && !isCompleted && (
                                                <button onClick={() => handleStartSprint(sprint)} className="btn-primary text-xs h-8 px-3">Start Sprint</button>
                                            )}
                                            {isActive && (
                                                <button onClick={() => handleCompleteSprint(sprint)} className="btn-secondary text-xs h-8 px-3 text-green-400 border-green-500/30 hover:bg-green-500/10">Complete</button>
                                            )}
                                            <button onClick={() => deleteSprint(projectId, sprint.id)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-400/10"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <Droppable droppableId={sprint.id} isDropDisabled={isCompleted}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`p-4 min-h-[120px] bg-surface-800/30 transition-colors flex flex-col gap-2 ${snapshot.isDraggingOver ? 'bg-surface-700/50' : ''}`}
                                            >
                                                {sprintTasks.length === 0 && <div className="text-center text-sm text-slate-500 py-6 border border-dashed border-surface-600 rounded-lg">{isCompleted ? 'No tasks in this sprint' : 'Drag tasks here'}</div>}
                                                {sprintTasks.map((task, idx) => (
                                                    <TaskItem key={task.id} task={task} index={idx} isDragDisabled={isCompleted} />
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            {showCreateSprint && <CreateSprintModal projectId={projectId} onClose={() => setShowCreateSprint(false)} />}
        </div>
    );
}
