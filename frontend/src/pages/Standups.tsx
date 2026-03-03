import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { MessageCircle, CheckCircle, AlertTriangle, Send } from 'lucide-react';

export default function Standups() {
    const { id: projectId } = useParams<{ id: string }>();
    const { getProjectSprints, standups, fetchStandups, addStandup } = useProjectStore();

    const sprints = getProjectSprints(projectId ?? '');
    const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];
    const [selectedSprintId, setSelectedSprintId] = useState<string>(activeSprint?.id || '');

    const [yesterday, setYesterday] = useState('');
    const [today, setToday] = useState('');
    const [blockers, setBlockers] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (projectId && selectedSprintId) {
            fetchStandups(projectId, selectedSprintId);
        }
    }, [projectId, selectedSprintId, fetchStandups]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !selectedSprintId) return;

        setSubmitting(true);
        await addStandup(projectId, selectedSprintId, {
            yesterday_work: yesterday,
            today_plan: today,
            blockers: blockers
        });
        setSubmitting(false);
        setYesterday('');
        setToday('');
        setBlockers('');
    };

    if (sprints.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                No sprints available. Create a sprint in the Planning tab first.
            </div>
        );
    }

    const currentStandups = standups.filter(s => s.sprint_id === selectedSprintId);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full p-1 overflow-hidden">

            {/* Left: Submit Form */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="card p-5 shrink-0">
                    <div className="mb-4">
                        <label className="label">Select Sprint</label>
                        <select
                            className="input bg-surface-800"
                            value={selectedSprintId}
                            onChange={(e) => setSelectedSprintId(e.target.value)}
                        >
                            {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                            ))}
                        </select>
                    </div>

                    <h3 className="font-semibold text-slate-100 mb-4">Daily Standup</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> What did you do yesterday?</label>
                            <textarea required className="input h-20 resize-none" value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="Completed API task #123..." />
                        </div>
                        <div>
                            <label className="label flex items-center gap-2"><MessageCircle size={14} className="text-brand-400" /> What will you do today?</label>
                            <textarea required className="input h-20 resize-none" value={today} onChange={e => setToday(e.target.value)} placeholder="Will work on the frontend UI..." />
                        </div>
                        <div>
                            <label className="label flex items-center gap-2"><AlertTriangle size={14} className="text-orange-400" /> Any blockers?</label>
                            <textarea className="input h-16 resize-none" value={blockers} onChange={e => setBlockers(e.target.value)} placeholder="None" />
                        </div>
                        <button type="submit" disabled={submitting || !selectedSprintId} className="btn-primary w-full justify-center">
                            <Send size={16} /> Submit Update
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Standup Feed */}
            <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-4">
                <h2 className="text-lg font-medium text-slate-200 sticky top-0 bg-surface-900/90 backdrop-blur-sm py-2 z-10">
                    Team Updates
                </h2>
                {currentStandups.length === 0 ? (
                    <div className="card p-8 text-center text-slate-400 border-dashed">
                        No updates for this sprint yet.
                    </div>
                ) : (
                    currentStandups.map(standup => (
                        <div key={standup.id} className="card p-5 animate-slide-up border border-surface-600 bg-surface-800/40">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                    {standup.user_avatar}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-200">{standup.user_name}</h4>
                                    <p className="text-xs text-slate-500">{new Date(standup.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3 ms-11">
                                <div>
                                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Yesterday</span>
                                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{standup.yesterday_work}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Today</span>
                                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{standup.today_plan}</p>
                                </div>
                                {standup.blockers && (
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                                        <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} /> Blockers</span>
                                        <p className="text-sm text-orange-200 mt-1 whitespace-pre-wrap">{standup.blockers}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
