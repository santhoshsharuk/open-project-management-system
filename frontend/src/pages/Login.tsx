import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, FolderKanban, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('santhosh@devstudio.io');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('error') ? 'GitHub login was cancelled or failed.' : '';
    });
    const { login, loginWithToken } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(() => !!searchParams.get('token'));

    // Handle GitHub SSO Callback
    useEffect(() => {
        const token = searchParams.get('token');
        const err = searchParams.get('error');

        if (token) {
            loginWithToken(token).then((ok) => {
                setLoading(false);
                if (ok) navigate('/dashboard');
                else setError('GitHub login failed. Please try again.');
            });
            // Clear the token from URL
            setSearchParams({});
        } else if (err) {
            setSearchParams({});
        }
    }, [searchParams, loginWithToken, navigate, setSearchParams, setLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const ok = await login(email, password);
        setLoading(false);
        if (ok) navigate('/dashboard');
        else setError('Invalid credentials. Please try again.');
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 mb-4 shadow-glow">
                        <FolderKanban size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="text-slate-400 text-sm mt-1">Sign in to your DevFlow workspace</p>
                </div>

                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.io"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-2.5 text-base"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo hint */}
                    <div className="mt-4 p-3 bg-brand-900/30 border border-brand-500/20 rounded-lg">
                        <p className="text-xs text-brand-400 font-medium mb-1">Demo credentials pre-filled!</p>
                        <p className="text-xs text-slate-400">Any email + any password works for the demo.</p>
                    </div>

                    {/* GitHub OAuth */}
                    <div className="mt-4 relative flex items-center gap-3">
                        <div className="flex-1 h-px bg-surface-500" />
                        <span className="text-xs text-slate-500">or</span>
                        <div className="flex-1 h-px bg-surface-500" />
                    </div>
                    <button
                        onClick={() => window.location.href = 'http://localhost:8000/auth/github/login'}
                        className="btn-secondary w-full justify-center mt-4 py-2.5"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.57 0-.28-.01-1.02-.01-2C6 20.46 5.28 18.26 5.28 18.26c-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.41-1.3.75-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.69.83.57A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        Continue with GitHub
                    </button>
                </div>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                        Create one free
                    </Link>
                </p>
            </div>
        </div>
    );
}
