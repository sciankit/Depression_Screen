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
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">🔍</span>Signals Behind Your Week</h3>
            <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                A plain-language breakdown of which patterns shaped your current support level.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
            }}>
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Predicted Class</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{prediction?.predicted_class || 'Pending'}</div>
                </div>
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Confidence</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}%` : 'Pending'}
                    </div>
                </div>
                <div style={{
                    background: 'var(--surface)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(180, 140, 100, 0.04)',
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Intervention Tier</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{interventionPlan?.label || 'Pending'}</div>
                </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="signal" angle={-15} textAnchor="end" height={60} interval={0} />
                        <YAxis unit="%" />
                        <Tooltip formatter={(value) => [`${value}%`, 'Importance']} />
                        <Bar dataKey="importance" fill="var(--chart-neutral)" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
