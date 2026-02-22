import {
    AreaChart, Area, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';

const timeline = [
    { day: 'Mon', sleepRegularity: 68, activityStability: 72, stressLoad: 54 },
    { day: 'Tue', sleepRegularity: 63, activityStability: 66, stressLoad: 58 },
    { day: 'Wed', sleepRegularity: 51, activityStability: 49, stressLoad: 74 },
    { day: 'Thu', sleepRegularity: 55, activityStability: 52, stressLoad: 69 },
    { day: 'Fri', sleepRegularity: 64, activityStability: 61, stressLoad: 60 },
    { day: 'Sat', sleepRegularity: 76, activityStability: 79, stressLoad: 44 },
    { day: 'Sun', sleepRegularity: 74, activityStability: 75, stressLoad: 46 },
];

const radar = [
    { metric: 'Sleep', baseline: 78, current: 64 },
    { metric: 'HRV', baseline: 74, current: 59 },
    { metric: 'Steps', baseline: 70, current: 62 },
    { metric: 'Social', baseline: 66, current: 48 },
    { metric: 'Screen', baseline: 52, current: 72 },
];

export default function VizLabPage() {
    return (
        <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '860px', margin: '0 auto 90px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                    Figma Make Challenge
                </h2>
                <h1 className="display" style={{ margin: '10px 0 8px', fontSize: '34px' }}>
                    Creative Data Visualization Lab
                </h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                    Narrative-first views for judges: strain timeline, baseline drift, and intervention opportunity windows.
                </p>
            </header>

            <section className="card" style={{ marginBottom: '14px', padding: '18px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Weekly Strain Storyline</h3>
                <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                        <AreaChart data={timeline}>
                            <defs>
                                <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8FA396" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#8FA396" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#d9822b" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#d9822b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="sleepRegularity" stroke="#58796a" fill="url(#sleepFill)" />
                            <Area type="monotone" dataKey="stressLoad" stroke="#b7601f" fill="url(#stressFill)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div className="card" style={{ padding: '18px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Baseline Drift Radar</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <RadarChart data={radar}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="metric" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Baseline" dataKey="baseline" stroke="#2A3C4F" fill="#2A3C4F" fillOpacity={0.16} />
                                <Radar name="Current" dataKey="current" stroke="#F28C38" fill="#F28C38" fillOpacity={0.28} />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '18px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Intervention Opportunity</h3>
                    <p style={{ marginTop: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        Wednesday and Thursday show the largest divergence from baseline across sleep, social rhythm, and stress markers.
                    </p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px' }}>
                            <strong>Primary Action</strong>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                Mid-week proactive check-in + 20-minute activity block.
                            </div>
                        </div>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px' }}>
                            <strong>Fallback Action</strong>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                Escalate to trusted contact if stress-load remains above 70 for 2 consecutive days.
                            </div>
                        </div>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px' }}>
                            <strong>Success Signal</strong>
                            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                Sleep regularity rebounds above 70 and stress-load drops below 55.
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
