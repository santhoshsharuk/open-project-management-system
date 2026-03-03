import { useState, useEffect } from 'react';
import { Save, Bell, Lock, User, Globe, Loader2, CheckCircle2, Mail, UserPlus, Trash2, Github, Unlink } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import api from '../lib/api';

export default function SettingsPage() {
    const { user, org } = useAuthStore();
    const { invitations, fetchInvitations, sendInvitation, cancelInvitation, pendingInvites, fetchPendingInvites, acceptInvitation } = useProjectStore();
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [discordUserId, setDiscordUserId] = useState(user?.discord_user_id ?? '');
    const [orgName, setOrgName] = useState(org?.name ?? '');
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [slackNotifs, setSlackNotifs] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [acceptLoading, setAcceptLoading] = useState('');
    const [ghConnecting, setGhConnecting] = useState(false);

    useEffect(() => {
        fetchInvitations();
        fetchPendingInvites();
    }, [fetchInvitations, fetchPendingInvites]);

    // Handle GitHub connect callback — pick up ?gh_token= from redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ghToken = params.get('gh_token');
        if (ghToken) {
            // Clear the URL params
            window.history.replaceState({}, '', '/settings');
            (async () => {
                setGhConnecting(true);
                try {
                    await api.post('/auth/github/connect', { github_token: ghToken });
                    // Refresh user data
                    const { data: me } = await api.get('/auth/me');
                    useAuthStore.setState({ user: me });
                } catch (e) {
                    console.error('Failed to connect GitHub', e);
                }
                setGhConnecting(false);
            })();
        }
    }, []);

    const handleConnectGithub = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/github/connect`;
    };

    const handleDisconnectGithub = async () => {
        try {
            await api.delete('/auth/github/connect');
            const { data: me } = await api.get('/auth/me');
            useAuthStore.setState({ user: me });
        } catch (e) {
            console.error('Failed to disconnect GitHub', e);
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviteLoading(true);
        setInviteError('');
        try {
            await sendInvitation(inviteEmail.trim());
            setInviteEmail('');
        } catch (e: any) {
            setInviteError(e?.response?.data?.detail || 'Failed to send invitation');
        }
        setInviteLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.patch('/auth/me', {
                name: displayName,
                email,
                discord_user_id: discordUserId || null,
            });
            // Refresh user data in store
            const { data: me } = await api.get('/auth/me');
            useAuthStore.setState({ user: me });
        } catch (e) {
            console.error('Failed to save settings', e);
        }
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const planColors: Record<string, string> = {
        free: 'text-slate-400 bg-slate-400/10',
        pro: 'text-brand-400 bg-brand-400/10',
        growth: 'text-purple-400 bg-purple-400/10',
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <div>
                <h1 className="section-title text-2xl">Settings</h1>
                <p className="section-subtitle mt-1">Manage your account and workspace preferences.</p>
            </div>

            {saved && (
                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3 text-sm">
                    <CheckCircle2 size={16} /> Settings saved successfully!
                </div>
            )}

            {/* Profile */}
            <div className="card">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                    <User size={16} className="text-brand-400" />
                    <h2 className="font-semibold text-slate-100">Profile</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4 mb-5">
                        {user?.github_avatar_url ? (
                            <img
                                src={user.github_avatar_url}
                                alt={user.github_username || user.name}
                                className="w-16 h-16 rounded-xl shadow-glow object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-glow">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                            </div>
                        )}
                        <div>
                            {user?.github_username ? (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 text-sm text-slate-300">
                                        <Github size={14} className="text-slate-400" />
                                        <a href={`https://github.com/${user.github_username}`} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                                            @{user.github_username}
                                        </a>
                                    </span>
                                    <button
                                        onClick={handleDisconnectGithub}
                                        className="btn-ghost text-xs py-1 px-2 text-red-400 hover:bg-red-400/10"
                                        title="Disconnect GitHub"
                                    >
                                        <Unlink size={12} /> Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGithub}
                                    disabled={ghConnecting}
                                    className="btn-secondary text-xs py-1.5 flex items-center gap-1.5"
                                >
                                    {ghConnecting ? (
                                        <><Loader2 size={13} className="animate-spin" /> Connecting…</>
                                    ) : (
                                        <><Github size={13} /> Connect GitHub Profile</>
                                    )}
                                </button>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                                {user?.github_avatar_url
                                    ? 'Avatar synced from GitHub'
                                    : 'Connect GitHub to use your profile avatar'}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Display Name</label>
                            <input type="text" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Role</label>
                        <input type="text" className="input bg-surface-800 cursor-not-allowed" value={user?.role ?? ''} readOnly />
                    </div>
                    <div>
                        <label className="label">Discord User ID</label>
                        <input type="text" className="input" value={discordUserId} onChange={(e) => setDiscordUserId(e.target.value)} placeholder="e.g. 123456789012345678" />
                        <p className="text-[10px] text-slate-500 mt-1">Enable @mentions when tasks are assigned to you. <a href="https://support.discord.com/hc/en-us/articles/206346498" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">How to find your Discord ID</a></p>
                    </div>
                </div>
            </div>

            {/* Organization */}
            <div className="card">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                    <Globe size={16} className="text-brand-400" />
                    <h2 className="font-semibold text-slate-100">Organization</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="label">Organization Name</label>
                        <input type="text" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-surface-500">
                        <div>
                            <div className="text-sm font-medium text-slate-200">Current Plan</div>
                            <div className="text-xs text-slate-400 mt-0.5">Billed monthly</div>
                        </div>
                        <span className={`badge font-semibold capitalize ${planColors[org?.plan_type ?? 'free']}`}>
                            {org?.plan_type ?? 'free'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="card">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                    <Bell size={16} className="text-brand-400" />
                    <h2 className="font-semibold text-slate-100">Notifications</h2>
                </div>
                <div className="p-5 space-y-4">
                    {[
                        { label: 'Email Notifications', desc: 'Receive task updates and mentions via email', value: emailNotifs, set: setEmailNotifs },
                        { label: 'Slack Notifications', desc: 'Push task activity to your Slack channel', value: slackNotifs, set: setSlackNotifs },
                    ].map(({ label, desc, value, set }) => (
                        <div key={label} className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-slate-200">{label}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                            </div>
                            <button
                                onClick={() => set((v: boolean) => !v)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-surface-500'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invitations for You */}
            {pendingInvites.length > 0 && (
                <div className="card border-brand-500/30">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                        <Mail size={16} className="text-green-400" />
                        <h2 className="font-semibold text-slate-100">You've Been Invited!</h2>
                        <span className="ml-auto badge bg-green-400/10 text-green-400 border border-green-400/20">{pendingInvites.length}</span>
                    </div>
                    <div className="p-5 space-y-3">
                        {pendingInvites.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 bg-surface-700/50 rounded-lg border border-surface-600">
                                <div>
                                    <p className="text-sm font-medium text-slate-200">
                                        Join <span className="text-brand-400">{inv.organization_name || 'an organization'}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Invited by {inv.inviter_name || 'a team member'}
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        setAcceptLoading(inv.id);
                                        await acceptInvitation(inv.id);
                                        setAcceptLoading('');
                                    }}
                                    disabled={acceptLoading === inv.id}
                                    className="btn-primary text-xs py-1.5 px-4"
                                >
                                    {acceptLoading === inv.id ? <Loader2 size={14} className="animate-spin" /> : 'Accept & Join'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Team Invitations */}
            <div className="card">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                    <UserPlus size={16} className="text-brand-400" />
                    <h2 className="font-semibold text-slate-100">Team Invitations</h2>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-400">Invite team members to join your organization by email.</p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            className="input flex-1"
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                        />
                        <button
                            onClick={handleSendInvite}
                            disabled={inviteLoading || !inviteEmail.trim()}
                            className="btn-primary px-4"
                        >
                            {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : <><Mail size={14} /> Send</>}
                        </button>
                    </div>
                    {inviteError && (
                        <p className="text-xs text-red-400">{inviteError}</p>
                    )}
                    {invitations.length > 0 && (
                        <div className="space-y-2 mt-3">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sent Invitations</p>
                            {invitations.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg border border-surface-600">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold text-slate-300">
                                            {inv.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-200">{inv.email}</p>
                                            <p className="text-[11px] text-slate-500">
                                                {inv.status === 'pending' ? '⏳ Pending' : inv.status === 'accepted' ? '✅ Accepted' : '❌ Expired'}
                                            </p>
                                        </div>
                                    </div>
                                    {inv.status === 'pending' && (
                                        <button
                                            onClick={() => cancelInvitation(inv.id)}
                                            className="btn-ghost p-1.5 text-red-400 hover:bg-red-400/10"
                                            title="Cancel invitation"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Security */}
            <div className="card">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-600">
                    <Lock size={16} className="text-brand-400" />
                    <h2 className="font-semibold text-slate-100">Security</h2>
                </div>
                <div className="p-5 space-y-3">
                    <button className="btn-secondary w-full justify-center">Change Password</button>
                    <button className="btn-secondary w-full justify-center">Enable 2FA</button>
                    <button className="btn-ghost w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20">Delete Account</button>
                </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="btn-primary py-2.5 px-6">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
            </button>
        </div>
    );
}
