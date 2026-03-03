import { Link } from 'react-router-dom';
import {
    FolderKanban, Github, Zap, Users, BarChart3, Shield, ArrowRight,
    CheckCircle2, Star
} from 'lucide-react';

const FEATURES = [
    { icon: FolderKanban, title: 'Kanban Boards', desc: 'Drag-and-drop task management with customizable columns, labels, and priorities.' },
    { icon: Github, title: 'GitHub Native', desc: 'Sync issues as tasks, auto-close on PR merge, and link commits to your workflow.' },
    { icon: BarChart3, title: 'Analytics', desc: 'Track team velocity, completion trends, and sprint health with beautiful charts.' },
    { icon: Users, title: 'Multi-Tenant', desc: 'Organization-based workspaces with role-based access control for every team.' },
    { icon: Zap, title: 'Blazing Fast', desc: 'Built on React + FastAPI. Lightweight, minimal, and snappy for developers.' },
    { icon: Shield, title: 'Open Source', desc: 'Self-host for free. Full codebase on GitHub. MIT licensed. Community driven.' },
];

const TESTIMONIALS = [
    { name: 'Rahul S.', role: 'CTO @ StartupXYZ', text: 'Finally a PM tool that speaks developer. GitHub sync is a game changer.', avatar: 'RS' },
    { name: 'Meera K.', role: 'Product Manager', text: "The kanban board is fast and intuitive. We ditched Jira for this.", avatar: 'MK' },
    { name: 'Aditya P.', role: 'Indie Hacker', text: 'Self-hosted for free. Upgraded to Pro for the analytics. Worth every rupee.', avatar: 'AP' },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-surface-900 text-slate-100">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-600/50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow">
                            <FolderKanban size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">DevFlow</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
                        <Link to="/pricing" className="hover:text-slate-100 transition-colors">Pricing</Link>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-100 transition-colors flex items-center gap-1">
                            <Github size={14} /> GitHub
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
                        <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
                        <Star size={13} className="text-yellow-400" /> Open Source · Made in India 🇮🇳
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                        Project Management<br />
                        <span className="text-gradient">Built for Developers</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        A lightweight, GitHub-native PM dashboard. Kanban boards, sprint tracking, and AI insights — open-source core, affordable SaaS hosting.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link to="/register" id="hero-cta" className="btn-primary text-base px-6 py-3 shadow-glow">
                            Start Free <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-secondary text-base px-6 py-3">
                            View Demo →
                        </Link>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                        {['No credit card required', 'Free forever plan', 'Open source'].map((t) => (
                            <span key={t} className="flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-green-500" /> {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dashboard preview */}
            <section className="px-6 pb-20">
                <div className="max-w-5xl mx-auto">
                    <div className="card p-1 shadow-glow">
                        <div className="bg-surface-800 rounded-lg p-4">
                            <div className="flex items-center gap-1.5 mb-3">
                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                <div className="flex-1 bg-surface-700 rounded-md mx-4 h-5" />
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {['Active Projects: 2', 'Completed: 31', 'Overdue: 3', 'Members: 4'].map((s) => (
                                    <div key={s} className="bg-surface-700 rounded-lg p-3">
                                        <div className="text-xs text-slate-400">{s.split(':')[0]}</div>
                                        <div className="text-xl font-bold text-white mt-1">{s.split(':')[1]}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {['📋 Todo (3)', '⚡ In Progress (2)', '✅ Done (3)'].map((col) => (
                                    <div key={col} className="bg-surface-700 rounded-lg p-3">
                                        <div className="text-xs font-semibold text-slate-300 mb-2">{col}</div>
                                        {[1, 2].map((i) => (
                                            <div key={i} className="bg-surface-600 rounded-md p-2 mb-1.5">
                                                <div className="h-2 bg-surface-500 rounded w-3/4 mb-1" />
                                                <div className="h-1.5 bg-surface-500 rounded w-1/2" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 border-t border-surface-700">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-3">Everything you need to ship faster</h2>
                        <p className="text-slate-400">Designed for dev teams who want power without the bloat.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="card p-5 hover:border-brand-500/40 hover:shadow-glow transition-all duration-200">
                                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
                                    <Icon size={20} className="text-brand-400" />
                                </div>
                                <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-6 border-t border-surface-700">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Loved by teams across India</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.name} className="card p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-4">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">{t.avatar}</div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">{t.name}</div>
                                        <div className="text-xs text-slate-400">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 border-t border-surface-700">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to ship faster?</h2>
                    <p className="text-slate-400 mb-8">Join hundreds of dev teams managing their projects with DevFlow.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/register" className="btn-primary text-base px-6 py-3 shadow-glow">
                            Get Started Free <ArrowRight size={18} />
                        </Link>
                        <Link to="/pricing" className="btn-secondary text-base px-6 py-3">
                            View Pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-surface-700 px-6 py-8">
                <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                            <FolderKanban size={12} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">DevFlow</span>
                        <span className="text-xs text-slate-500">· Built by Santhosh 🇮🇳</span>
                    </div>
                    <div className="text-xs text-slate-500">
                        Mission: Build simple tools for serious builders.
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                        <Link to="/pricing" className="hover:text-slate-300">Pricing</Link>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">GitHub</a>
                        <Link to="/login" className="hover:text-slate-300">Login</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
