import { AlertTriangle, ShieldCheck, PhoneCall, ArrowUpRight } from 'lucide-react';
import { useGlobalState } from '../GlobalStateProvider';
import { CRISIS_RESOURCES, RISK_TIERS } from '../riskUtils';

export default function SafetyPage() {
    const { interventionPlan, ensembleDecision, isScoring } = useGlobalState();
    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? 0;
    const info = RISK_TIERS[tier] || RISK_TIERS[0];

    return (
        <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '720px', margin: '0 auto 80px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                    Safety Escalation
                </h2>
                <h1 className="display" style={{ margin: '10px 0 8px', fontSize: '32px' }}>
                    Risk Protocol Center
                </h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Transparent decisioning layer for interventions. This app is not a diagnosis tool and should not replace licensed care.
                </p>
            </header>

            <section className="card" style={{ borderLeft: `6px solid ${info.color}`, marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                    {tier >= 2 ? <AlertTriangle color={info.color} /> : <ShieldCheck color={info.color} />}
                    <h3 style={{ margin: 0, fontSize: '20px' }}>
                        Current Tier: <span style={{ color: info.color }}>{info.label}</span>
                    </h3>
                </div>
                <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>{info.summary}</p>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    Reason: {isScoring ? 'Analyzing live signals...' : (interventionPlan?.reason || ensembleDecision?.reason || 'Awaiting model output')}
                </p>
            </section>

            <section className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Recommended Actions</h3>
                {(interventionPlan?.interventions || [
                    'Collect more baseline data to personalize guidance.',
                    'Use chat journaling to detect trend shifts.',
                    'Enable trusted-contact preferences.',
                ]).map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{idx + 1}.</span>
                        <span style={{ lineHeight: 1.5 }}>{step}</span>
                    </div>
                ))}
            </section>

            <section className="card">
                <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Immediate Support Resources</h3>
                <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    For active self-harm risk or crisis, contact emergency support now.
                </p>
                <div style={{ display: 'grid', gap: '10px' }}>
                    {CRISIS_RESOURCES.map((resource) => (
                        <a
                            key={resource.label}
                            href={resource.href}
                            target={resource.href.startsWith('http') ? '_blank' : undefined}
                            rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                color: 'inherit',
                                background: 'var(--color-bg-card)',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{resource.label}</div>
                                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{resource.detail}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                <PhoneCall size={16} />
                                {resource.value}
                                <ArrowUpRight size={14} />
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}
