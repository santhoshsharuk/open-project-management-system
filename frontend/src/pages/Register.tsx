import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !orgName) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setLoading(true);
        const ok = await register(name, email, password, orgName);
        setLoading(false);
        if (ok) navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 mb-4 shadow-glow">
                        <FolderKanban size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create your workspace</h1>
                    <p className="text-slate-400 text-sm mt-1">Free forever · No credit card required</p>
                </div>

                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input id="reg-name" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Santhosh Kumar" required />
                        </div>
                        <div>
                            <label className="label">Work Email</label>
                            <input id="reg-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.io" required />
                        </div>
                        <div>
                            <label className="label">Organization Name</label>
                            <input id="reg-org" type="text" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="DevStudio Inc." required />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
                        <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base">
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating workspace…</> : 'Create Free Account'}
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 text-center mt-4">By signing up you agree to our Terms of Service</p>
                </div>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
