
const CONCERNING_MESSAGES = [
    {
        content: "I don't see any point in continuing. Nothing I do seems to matter.",
        timestamp: "Feb 22, 00:11",
        sentimentScore: 0.989,
        flags: ["suicide"],
        level: "high",
    },
    {
        content: "I've not been feeling like myself lately. I feel like I'm losing interest in things I used to enjoy.",
        timestamp: "Feb 22, 00:10",
        sentimentScore: 0.92,
        flags: ["depression"],
        level: "moderate",
    },
    {
        content: "I don't have the energy to do anything. I just want to sleep all day.",
        timestamp: "Feb 22, 00:09",
        sentimentScore: 0.74,
        flags: ["depression"],
        level: "moderate",
    }
];

export default function ExplainabilityPanel() {

    return (
        <section className="card" style={{ margin: '0 0 24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">🔍</span>Signals Behind Your Week</h3>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                A plain-language breakdown of which patterns shaped your current support level.
            </p>

            <h4 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px', color: 'var(--color-text)' }}>
                Recent Flagged Interactions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {CONCERNING_MESSAGES.map((msg, idx) => (
                    <div key={idx} style={{
                        padding: '12px',
                        border: `1px solid ${msg.level === 'high' ? 'rgba(255, 45, 45, 0.4)' : 'rgba(255, 140, 0, 0.4)'}`,
                        borderRadius: '8px',
                        background: msg.level === 'high' ? 'rgba(255, 45, 45, 0.05)' : 'rgba(255, 140, 0, 0.05)'
                    }}>
                        <div style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>
                            "{msg.content}"
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            <span>{msg.timestamp}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {msg.flags.map(flag => (
                                    <span key={flag} style={{
                                        background: msg.level === 'high' ? 'rgba(255, 45, 45, 0.15)' : 'rgba(255, 140, 0, 0.15)',
                                        color: msg.level === 'high' ? 'var(--color-danger)' : 'var(--color-warning)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                    }}>
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
