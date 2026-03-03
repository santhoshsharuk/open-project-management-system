import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { ThumbsUp, ThumbsDown, Target, Save, History, CheckCircle } from 'lucide-react';

export default function Retrospectives() {
    const { id: projectId } = useParams<{ id: string }>();
    const { getProjectSprints, retrospectives, fetchRetrospectives, addRetrospective } = useProjectStore();

    const sprints = getProjectSprints(projectId ?? '');
    // Default to the first completed sprint, or just the first sprint
    const completedSprints = sprints.filter(s => s.status === 'completed');
    const [selectedSprintId, setSelectedSprintId] = useState<string>(completedSprints[0]?.id || sprints[0]?.id || '');

    const [wentWell, setWentWell] = useState('');
    const [needsImp, setNeedsImp] = useState('');
    const [actionItems, setActionItems] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (projectId && selectedSprintId) {
            fetchRetrospectives(projectId, selectedSprintId);
        }
    }, [projectId, selectedSprintId, fetchRetrospectives]);

    const existingRetro = retrospectives.find(r => r.sprint_id === selectedSprintId);

    // Sync state if retro exists
    useEffect(() => {
        if (existingRetro) {
            setWentWell(existingRetro.went_well);
            setNeedsImp(existingRetro.needs_improvement);
            setActionItems(existingRetro.action_items);
        } else {
            setWentWell('');
            setNeedsImp('');
            setActionItems('');
        }
    }, [existingRetro, selectedSprintId]);

    const handleSave = async () => {
        if (!projectId || !selectedSprintId) return;
        setSubmitting(true);
        // If we already have one, we currently don't have an update mechanism wired in UI simply.
        // Let's just create a new one for now if none exists.
        if (!existingRetro) {
            await addRetrospective(projectId, selectedSprintId, {
                went_well: wentWell,
                needs_improvement: needsImp,
                action_items: actionItems,
            });
        }
        setSubmitting(false);
    };

    if (sprints.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No sprints available. Complete a sprint to run a retrospective.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto p-1 overflow-hidden">

            <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <History className="text-brand-400" /> Sprint Retrospective
                </h2>
                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-400">Sprint:</label>
                    <select
                        className="input bg-surface-800 py-1.5 h-auto text-sm"
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                    >
                        <optgroup label="Completed Sprints">
                            {completedSprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Other Sprints">
                            {sprints.filter(s => s.status !== 'completed').map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-8">
                {/* Went Well */}
                <div className="card flex flex-col border-t-4 border-t-green-500 bg-surface-800/50">
                    <div className="p-4 border-b border-surface-600 flex items-center gap-2 font-medium text-green-400">
                        <ThumbsUp size={18} /> What went well?
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 bg-transparent resize-none text-slate-300 focus:outline-none placeholder:text-slate-600"
                        placeholder="- Deployed on time&#10;- Great team communication&#10;- Zero critical bugs"
                        value={wentWell}
                        onChange={(e) => setWentWell(e.target.value)}
                        disabled={!!existingRetro}
                    />
                </div>

                {/* Needs Improvement */}
                <div className="card flex flex-col border-t-4 border-t-orange-500 bg-surface-800/50">
                    <div className="p-4 border-b border-surface-600 flex items-center gap-2 font-medium text-orange-400">
                        <ThumbsDown size={18} /> What needs improvement?
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 bg-transparent resize-none text-slate-300 focus:outline-none placeholder:text-slate-600"
                        placeholder="- PR reviews took too long&#10;- Scope creep in feature X"
                        value={needsImp}
                        onChange={(e) => setNeedsImp(e.target.value)}
                        disabled={!!existingRetro}
                    />
                </div>

                {/* Action Items */}
                <div className="card flex flex-col border-t-4 border-t-brand-500 bg-surface-800/50">
                    <div className="p-4 border-b border-surface-600 flex items-center gap-2 font-medium text-brand-400">
                        <Target size={18} /> Action Items
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 bg-transparent resize-none text-slate-300 focus:outline-none placeholder:text-slate-600"
                        placeholder="1. Setup automated PR reminders&#10;2. Stricter sprint scope lock"
                        value={actionItems}
                        onChange={(e) => setActionItems(e.target.value)}
                        disabled={!!existingRetro}
                    />
                </div>
            </div>

            {!existingRetro && (
                <div className="flex justify-end pt-4 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={submitting || (!wentWell && !needsImp && !actionItems)}
                        className="btn-primary"
                    >
                        {submitting ? 'Saving...' : <><Save size={16} /> Save Retrospective</>}
                    </button>
                </div>
            )}

            {existingRetro && (
                <div className="flex justify-end pt-4 shrink-0 px-2 text-sm text-slate-500 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Retrospective locked and saved on {new Date(existingRetro.created_at).toLocaleDateString()}
                </div>
            )}

        </div>
    );
}
