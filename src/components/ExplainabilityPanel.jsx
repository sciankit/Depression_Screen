import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useGlobalState } from '../GlobalStateProvider';

export default function ExplainabilityPanel() {
    const { explainability, interventionPlan, prediction } = useGlobalState();
    const data = explainability.map((row) => ({
        signal: row.name.length > 24 ? `${row.name.slice(0, 24)}...` : row.name,
        importance: Number((row.effect * 100).toFixed(1)),
    }));

    return (
        <section className="card" style={{ margin: '0 0 24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Signals Behind Your Week</h3>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                A plain-language breakdown of which patterns shaped your current support level.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
            }}>
                <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Predicted Class</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{prediction?.predicted_class || 'Pending'}</div>
                </div>
                <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Confidence</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>
                        {prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : 'Pending'}
                    </div>
                </div>
                <div style={{ background: 'var(--color-bg)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Intervention Tier</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{interventionPlan?.label || 'Pending'}</div>
                </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="signal" angle={-15} textAnchor="end" height={60} interval={0} />
                        <YAxis unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, 'Importance']} />
                        <Bar dataKey="importance" fill="#2A3C4F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
