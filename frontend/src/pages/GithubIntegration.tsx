import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Github, Link2, RefreshCw, CheckCircle2, AlertCircle, Webhook,
    GitBranch, GitPullRequest, Key, Star, Lock, Unlock, Loader2, Search,
} from 'lucide-react';

interface GithubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    stargazers_count: number;
    language: string | null;
    description: string | null;
    html_url: string;
    updated_at: string;
    connected: boolean;
}

const LANG_COLORS: Record<string, string> = {
    TypeScript: 'bg-blue-400',
    JavaScript: 'bg-yellow-300',
    Python: 'bg-yellow-500',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
    Java: 'bg-red-500',
    'C++': 'bg-pink-400',
    CSS: 'bg-purple-400',
    HTML: 'bg-orange-400',
    Shell: 'bg-green-400',
};

const CONNECTED_KEY = 'devflow_connected_repos';
const TOKEN_KEY = 'devflow_github_token';
const USERNAME_KEY = 'devflow_github_username';

function loadConnected(): Set<number> {
    try { return new Set(JSON.parse(localStorage.getItem(CONNECTED_KEY) || '[]')); }
    catch { return new Set(); }
}
function saveConnected(set: Set<number>) {
    localStorage.setItem(CONNECTED_KEY, JSON.stringify([...set]));
}

const BACKEND_URL = 'http://localhost:8000';

export default function GithubIntegration() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
    const [username, setUsername] = useState(localStorage.getItem(USERNAME_KEY) || '');
    const [tokenInput, setTokenInput] = useState('');
    const [showPAT, setShowPAT] = useState(false);
    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [connected, setConnected] = useState(!!localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [connectedIds, setConnectedIds] = useState<Set<number>>(loadConnected);
    const [search, setSearch] = useState('');
    const [ghUser, setGhUser] = useState<{ login: string; name: string; avatar_url: string; public_repos: number; total_private_repos?: number } | null>(null);

    // Fetch all repos with pagination
    async function fetchAllRepos(tok: string): Promise<GithubRepo[]> {
        const all: GithubRepo[] = [];
        let page = 1;
        while (true) {
            const res = await fetch(
                `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
                { headers: { Authorization: `token ${tok}`, Accept: 'application/vnd.github+json' } }
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(`GitHub error ${res.status}: ${body.message ?? res.statusText}`);
            }
            const data = await res.json();
            if (data.length === 0) break;
            all.push(...data.map((r: Record<string, unknown>) => ({ ...r, connected: false })));
            if (data.length < 100) break;
            page++;
        }
        return all;
    }

    async function fetchUser(tok: string) {
        const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${tok}`, Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(`GitHub error ${res.status}: ${body.message ?? 'Invalid token'}`);
        }
        return res.json();
    }

    async function handleConnect() {
        if (!tokenInput.trim()) { setError('Please enter your GitHub Personal Access Token.'); return; }
        setLoading(true);
        setError('');
        try {
            const user = await fetchUser(tokenInput.trim());
            const fetchedRepos = await fetchAllRepos(tokenInput.trim());
            localStorage.setItem(TOKEN_KEY, tokenInput.trim());
            localStorage.setItem(USERNAME_KEY, user.login);
            setToken(tokenInput.trim());
            setUsername(user.login);
            setGhUser(user);
            setRepos(fetchedRepos);
            setConnected(true);
            setTokenInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect. Check your token.');
        }
        setLoading(false);
    }

    async function handleSync() {
        setSyncing(true);
        setError('');
        try {
            const user = await fetchUser(token);
            const fetchedRepos = await fetchAllRepos(token);
            setGhUser(user);
            setRepos(fetchedRepos);
        } catch {
            setError('Sync failed. Token may have expired.');
        }
        setSyncing(false);
    }

    function handleDisconnect() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        setToken('');
        setUsername('');
        setConnected(false);
        setRepos([]);
        setGhUser(null);
        setConnectedIds(new Set());
    }

    function toggleRepo(id: number) {
        setConnectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            saveConnected(next);
            return next;
        });
    }

    const loadData = useCallback(async (tok: string) => {
        setLoading(true);
        setError('');
        try {
            const user = await fetchUser(tok);
            setGhUser(user);
            const fetchedRepos = await fetchAllRepos(tok);
            setRepos(fetchedRepos);
        } catch {
            setError('Session expired. Please reconnect.');
            handleDisconnect();
        } finally {
            setLoading(false);
        }
    }, []); // fetchUser and fetchAllRepos are stable (defined in component body, no deps)

    // Handle OAuth callback — backend sends ?gh_token=xxx back to this page
    useEffect(() => {
        const oauthToken = searchParams.get('gh_token');
        const oauthError = searchParams.get('error');
        if (oauthError) {
            setError(`GitHub OAuth error: ${oauthError}`);
            setSearchParams({});
            return;
        }
        if (oauthToken) {
            // Got a token from OAuth — store and load
            localStorage.setItem(TOKEN_KEY, oauthToken);
            setToken(oauthToken);
            setConnected(true);
            setSearchParams({}); // clean the URL
            loadData(oauthToken);
        }
    }, [searchParams, setSearchParams, loadData]);

    // Auto-load on mount if token already saved
    useEffect(() => {
        if (token) loadData(token);
    }, [loadData]); // token is stable from useState initial value

    const filtered = repos.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="section-title text-2xl">GitHub Integration</h1>
                <p className="section-subtitle mt-1">Connect your GitHub account and sync real repos as projects.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle size={15} /> {error}
                </div>
            )}

            {/* Connection status card */}
            <div className="card p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        {ghUser ? (
                            <img src={ghUser.avatar_url} alt="avatar" className="w-12 h-12 rounded-xl ring-2 ring-brand-500/30" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-surface-700 border border-surface-500 flex items-center justify-center">
                                <Github size={24} className="text-slate-200" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-slate-100">GitHub Account</h2>
                                {connected ? (
                                    <span className="badge text-green-400 bg-green-400/10"><CheckCircle2 size={11} /> Connected</span>
                                ) : (
                                    <span className="badge text-slate-400 bg-slate-400/10"><AlertCircle size={11} /> Not connected</span>
                                )}
                            </div>
                            {ghUser ? (
                                <p className="text-sm text-slate-400 mt-0.5">
                                    @{ghUser.login} · {repos.length} repos loaded
                                    {(ghUser.total_private_repos ?? 0) > 0 && <span className="ml-2 text-slate-500">(incl. private)</span>}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 mt-0.5">Connect with a GitHub Personal Access Token</p>
                            )}
                        </div>
                    </div>

                    {connected ? (
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={handleSync} disabled={syncing} className="btn-secondary">
                                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing…' : `Sync (${repos.length})`}
                            </button>
                            <button onClick={handleDisconnect} className="btn-ghost text-red-400 hover:text-red-300">Disconnect</button>
                        </div>
                    ) : null}
                </div>

                {/* Token input — OAuth primary, PAT fallback */}
                {!connected && (
                    <div className="mt-5 space-y-3">
                        {/* OAuth — primary */}
                        <a
                            href={`${BACKEND_URL}/auth/github/`}
                            className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 hover:border-brand-500 transition-all text-slate-100 font-medium text-sm"
                        >
                            <Github size={18} />
                            Connect with GitHub
                            <span className="ml-1 text-xs text-green-400 font-normal">✓ Recommended</span>
                        </a>
                        <p className="text-center text-xs text-slate-500">
                            One click — GitHub will ask you to authorize, then you're done.
                        </p>

                        {/* PAT fallback */}
                        <div className="relative flex items-center gap-2">
                            <div className="flex-1 border-t border-surface-500" />
                            <button onClick={() => setShowPAT(v => !v)} className="text-xs text-slate-500 hover:text-slate-400">
                                {showPAT ? 'Hide' : 'Or use a Personal Access Token'}
                            </button>
                            <div className="flex-1 border-t border-surface-500" />
                        </div>

                        {showPAT && (
                            <>
                                {/* Step 1 */}
                                <div className="flex items-start gap-3 p-4 bg-surface-700 rounded-xl border border-surface-500">
                                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200 mb-2">Open GitHub and create a token</p>
                                        <a
                                            href="https://github.com/settings/tokens/new?scopes=repo&description=DevFlow+PM"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary inline-flex"
                                        >
                                            <Github size={15} /> Open GitHub Token Page →
                                        </a>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Scroll down → click <strong className="text-slate-400">Generate token</strong> → copy the <code className="bg-black/30 px-1 rounded text-brand-400">ghp_...</code> value
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-3 p-4 bg-surface-700 rounded-xl border border-surface-500">
                                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200 mb-2">Paste your token here</p>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    className="input pl-9 font-mono text-sm"
                                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                                    value={tokenInput}
                                                    onChange={(e) => setTokenInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                                />
                                            </div>
                                            <button
                                                onClick={handleConnect}
                                                disabled={loading || !tokenInput.trim()}
                                                className="btn-primary px-5 flex-shrink-0"
                                            >
                                                {loading ? <Loader2 size={15} className="animate-spin" /> : 'Connect'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

            </div>

            {/* Loading state */}
            {loading && !connected && (
                <div className="card p-8 flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={28} className="animate-spin text-brand-400" />
                    <p className="text-sm">Fetching your repositories…</p>
                </div>
            )}

            {connected && repos.length > 0 && (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="card p-4 text-center">
                            <div className="text-2xl font-bold text-white">{repos.length}</div>
                            <div className="text-xs text-slate-400 mt-1">Total Repos</div>
                        </div>
                        <div className="card p-4 text-center">
                            <div className="text-2xl font-bold text-brand-400">{connectedIds.size}</div>
                            <div className="text-xs text-slate-400 mt-1">Connected</div>
                        </div>
                        <div className="card p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{repos.filter((r) => r.private).length}</div>
                            <div className="text-xs text-slate-400 mt-1">Private</div>
                        </div>
                    </div>

                    {/* Repo list */}
                    <div className="card">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600 gap-3">
                            <h2 className="font-semibold text-slate-100 flex-shrink-0">Your Repositories</h2>
                            <div className="relative flex-1 max-w-xs">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    className="input pl-8 h-8 text-sm"
                                    placeholder="Search repos…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-surface-600 max-h-[500px] overflow-y-auto">
                            {filtered.map((repo) => (
                                <div key={repo.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-700/50 transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <GitBranch size={15} className="text-slate-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <a
                                                    href={repo.html_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-slate-200 hover:text-brand-400 transition-colors truncate"
                                                >
                                                    {repo.full_name}
                                                </a>
                                                {repo.private ? (
                                                    <span className="badge text-slate-400 bg-slate-500/10 flex-shrink-0"><Lock size={9} /> private</span>
                                                ) : (
                                                    <span className="badge text-slate-500 bg-slate-500/5 flex-shrink-0"><Unlock size={9} /> public</span>
                                                )}
                                                {connectedIds.has(repo.id) && (
                                                    <span className="badge text-green-400 bg-green-400/10 flex-shrink-0"><CheckCircle2 size={10} /> synced</span>
                                                )}
                                            </div>
                                            {repo.description && (
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">{repo.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {repo.language && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <span className={`w-2 h-2 rounded-full ${LANG_COLORS[repo.language] ?? 'bg-slate-400'}`} />
                                                        {repo.language}
                                                    </span>
                                                )}
                                                {repo.stargazers_count > 0 && (
                                                    <span className="flex items-center gap-0.5 text-xs text-slate-500">
                                                        <Star size={10} /> {repo.stargazers_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleRepo(repo.id)}
                                        className={`flex-shrink-0 ml-3 text-xs py-1.5 ${connectedIds.has(repo.id) ? 'btn-secondary' : 'btn-primary'}`}
                                    >
                                        {connectedIds.has(repo.id) ? 'Disconnect' : <><Link2 size={11} /> Connect</>}
                                    </button>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="py-10 text-center text-slate-500 text-sm">No repos match "{search}"</div>
                            )}
                        </div>
                    </div>

                    {/* Webhook */}
                    <div className="card p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Webhook size={18} className="text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-100 mb-1">Webhook Endpoint</h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Add this URL as a webhook in your GitHub repo settings to auto-sync events (issues closed → task done).
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 text-xs text-brand-400 font-mono truncate">
                                        https://api.devflow.io/webhooks/github/{username || 'your-org-id'}
                                    </code>
                                    <button
                                        className="btn-secondary text-xs py-2 flex-shrink-0"
                                        onClick={() => navigator.clipboard?.writeText(`https://api.devflow.io/webhooks/github/${username}`)}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: GitPullRequest, title: 'PR Tracking', desc: 'Auto-link pull requests to tasks', active: true },
                            { icon: GitBranch, title: 'Branch Sync', desc: 'Create branches directly from tasks', active: false },
                            { icon: CheckCircle2, title: 'Auto-Close', desc: 'Close tasks when issues are merged', active: true },
                        ].map(({ icon: Icon, title, desc, active }) => (
                            <div key={title} className="card p-4 flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-green-500/10 text-green-400' : 'bg-surface-600 text-slate-400'}`}>
                                    <Icon size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-200">{title}</span>
                                        <span className={`badge ${active ? 'text-green-400 bg-green-400/10' : 'text-slate-500 bg-slate-500/10'}`}>{active ? 'Active' : 'Soon'}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
