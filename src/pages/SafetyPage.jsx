import { AlertTriangle, ShieldCheck, PhoneCall, ArrowUpRight } from 'lucide-react';
import { useGlobalState } from '../GlobalStateProvider';
import { CRISIS_RESOURCES, RISK_TIERS } from '../riskUtils';
import SafetyEscalationConsole from '../components/SafetyEscalationConsole';

export default function SafetyPage() {
    const { interventionPlan, ensembleDecision, isScoring } = useGlobalState();
    const tier = 2//interventionPlan?.tier ?? ensembleDecision?.tier ?? 0;
    const info = RISK_TIERS[tier] || RISK_TIERS[0];

    return (
        <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '720px', margin: '0 auto 80px' }}>
            <header style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h1 className="display" style={{ margin: '8px 0', fontSize: '30px' }}>
                    <span className="section-icon-lg">💚</span>Your Support Plan
                </h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: '480px', marginInline: 'auto' }}>
                    Keep trusted people and emergency paths ready, so asking for help is one tap away.
                </p>
            </header>

            <section className="card" style={{ marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: info.color,
                    borderRadius: '28px 28px 0 0',
                    opacity: 0.6,
                }} />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px', paddingTop: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{tier >= 2 ? '⚠️' : '🛡️'}</span>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>
                        Current Tier: <span style={{ color: info.color }}>{info.label}</span>
                    </h3>
                </div>
                <p style={{ margin: '0 0 8px', lineHeight: 1.6, fontSize: '15px' }}>{info.summary}</p>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    Reason: {isScoring ? 'Analyzing live signals...' : (interventionPlan?.reason || ensembleDecision?.reason || 'Awaiting model output')}
                </p>
            </section>

            <section className="card">
                <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">📞</span>Immediate Support Resources</h3>
                <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                    For active self-harm risk or crisis, contact emergency support now.
                </p>
                <div style={{ display: 'grid', gap: '10px' }}>
                    {CRISIS_RESOURCES.map((resource, idx) => (
                        <a
                            key={resource.label}
                            href={resource.href}
                            target={resource.href.startsWith('http') ? '_blank' : undefined}
                            rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            style={{
                                borderRadius: '18px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                textDecoration: 'none',
                                color: 'inherit',
                                background: 'var(--surface-strong)',
                                boxShadow: '0 2px 10px rgba(180, 140, 100, 0.05)',
                                transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(180, 140, 100, 0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(180, 140, 100, 0.05)'; }}
                        >
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '24px' }}>{['📱', '🚨', '🗺️'][idx]}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{resource.label}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{resource.detail}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px' }}>
                                {resource.value}
                                <ArrowUpRight size={14} />
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            <SafetyEscalationConsole tier={tier} />
        </div>
    );
}
