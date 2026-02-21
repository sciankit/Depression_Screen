import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, Phone, MessageSquare, History, Shield, CheckCircle2, Clock } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const INTERVAL_MS = 15 * 60 * 1000;
const RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
const DEMO_POLL_MS = 8000;

const METRIC_DEFINITIONS = {
    "Heart Rate": {
        color: "#F28C38", // var(--color-primary)
        icon: "♥",
        metrics: {
            "DHRb.cvc": "Daily HR Baseline CV",
            "NHRd.0204.sde": "Nocturnal HR 02–04 SDE",
            "NHR.0204.cv": "Nocturnal HR 02–04 CV",
            "NHR.0406.sd": "Nocturnal HR 04–06 SD",
            "NHR.0406.cv": "Nocturnal HR 04–06 CV",
            "NHR.0002.sd": "Nocturnal HR 00–02 SD",
            "NHR.0002.cv": "Nocturnal HR 00–02 CV",
        },
    },
    "Circadian (Nonparametric)": {
        color: "#2A3C4F", // var(--color-accent)
        icon: "◑",
        metrics: {
            "ISf.stg.wdh": "IS Fragmentation Stage WD",
            "IS.hri.wd": "IS HR Interdaily WD",
            "ACj.st.60mk": "AC Step 60m Key",
            "AC.st.15m": "AC Step 15m",
            "AC.st.30m": "AC Step 30m",
            "AC.st.60m.wd": "AC Step 60m WD",
            "AC.st.15m.wd": "AC Step 15m WD",
            "AC.st.30m.wd": "AC Step 30m WD",
            "AC.hr.60m.wd": "AC HR 60m WD",
            "AC.hr.30m.wd": "AC HR 30m WD",
            "ICVl.st.wd": "ICV Step WD (log)",
            "ICV.hr": "ICV HR",
            "ICV.hr.wd": "ICV HR WD",
            "peaks.st": "Step Activity Peaks",
            "peaks.st.wd": "Step Activity Peaks WD",
        },
    },
    "Circadian (Cosinor)": {
        color: "#8FA396", // Soft green
        icon: "∿",
        metrics: {
            "acrom.st": "Acrophase Steps",
            "F.st.wd": "F-stat Steps WD",
            "beta.hr": "Beta HR",
            "acro.hr": "Acrophase HR",
            "F.hr": "F-stat HR",
            "beta.hr.wd": "Beta HR WD",
            "acro.hr.wd": "Acrophase HR WD",
            "F.hr.wd": "F-stat HR WD",
        },
    },
    "Sleep": {
        color: "#F6C244", // var(--color-secondary)
        icon: "☽",
        metrics: {
            "sleep.offset": "Sleep Offset",
            "sleep.midpoint": "Sleep Midpoint",
            "sleep.offset.wd": "Sleep Offset WD",
            "sleep.offset.wd.sd": "Sleep Offset WD SD",
            "sleep.midpoint.wd": "Sleep Midpoint WD",
            "sleep.midpoint.wd.sd": "Sleep Midpoint WD SD",
        },
    },
};

// ─── Simulation helpers ────────────────────────────────────────────────────
function simulateHealthConnectData() {
    const result = {};
    for (const group of Object.values(METRIC_DEFINITIONS)) {
        for (const key of Object.keys(group.metrics)) {
            result[key] = +(Math.random() * 2).toFixed(4);
        }
    }
    return result;
}

function simulateCallLogs(count = 3) {
    const contacts = ["Mom", "Dr. Smith", "Alex", "Unknown", "Work"];
    const types = ["incoming", "outgoing", "missed"];
    return Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        contact: contacts[Math.floor(Math.random() * contacts.length)],
        type: types[Math.floor(Math.random() * types.length)],
        duration: Math.floor(Math.random() * 600),
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
}

function simulateSmsLogs(count = 3) {
    const contacts = ["Mom", "Dr. Smith", "Alex", "Unknown", "Work"];
    const directions = ["sent", "received"];
    const messages = [
        "See you at 3pm",
        "Don't forget your meds",
        "How are you feeling today?",
        "Reminder: appointment tomorrow",
        "Ok, heading out now",
    ];
    return Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i + 1000,
        contact: contacts[Math.floor(Math.random() * contacts.length)],
        direction: directions[Math.floor(Math.random() * directions.length)],
        snippet: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
}

function pruneOldEntries(entries) {
    const cutoff = Date.now() - RETENTION_MS;
    return entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);
}

// ─── Formatters ────────────────────────────────────────────────────────────
function fmtDuration(s) {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}
function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(iso) {
    const d = new Date(iso);
    return (
        d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
}

const PERMISSIONS = [
    { key: "healthConnect", label: "Health Connect", granted: true },
    { key: "heartRate", label: "Heart Rate Data", granted: true },
    { key: "activity", label: "Activity / Steps", granted: true },
    { key: "sleep", label: "Sleep Data", granted: true },
    { key: "sms", label: "Read SMS Messages", granted: true },
    { key: "callLog", label: "Call Log Access", granted: true },
];

// ─── Main App ──────────────────────────────────────────────────────────────
export default function CollectorPage() {
    const [tab, setTab] = useState("metrics");
    const [latestMetrics, setLatestMetrics] = useState(null);
    const [callLogs, setCallLogs] = useState([]);
    const [smsLogs, setSmsLogs] = useState([]);
    const [history, setHistory] = useState([]);
    const [countdown, setCountdown] = useState(DEMO_POLL_MS / 1000);
    const [isCollecting, setIsCollecting] = useState(false);
    const [lastCollected, setLastCollected] = useState(null);
    const countdownRef = useRef(null);

    const collect = useCallback(() => {
        setIsCollecting(true);
        setTimeout(() => {
            const ts = new Date().toISOString();
            const metrics = simulateHealthConnectData();
            const calls = simulateCallLogs(Math.floor(Math.random() * 3) + 1);
            const sms = simulateSmsLogs(Math.floor(Math.random() * 3) + 1);

            setLatestMetrics(metrics);
            setCallLogs((prev) => pruneOldEntries([...calls, ...prev]));
            setSmsLogs((prev) => pruneOldEntries([...sms, ...prev]));
            setHistory((prev) =>
                pruneOldEntries([
                    { timestamp: ts, metricCount: Object.keys(metrics).length, callCount: calls.length, smsCount: sms.length },
                    ...prev,
                ])
            );
            setLastCollected(ts);
            setIsCollecting(false);
        }, 600);
    }, []);

    useEffect(() => {
        collect();
        const iv = setInterval(() => { collect(); setCountdown(DEMO_POLL_MS / 1000); }, DEMO_POLL_MS);
        return () => clearInterval(iv);
    }, [collect]);

    useEffect(() => {
        setCountdown(DEMO_POLL_MS / 1000);
        countdownRef.current = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(countdownRef.current);
    }, [lastCollected]);

    const tabs = [
        { id: 'metrics', icon: Activity, label: 'Metrics' },
        { id: 'calls', icon: Phone, label: 'Calls' },
        { id: 'sms', icon: MessageSquare, label: 'SMS' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'permissions', icon: Shield, label: 'Perms' },
    ];

    return (
        <div className="animate-fade-in" style={{ padding: '24px 24px 40px', maxWidth: '600px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '14px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                    Background Telemetry
                </h2>
                <h1 className="display" style={{ fontSize: '30px', margin: 0, lineHeight: 1.2 }}>
                    BioHealth Collector
                </h1>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(42, 60, 79, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: isCollecting ? '#F28C38' : '#8FA396',
                            boxShadow: isCollecting ? '0 0 10px rgba(242, 140, 56, 0.6)' : 'none',
                            transition: 'background 0.3s'
                        }} />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{isCollecting ? "Syncing now..." : "Active Collector"}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                {lastCollected ? `Last updated: ${fmtTime(lastCollected)}` : "Waiting for first sync"}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <Clock size={14} /> 00:0{countdown}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Next automated ping</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }}>
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            borderRadius: '20px',
                            border: `1px solid ${tab === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: tab === t.id ? 'var(--color-bg-alt)' : 'var(--color-bg-card)',
                            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: 500,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ minHeight: '400px' }}>
                {/* ── METRICS ── */}
                {tab === "metrics" && (
                    !latestMetrics ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Waiting for first collection…</div> :
                        Object.entries(METRIC_DEFINITIONS).map(([groupName, group]) => (
                            <div key={groupName} className="card" style={{ marginBottom: '16px', padding: '0', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--color-bg-active)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '18px', color: group.color }}>{group.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>{groupName}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{Object.keys(group.metrics).length} streams</span>
                                </div>
                                <div style={{ padding: '8px 0' }}>
                                    {Object.entries(group.metrics).map(([key, label]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #F5EBE0' }}>
                                            <div style={{ flex: 1, paddingRight: '12px' }}>
                                                <div style={{ fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '2px' }}>{label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{key}</div>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: group.color, display: 'flex', alignItems: 'center' }}>
                                                {latestMetrics[key] !== undefined ? latestMetrics[key].toFixed(4) : "—"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                )}

                {/* ── CALLS ── */}
                {tab === "calls" && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: 'var(--color-bg-active)', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '15px' }}>Communication Log (Calls)</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>{callLogs.length} entries gathered</p>
                        </div>
                        {callLogs.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No call logs yet</div> :
                            callLogs.map((c, idx) => (
                                <div key={c.id} style={{ padding: '16px 20px', borderBottom: idx < callLogs.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                        <Phone size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.contact}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                                            {c.type.charAt(0).toUpperCase() + c.type.slice(1)} • {c.type !== "missed" && fmtDuration(c.duration)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{fmtTime(c.timestamp)}</div>
                                </div>
                            ))}
                    </div>
                )}

                {/* ── SMS ── */}
                {tab === "sms" && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: 'var(--color-bg-active)', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '15px' }}>Communication Log (SMS)</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>{smsLogs.length} entries gathered</p>
                        </div>
                        {smsLogs.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No SMS logs yet</div> :
                            smsLogs.map((m, idx) => (
                                <div key={m.id} style={{ padding: '16px 20px', borderBottom: idx < smsLogs.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                                        <MessageSquare size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.contact} <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', fontSize: '13px' }}>({m.direction})</span></div>
                                        <div style={{ color: 'var(--color-text-main)', fontSize: '14px', marginTop: '4px', background: 'var(--color-bg-alt)', padding: '8px 12px', borderRadius: '0 12px 12px 12px', display: 'inline-block' }}>
                                            "{m.snippet}"
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{fmtTime(m.timestamp)}</div>
                                </div>
                            ))}
                    </div>
                )}

                {/* ── HISTORY ── */}
                {tab === "history" && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: 'var(--color-bg-active)', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '15px' }}>Synchronization History</h3>
                        </div>
                        {history.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No history yet</div> :
                            history.map((h, i) => (
                                <div key={i} style={{ padding: '16px 20px', borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main)' }}>{fmtDateTime(h.timestamp)}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                            Gathered {h.metricCount} signals
                                        </div>
                                    </div>
                                    <CheckCircle2 color="var(--color-primary)" size={20} />
                                </div>
                            ))}
                    </div>
                )}

                {/* ── PERMISSIONS ── */}
                {tab === "permissions" && (
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '8px' }}>Active Connections</h3>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                            Your device signals are currently being processed locally.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {PERMISSIONS.map((p) => (
                                <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', color: 'var(--color-primary)', background: '#FCECDD', padding: '4px 10px', borderRadius: '12px' }}>
                                        {p.granted ? "CONNECTED" : "OFF"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
