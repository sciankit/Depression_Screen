import { useState, useEffect, useRef } from "react";
import { useGlobalState } from '../GlobalStateProvider';

// ─── Inline CSS ───────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red:    #FF2D2D;
    --red-dk: #C01818;
    --amber:  #FF8C00;
    --bg:     #0A0A0F;
    --panel:  #12121A;
    --border: #1E1E2E;
    --text:   #E8E8F0;
    --muted:  #5A5A7A;
    --mono:   'Space Mono', monospace;
    --sans:   'DM Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    background: var(--panel);
    border: 1px solid var(--red);
    border-radius: 4px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: var(--red);
    animation: pulse-bar 1.4s ease-in-out infinite;
  }
  @keyframes pulse-bar {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  .header-icon {
    width: 48px; height: 48px;
    background: #FF2D2D22;
    border: 1px solid var(--red);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    animation: pulse-ring 1.4s ease-in-out infinite;
  }
  @keyframes pulse-ring {
    0%, 100% { box-shadow: 0 0 0 0 #FF2D2D55; }
    50%       { box-shadow: 0 0 0 10px #FF2D2D00; }
  }
  .header-title { font-family: var(--mono); font-size: 13px; color: var(--red); letter-spacing: 2px; text-transform: uppercase; }
  .header-sub   { font-size: 22px; font-weight: 600; margin-top: 2px; }
  .header-ts    { margin-left: auto; font-family: var(--mono); font-size: 11px; color: var(--muted); text-align: right; line-height: 1.8; }

  /* ── Grid ── */
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }

  /* ── Panel ── */
  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .panel-head {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted);
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); animation: pulse-bar 1.4s infinite; }
  .panel-body { padding: 16px; }

  /* ── PHQ Score Display ── */
  .score-wrap { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
  .score-num {
    font-family: var(--mono); font-size: 72px; font-weight: 700;
    line-height: 1; color: var(--red);
    text-shadow: 0 0 40px #FF2D2D66;
  }
  .score-meta { padding-bottom: 8px; }
  .score-label { font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; font-family: var(--mono); }
  .score-badge {
    display: inline-block;
    padding: 4px 10px;
    background: #FF2D2D22;
    border: 1px solid var(--red);
    border-radius: 2px;
    color: var(--red);
    font-size: 12px; font-weight: 600; font-family: var(--mono);
    letter-spacing: 1px;
  }

  /* ── History Bars ── */
  .history-bars { display: flex; align-items: flex-end; gap: 6px; height: 64px; margin-top: 8px; }
  .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
  .bar-outer { flex: 1; width: 100%; background: #1A1A28; border-radius: 2px; display: flex; align-items: flex-end; overflow: hidden; }
  .bar-inner { width: 100%; border-radius: 2px; transition: height 0.6s ease; }
  .bar-date  { font-family: var(--mono); font-size: 9px; color: var(--muted); }

  /* ── User Info ── */
  .info-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-key { color: var(--muted); font-family: var(--mono); font-size: 11px; letter-spacing: 1px; }
  .info-val { font-weight: 500; }

  /* ── Messages ── */
  .msg-item {
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 10px;
    position: relative;
  }
  .msg-item.high { border-color: #FF2D2D55; background: #FF2D2D08; }
  .msg-item.med  { border-color: #FF8C0055; background: #FF8C0008; }
  .msg-text { font-size: 13px; line-height: 1.6; margin-bottom: 8px; }
  .msg-meta { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--muted); }
  .msg-score { padding: 1px 6px; border-radius: 2px; font-weight: 700; }
  .msg-score.high { color: var(--red);   background: #FF2D2D22; }
  .msg-score.med  { color: var(--amber); background: #FF8C0022; }
  .msg-flags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .flag-tag { font-size: 10px; padding: 2px 7px; border-radius: 2px; background: #FF2D2D15; color: var(--red); border: 1px solid #FF2D2D33; font-family: var(--mono); }

  /* ── Contacts ── */
  .contact-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .contact-item:last-child { border-bottom: none; }
  .contact-avatar {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px;
  }
  .contact-name  { font-weight: 600; font-size: 14px; }
  .contact-role  { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .contact-actions { margin-left: auto; display: flex; gap: 8px; }
  .btn-icon {
    width: 32px; height: 32px; border-radius: 4px;
    background: #1A1A28; border: 1px solid var(--border);
    color: var(--text); font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .btn-icon:hover { background: var(--red); border-color: var(--red); }

  /* ── Notification Log ── */
  .log-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
  .log-item:last-child { border-bottom: none; }
  .log-status { font-family: var(--mono); padding: 2px 8px; border-radius: 2px; font-size: 10px; height: fit-content; flex-shrink: 0; }
  .log-status.sent    { background: #00C87222; color: #00C872; border: 1px solid #00C87244; }
  .log-status.pending { background: #FF8C0022; color: var(--amber); border: 1px solid #FF8C0044; }
  .log-msg  { color: var(--text); line-height: 1.5; }
  .log-time { margin-left: auto; color: var(--muted); font-family: var(--mono); font-size: 10px; white-space: nowrap; padding-left: 12px; }

  /* ── JSON Modal ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: #000000CC; backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 24px;
    animation: fade-in 0.2s ease;
  }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    width: 100%; max-width: 680px;
    background: var(--panel);
    border: 1px solid var(--red);
    border-radius: 4px;
    overflow: hidden;
    animation: slide-up 0.2s ease;
  }
  @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono); font-size: 12px; letter-spacing: 1px;
  }
  .modal-close {
    background: none; border: none; color: var(--muted); font-size: 20px;
    cursor: pointer; line-height: 1; padding: 0 4px;
  }
  .modal-close:hover { color: var(--text); }
  .modal-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
  pre {
    font-family: var(--mono); font-size: 12px; line-height: 1.7;
    color: #A8FFBA; white-space: pre-wrap; word-break: break-all;
  }

  /* ── Action Buttons ── */
  .actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
  .btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 4px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s; font-family: var(--sans);
    letter-spacing: 0.5px;
  }
  .btn-primary { background: var(--red); color: #fff; }
  .btn-primary:hover { background: var(--red-dk); transform: translateY(-1px); }
  .btn-secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--muted); background: #1A1A28; }
  .btn-success { background: #00C87222; color: #00C872; border: 1px solid #00C87244; }

  /* ── Status Banner ── */
  .status-banner {
    padding: 14px 18px; border-radius: 4px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 12px; font-size: 13px;
    animation: fade-in 0.3s ease;
  }
  .status-banner.success { background: #00C87215; border: 1px solid #00C87244; color: #00C872; }
`;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USER = {
    id: "USR-004821",
    name: "Alex M.",
    age: 28,
    assignedClinicianId: "DR-Reyes",
    location: "Chicago, IL",
    enrolled: "2024-09-10",
};

const PHQ_HISTORY = [
    { date: "Jan 28", score: 11 },
    { date: "Feb 04", score: 14 },
    { date: "Feb 11", score: 17 },
    { date: "Feb 18", score: 20 },
    { date: "Feb 21", score: 23 },
];

const CONCERNING_MESSAGES = [
    {
        content: "I don't see any point in continuing. Nothing I do seems to matter.",
        timestamp: "Feb 21, 09:12",
        sentimentScore: -0.94,
        flags: ["hopelessness", "passive-ideation"],
        level: "high",
    },
    {
        content: "I've been isolating myself. Can't bring myself to talk to anyone.",
        timestamp: "Feb 20, 22:45",
        sentimentScore: -0.78,
        flags: ["social-withdrawal"],
        level: "med",
    },
    {
        content: "What would people think if I just disappeared?",
        timestamp: "Feb 20, 19:30",
        sentimentScore: -0.91,
        flags: ["suicidal-ideation", "disappearance"],
        level: "high",
    },
];

const CONTACTS = [
    { name: "Dr. Sofia Reyes", role: "Assigned Clinician", initials: "SR", color: "#7C3AED", bg: "#7C3AED22" },
    { name: "Jordan M.", role: "Emergency Contact · Sibling", initials: "JM", color: "#0EA5E9", bg: "#0EA5E922" },
    { name: "Crisis Line Operator", role: "988 Suicide & Crisis Lifeline", initials: "CL", color: "#10B981", bg: "#10B98122" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildPayload(user, phqHistory, messages) {
    return {
        alertId: `ALERT-${Date.now()}-${user.id}`,
        timestamp: new Date().toISOString(),
        severity: "CRITICAL",
        type: "HIGH_RISK_DEPRESSION_SUICIDAL",
        user: { id: user.id, location: user.location },
        assessment: {
            currentPHQScore: phqHistory.at(-1).score,
            riskLevel: "SEVERE",
            clinicalNote: "PHQ-9 score in severe range (20-27). Immediate clinical intervention required.",
            phqHistory: phqHistory.map((h, i, arr) => ({
                date: h.date,
                score: h.score,
                trend: i > 0 ? (h.score > arr[i - 1].score ? "WORSENING" : "STABLE") : "BASELINE",
            })),
        },
        concerningMessages: messages.map((m) => ({
            timestamp: m.timestamp,
            content: m.content,
            sentimentScore: m.sentimentScore,
            flags: m.flags,
        })),
        recommendedActions: [
            "Immediate welfare check",
            "Direct phone contact by assigned clinician",
            "Notify emergency contact",
            "Engage 988 Crisis Lifeline if unreachable",
        ],
    };
}

function barColor(score) {
    if (score >= 20) return "var(--red)";
    if (score >= 15) return "#FF8C00";
    if (score >= 10) return "#FACC15";
    return "#00C872";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PHQAlertSystem() {
    const { prediction, phqPrediction, ensembleDecision, userName } = useGlobalState();

    const [showModal, setShowModal] = useState(false);
    const [dispatched, setDispatched] = useState(false);
    const [log, setLog] = useState([
        { status: "sent", msg: "Alert logged in clinical system.", time: "09:47" },
        { status: "pending", msg: "Email dispatch to Dr. Sofia Reyes queued.", time: "09:47" },
        { status: "pending", msg: "SMS to Emergency Contact queued.", time: "09:47" },
    ]);

    const phqScoreRaw = phqPrediction?.score ?? phqPrediction?.prediction ?? phqPrediction ?? 0;
    const phqScore = typeof phqScoreRaw === 'string' ? parseFloat(phqScoreRaw) : (typeof phqScoreRaw === 'number' ? phqScoreRaw : 0);
    const currentScore = isNaN(phqScore) ? 0 : Math.round(phqScore);

    const maxScore = 27;
    const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const currentTier = ensembleDecision?.tier || 0;
    const riskBadge = currentTier === 2 ? "SEVERE RISK" : (currentTier === 1 ? "MODERATE RISK" : "STABLE");

    const dynamicHistory = [
        { date: "Jan 28", score: 11 },
        { date: "Feb 04", score: 14 },
        { date: "Feb 11", score: 17 },
        { date: "Feb 18", score: 20 },
        { date: "Today", score: currentScore },
    ];

    let dynamicMessages = [...CONCERNING_MESSAGES];
    if (prediction && prediction.predicted_class !== "stable") {
        dynamicMessages.unshift({
            content: "Real-time NLP flagged conversation.",
            timestamp: now,
            sentimentScore: prediction.confidence ? -(prediction.confidence.toFixed(2)) : -0.85,
            flags: [prediction.predicted_class || "risk-detected"],
            level: currentTier === 2 ? "high" : (currentTier === 1 ? "med" : "low")
        });
    }

    const LOCAL_MOCK_USER = {
        ...MOCK_USER,
        name: userName || MOCK_USER.name,
    };

    const payload = buildPayload(LOCAL_MOCK_USER, dynamicHistory, dynamicMessages);

    function dispatch() {
        setDispatched(true);
        setLog([
            { status: "sent", msg: "CRITICAL alert sent to authority endpoint.", time: "09:48" },
            { status: "sent", msg: "Email dispatched → dr.reyes@clinic.org", time: "09:48" },
            { status: "sent", msg: "SMS dispatched → Jordan M. (+1 312 •••• 7821)", time: "09:48" },
            { status: "sent", msg: "Audit log entry created.", time: "09:48" },
            { status: "sent", msg: "Alert logged in clinical system.", time: "09:47" },
        ]);
    }

    return (
        <>
            <style>{styles}</style>
            <div className="app">

                {/* Header */}
                <div className="header">
                    <div className="header-icon">🚨</div>
                    <div>
                        <div className="header-title">⬤ Critical Mental Health Alert</div>
                        <div className="header-sub">PHQ-9 Severe Risk Detected — Immediate Action Required</div>
                    </div>
                    <div className="header-ts">
                        <div>ALERT ID</div>
                        <div style={{ color: "var(--text)" }}>{payload.alertId.slice(0, 22)}…</div>
                        <div style={{ marginTop: 4 }}>{now}</div>
                    </div>
                </div>

                {dispatched && (
                    <div className="status-banner success">
                        ✅ All notifications dispatched successfully. Clinician and emergency contacts have been alerted.
                    </div>
                )}

                <div className="grid">
                    {/* PHQ Score */}
                    <div className="panel">
                        <div className="panel-head"><span className="dot" />PHQ-9 Assessment</div>
                        <div className="panel-body">
                            <div className="score-wrap">
                                <div className="score-num">{currentScore}</div>
                                <div className="score-meta">
                                    <div className="score-label">Score / 27</div>
                                    <div className="score-badge">{riskBadge}</div>
                                </div>
                            </div>
                            <div className="score-label" style={{ marginBottom: 8 }}>5-Week Trend</div>
                            <div className="history-bars">
                                {dynamicHistory.map((h) => (
                                    <div className="bar-wrap" key={h.date}>
                                        <div className="bar-outer">
                                            <div
                                                className="bar-inner"
                                                style={{ height: `${(h.score / maxScore) * 100}%`, background: barColor(h.score) }}
                                            />
                                        </div>
                                        <div className="bar-date">{h.date.split(" ")[1]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="panel">
                        <div className="panel-head"><span className="dot" />Patient Information</div>
                        <div className="panel-body">
                            {[
                                ["Patient ID", LOCAL_MOCK_USER.id],
                                ["Name", LOCAL_MOCK_USER.name],
                                ["Age", LOCAL_MOCK_USER.age],
                                ["Location", LOCAL_MOCK_USER.location],
                                ["Clinician", LOCAL_MOCK_USER.assignedClinicianId],
                                ["Enrolled", LOCAL_MOCK_USER.enrolled],
                            ].map(([k, v]) => (
                                <div className="info-row" key={k}>
                                    <span className="info-key">{k}</span>
                                    <span className="info-val">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid">
                    {/* Concerning Messages */}
                    <div className="panel">
                        <div className="panel-head"><span className="dot" />Flagged Messages ({dynamicMessages.length})</div>
                        <div className="panel-body">
                            {dynamicMessages.map((m, i) => (
                                <div className={`msg-item ${m.level}`} key={i}>
                                    <div className="msg-text">"{m.content}"</div>
                                    <div className="msg-flags">
                                        {m.flags.map((f) => <span className="flag-tag" key={f}>{f}</span>)}
                                    </div>
                                    <div className="msg-meta">
                                        <span>{m.timestamp}</span>
                                        <span className={`msg-score ${m.level}`}>
                                            Sentiment {m.sentimentScore}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contacts */}
                    <div className="panel">
                        <div className="panel-head"><span className="dot" />Emergency Contacts</div>
                        <div className="panel-body">
                            {CONTACTS.map((c) => (
                                <div className="contact-item" key={c.name}>
                                    <div className="contact-avatar" style={{ background: c.bg, color: c.color }}>
                                        {c.initials}
                                    </div>
                                    <div>
                                        <div className="contact-name">{c.name}</div>
                                        <div className="contact-role">{c.role}</div>
                                    </div>
                                    <div className="contact-actions">
                                        <button className="btn-icon" title="Call">📞</button>
                                        <button className="btn-icon" title="Email">✉️</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Notification Log */}
                        <div style={{ borderTop: "1px solid var(--border)", padding: "0 16px 16px" }}>
                            <div className="panel-head" style={{ padding: "12px 0", border: "none" }}>
                                Notification Log
                            </div>
                            {log.map((l, i) => (
                                <div className="log-item" key={i}>
                                    <span className={`log-status ${l.status}`}>{l.status.toUpperCase()}</span>
                                    <span className="log-msg">{l.msg}</span>
                                    <span className="log-time">{l.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="actions">
                    <button className="btn btn-primary" onClick={dispatch} disabled={dispatched}>
                        {dispatched ? "✅ Dispatched" : "🚨 Dispatch All Alerts Now"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
                        {"{ }"} View JSON Payload
                    </button>
                    {dispatched && (
                        <button className="btn btn-success">📋 Download Audit Report</button>
                    )}
                </div>
            </div>

            {/* JSON Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <span>🔴 ALERT PAYLOAD — JSON</span>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <pre>{JSON.stringify(payload, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
