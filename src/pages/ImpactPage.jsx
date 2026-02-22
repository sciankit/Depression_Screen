import { Globe2, HeartPulse, ShieldCheck, Users } from 'lucide-react';

const IMPACT_METRICS = [
    { label: 'Communities Monitored', value: '24', note: 'Pilot regions with low-cost wearable access' },
    { label: 'Early Risk Alerts', value: '1,842', note: 'Escalations triggered before crisis threshold' },
    { label: 'Trusted Contact Interventions', value: '612', note: 'Social support prompts accepted by users' },
    { label: 'Median Alert Latency', value: '2.8 min', note: 'From ingestion to intervention recommendation' },
];

const SDG_ALIGNMENT = [
    {
        goal: 'SDG 3: Good Health and Well-being',
        detail: 'Early risk detection for depression and suicidality trend shifts.',
    },
    {
        goal: 'SDG 10: Reduced Inequalities',
        detail: 'Low-cost passive sensing expands access in low-resource settings.',
    },
    {
        goal: 'SDG 17: Partnerships for the Goals',
        detail: 'Databricks-powered analytics + local service escalation pathways.',
    },
];

export default function ImpactPage() {
    return (
        <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '760px', margin: '0 auto 90px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                    Databricks x United Nations
                </h2>
                <h1 className="display" style={{ margin: '10px 0 8px', fontSize: '32px' }}>
                    Population Impact Dashboard
                </h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Program-level monitoring for early prevention outcomes with explicit governance and transparent risk operations.
                </p>
            </header>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {IMPACT_METRICS.map((metric) => (
                    <div key={metric.label} className="card" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{metric.label}</div>
                        <div style={{ marginTop: '6px', fontSize: '26px', fontWeight: 700 }}>{metric.value}</div>
                        <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {metric.note}
                        </div>
                    </div>
                ))}
            </section>

            <section className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe2 size={18} color="var(--color-primary)" />
                    SDG Alignment
                </h3>
                {SDG_ALIGNMENT.map((row) => (
                    <div key={row.goal} style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{row.goal}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{row.detail}</div>
                    </div>
                ))}
            </section>

            <section className="card">
                <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Governance Guardrails</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <ShieldCheck size={16} color="#1f8f5f" />
                        <span>Non-diagnostic positioning with human escalation oversight</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <HeartPulse size={16} color="#d9822b" />
                        <span>Tiered interventions prioritize early behavioral support first</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Users size={16} color="#2A3C4F" />
                        <span>Trusted-contact and local-service pathways require explicit consent</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
