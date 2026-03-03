import { Link } from 'react-router-dom';
import { CheckCircle2, FolderKanban, Zap, Building2, ArrowRight } from 'lucide-react';

const PLANS = [
    {
        name: 'Community',
        price: 'Free',
        sub: 'Self-host forever',
        icon: FolderKanban,
        color: 'border-surface-500',
        accent: 'text-slate-300',
        badge: null,
        features: [
            'Up to 5 projects',
            'Kanban board',
            'GitHub basic sync',
            'JWT authentication',
            'Multi-tenant orgs',
            '3 team members',
            'Community support',
        ],
        cta: 'Start Free',
        ctaTo: '/register',
        ctaStyle: 'btn-secondary w-full justify-center py-3',
    },
    {
        name: 'Pro',
        price: '₹699',
        sub: 'per month',
        icon: Zap,
        color: 'border-brand-500 shadow-glow',
        accent: 'text-brand-400',
        badge: '🔥 Most Popular',
        features: [
            'Unlimited projects',
            'Advanced analytics',
            'Sprint tracking',
            'PR tracking',
            'Dev activity metrics',
            'Priority support',
            'Auto backups',
            'Managed hosting',
        ],
        cta: 'Start 14-day Trial',
        ctaTo: '/register',
        ctaStyle: 'btn-primary w-full justify-center py-3',
    },
    {
        name: 'Growth',
        price: '₹1,999',
        sub: 'per month',
        icon: Building2,
        color: 'border-purple-500/50',
        accent: 'text-purple-400',
        badge: null,
        features: [
            'Everything in Pro',
            'AI delay prediction',
            'White-label option',
            'SSO / SAML',
            'Advanced permissions',
            'Dedicated support',
            'SLA guarantee',
            'Custom integrations',
        ],
        cta: 'Contact Sales',
        ctaTo: '/register',
        ctaStyle: 'btn-secondary w-full justify-center py-3',
    },
];

export default function Pricing() {
    return (
        <div className="min-h-screen bg-surface-900 py-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-4">
                        <Zap size={14} /> Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Choose your <span className="text-gradient">plan</span>
                    </h1>
                    <p className="text-lg text-slate-400">Open-source core + affordable hosted SaaS. Built in India, for the world.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div key={plan.name} className={`card p-6 flex flex-col gap-5 border-2 ${plan.color} relative`}>
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full">
                                        {plan.badge}
                                    </div>
                                )}

                                <div>
                                    <div className={`w-10 h-10 rounded-lg bg-surface-700 border border-surface-500 flex items-center justify-center mb-3`}>
                                        <Icon size={20} className={plan.accent} />
                                    </div>
                                    <h2 className={`text-lg font-bold ${plan.accent}`}>{plan.name}</h2>
                                    <div className="mt-2">
                                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                                        {plan.sub !== 'Self-host forever' && (
                                            <span className="text-slate-400 text-sm ml-1">/{plan.sub.replace('per ', '')}</span>
                                        )}
                                        <div className="text-xs text-slate-500 mt-0.5">{plan.sub}</div>
                                    </div>
                                </div>

                                <ul className="space-y-2.5 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <CheckCircle2 size={15} className={`${plan.accent} flex-shrink-0 mt-0.5`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Link to={plan.ctaTo} className={plan.ctaStyle}>
                                    {plan.cta} <ArrowRight size={15} />
                                </Link>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <p className="text-slate-400 text-sm">
                        All plans include 99.9% uptime SLA · Secure data · Cancel anytime
                    </p>
                    <Link to="/" className="text-brand-400 hover:text-brand-300 text-sm mt-2 inline-flex items-center gap-1">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
