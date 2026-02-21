import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────
const INTERVAL_MS = 15 * 60 * 1000;
const RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
const DEMO_POLL_MS = 8000;

const METRIC_DEFINITIONS = {
  "Heart Rate": {
    color: "#ef4444",
    icon: "♥",
    metrics: {
      "DHRb.cvc":       "Daily HR Baseline CV",
      "NHRd.0204.sde":  "Nocturnal HR 02–04 SDE",
      "NHR.0204.cv":    "Nocturnal HR 02–04 CV",
      "NHR.0406.sd":    "Nocturnal HR 04–06 SD",
      "NHR.0406.cv":    "Nocturnal HR 04–06 CV",
      "NHR.0002.sd":    "Nocturnal HR 00–02 SD",
      "NHR.0002.cv":    "Nocturnal HR 00–02 CV",
    },
  },
  "Circadian (Nonparametric)": {
    color: "#6366f1",
    icon: "◑",
    metrics: {
      "ISf.stg.wdh":  "IS Fragmentation Stage WD",
      "IS.hri.wd":    "IS HR Interdaily WD",
      "ACj.st.60mk":  "AC Step 60m Key",
      "AC.st.15m":    "AC Step 15m",
      "AC.st.30m":    "AC Step 30m",
      "AC.st.60m.wd": "AC Step 60m WD",
      "AC.st.15m.wd": "AC Step 15m WD",
      "AC.st.30m.wd": "AC Step 30m WD",
      "AC.hr.60m.wd": "AC HR 60m WD",
      "AC.hr.30m.wd": "AC HR 30m WD",
      "ICVl.st.wd":   "ICV Step WD (log)",
      "ICV.hr":       "ICV HR",
      "ICV.hr.wd":    "ICV HR WD",
      "peaks.st":     "Step Activity Peaks",
      "peaks.st.wd":  "Step Activity Peaks WD",
    },
  },
  "Circadian (Cosinor)": {
    color: "#10b981",
    icon: "∿",
    metrics: {
      "acrom.st":    "Acrophase Steps",
      "F.st.wd":     "F-stat Steps WD",
      "beta.hr":     "Beta HR",
      "acro.hr":     "Acrophase HR",
      "F.hr":        "F-stat HR",
      "beta.hr.wd":  "Beta HR WD",
      "acro.hr.wd":  "Acrophase HR WD",
      "F.hr.wd":     "F-stat HR WD",
    },
  },
  "Sleep": {
    color: "#8b5cf6",
    icon: "☽",
    metrics: {
      "sleep.offset":        "Sleep Offset",
      "sleep.midpoint":      "Sleep Midpoint",
      "sleep.offset.wd":     "Sleep Offset WD",
      "sleep.offset.wd.sd":  "Sleep Offset WD SD",
      "sleep.midpoint.wd":   "Sleep Midpoint WD",
      "sleep.midpoint.wd.sd":"Sleep Midpoint WD SD",
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

// ─── Styles ────────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: "'DM Mono', 'Courier New', monospace",
    background: "#0a0a0f",
    color: "#e2e8f0",
    minHeight: "100vh",
  },
  header: {
    borderBottom: "1px solid #1e293b",
    padding: "20px 24px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: "#0a0a0f",
    zIndex: 100,
  },
  appName: {
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.15em",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statusDot: (active) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: active ? "#10b981" : "#ef4444",
    marginRight: 8,
    boxShadow: active ? "0 0 6px #10b981" : "none",
    animation: active ? "pulse 2s infinite" : "none",
  }),
  statusText: {
    fontSize: "11px",
    color: "#64748b",
    letterSpacing: "0.05em",
  },
  countdown: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "700",
    letterSpacing: "0.05em",
  },
  tabs: {
    display: "flex",
    gap: 2,
    padding: "12px 24px 0",
    borderBottom: "1px solid #1e293b",
  },
  tab: (active) => ({
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "8px 16px",
    color: active ? "#10b981" : "#475569",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #10b981" : "2px solid transparent",
    transition: "all 0.15s",
  }),
  content: {
    padding: "16px 24px 40px",
    maxWidth: 720,
  },
  sectionHeader: (color) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: `1px solid ${color}22`,
  }),
  sectionIcon: (color) => ({
    fontSize: 16,
    color,
    width: 24,
    textAlign: "center",
  }),
  sectionTitle: (color) => ({
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.18em",
    color,
    textTransform: "uppercase",
  }),
  sectionCount: {
    fontSize: "10px",
    color: "#334155",
    marginLeft: "auto",
    letterSpacing: "0.05em",
  },
  metricRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "1px solid #111827",
    gap: 12,
  },
  metricKey: {
    fontSize: "11px",
    color: "#94a3b8",
    fontFamily: "'DM Mono', monospace",
    minWidth: 140,
    flexShrink: 0,
  },
  metricLabel: {
    fontSize: "11px",
    color: "#475569",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metricValue: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', monospace",
    minWidth: 70,
    textAlign: "right",
  },
  logCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #111827",
  },
  logIcon: (color) => ({
    width: 28,
    height: 28,
    borderRadius: 6,
    background: `${color}18`,
    border: `1px solid ${color}33`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color,
    flexShrink: 0,
  }),
  logContact: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#e2e8f0",
  },
  logMeta: {
    fontSize: "10px",
    color: "#475569",
    marginTop: 2,
  },
  logTime: {
    fontSize: "10px",
    color: "#334155",
    marginLeft: "auto",
    flexShrink: 0,
  },
  badge: (color) => ({
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color,
    border: `1px solid ${color}44`,
    borderRadius: 3,
    padding: "1px 5px",
    marginRight: 4,
  }),
  noData: {
    padding: "40px 0",
    textAlign: "center",
    color: "#334155",
    fontSize: "12px",
    letterSpacing: "0.05em",
  },
  historyEntry: {
    padding: "10px 0",
    borderBottom: "1px solid #111827",
  },
  historyTime: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "700",
    marginBottom: 4,
  },
  historyStats: {
    fontSize: "10px",
    color: "#475569",
  },
  permBox: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "14px 16px",
    marginTop: 20,
    marginBottom: 4,
  },
  permTitle: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 10,
  },
  permRow: (granted) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 0",
    fontSize: "11px",
    color: granted ? "#94a3b8" : "#374151",
  }),
  permStatus: (granted) => ({
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.1em",
    color: granted ? "#10b981" : "#ef4444",
    border: `1px solid ${granted ? "#10b98133" : "#ef444433"}`,
    borderRadius: 3,
    padding: "1px 6px",
  }),
};

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
  { key: "healthConnect", label: "Health Connect",   granted: true },
  { key: "heartRate",    label: "Heart Rate Data",   granted: true },
  { key: "activity",     label: "Activity / Steps",  granted: true },
  { key: "sleep",        label: "Sleep Data",         granted: true },
  { key: "sms",          label: "Read SMS Messages",  granted: true },
  { key: "callLog",      label: "Call Log Access",    granted: true },
];

// ─── Main App ──────────────────────────────────────────────────────────────
export default function BiohealthCollector() {
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
        .mrow { animation: fadeIn 0.3s ease both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>
      <div style={S.root}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.appName}>BioHealth Collector</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center" }}>
              <span style={S.statusDot(!isCollecting)} />
              <span style={S.statusText}>
                {isCollecting ? "Collecting…" : lastCollected ? `Last: ${fmtTime(lastCollected)}` : "Waiting"}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={S.countdown}>
              {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
            </div>
            <div style={{ ...S.statusText, marginTop: 2 }}>next poll (demo: 8s)</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {["metrics", "calls", "sms", "history", "permissions"].map((t) => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div style={S.content}>

          {/* ── METRICS ── */}
          {tab === "metrics" && (
            !latestMetrics ? <div style={S.noData}>Waiting for first collection…</div> :
            Object.entries(METRIC_DEFINITIONS).map(([groupName, group]) => (
              <div key={groupName}>
                <div style={S.sectionHeader(group.color)}>
                  <span style={S.sectionIcon(group.color)}>{group.icon}</span>
                  <span style={S.sectionTitle(group.color)}>{groupName}</span>
                  <span style={S.sectionCount}>{Object.keys(group.metrics).length} metrics</span>
                </div>
                {Object.entries(group.metrics).map(([key, label]) => (
                  <div key={key} className="mrow" style={S.metricRow}>
                    <span style={S.metricKey}>{key}</span>
                    <span style={S.metricLabel}>{label}</span>
                    <span style={S.metricValue}>
                      {latestMetrics[key] !== undefined ? latestMetrics[key].toFixed(4) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* ── CALLS ── */}
          {tab === "calls" && (<>
            <div style={S.sectionHeader("#f59e0b")}>
              <span style={S.sectionIcon("#f59e0b")}>✆</span>
              <span style={S.sectionTitle("#f59e0b")}>Call Logs</span>
              <span style={S.sectionCount}>{callLogs.length} entries · 2-day window</span>
            </div>
            {callLogs.length === 0 ? <div style={S.noData}>No call logs yet</div> :
              callLogs.map((c) => {
                const color = c.type === "missed" ? "#ef4444" : c.type === "incoming" ? "#10b981" : "#6366f1";
                const icon  = c.type === "missed" ? "✗" : c.type === "incoming" ? "↙" : "↗";
                return (
                  <div key={c.id} className="mrow" style={S.logCard}>
                    <div style={S.logIcon(color)}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.logContact}>{c.contact}</div>
                      <div style={S.logMeta}>
                        <span style={S.badge(color)}>{c.type}</span>
                        {c.type !== "missed" && fmtDuration(c.duration)}
                      </div>
                    </div>
                    <div style={S.logTime}>{fmtTime(c.timestamp)}</div>
                  </div>
                );
              })}
          </>)}

          {/* ── SMS ── */}
          {tab === "sms" && (<>
            <div style={S.sectionHeader("#a78bfa")}>
              <span style={S.sectionIcon("#a78bfa")}>✉</span>
              <span style={S.sectionTitle("#a78bfa")}>SMS Messages</span>
              <span style={S.sectionCount}>{smsLogs.length} entries · 2-day window</span>
            </div>
            {smsLogs.length === 0 ? <div style={S.noData}>No SMS logs yet</div> :
              smsLogs.map((m) => {
                const color = m.direction === "sent" ? "#6366f1" : "#a78bfa";
                return (
                  <div key={m.id} className="mrow" style={S.logCard}>
                    <div style={S.logIcon(color)}>{m.direction === "sent" ? "→" : "←"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.logContact}>{m.contact}</div>
                      <div style={S.logMeta}>
                        <span style={S.badge(color)}>{m.direction}</span>
                        <span style={{ color: "#64748b" }}>{m.snippet}</span>
                      </div>
                    </div>
                    <div style={S.logTime}>{fmtTime(m.timestamp)}</div>
                  </div>
                );
              })}
          </>)}

          {/* ── HISTORY ── */}
          {tab === "history" && (<>
            <div style={S.sectionHeader("#10b981")}>
              <span style={S.sectionIcon("#10b981")}>≡</span>
              <span style={S.sectionTitle("#10b981")}>Collection History</span>
              <span style={S.sectionCount}>{history.length} runs · 2-day window</span>
            </div>
            {history.length === 0 ? <div style={S.noData}>No history yet</div> :
              history.map((h, i) => (
                <div key={i} className="mrow" style={S.historyEntry}>
                  <div style={S.historyTime}>{fmtDateTime(h.timestamp)}</div>
                  <div style={S.historyStats}>
                    {h.metricCount} metrics · {h.callCount} calls · {h.smsCount} SMS
                  </div>
                </div>
              ))}
          </>)}

          {/* ── PERMISSIONS ── */}
          {tab === "permissions" && (<>
            <div style={S.sectionHeader("#64748b")}>
              <span style={S.sectionIcon("#64748b")}>⚿</span>
              <span style={S.sectionTitle("#64748b")}>Permissions</span>
            </div>
            <div style={S.permBox}>
              <div style={S.permTitle}>Required Permissions</div>
              {PERMISSIONS.map((p) => (
                <div key={p.key} style={S.permRow(p.granted)}>
                  <span>{p.label}</span>
                  <span style={S.permStatus(p.granted)}>{p.granted ? "GRANTED" : "DENIED"}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, fontSize: "11px", color: "#334155", lineHeight: "1.7" }}>
              <div style={{ color: "#64748b", fontWeight: 700, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Android Manifest Keys
              </div>
              {[
                "android.permission.health.READ_HEART_RATE",
                "android.permission.health.READ_STEPS",
                "android.permission.health.READ_SLEEP",
                "android.permission.READ_CALL_LOG",
                "android.permission.READ_SMS",
              ].map((p) => (
                <div key={p} style={{ padding: "3px 0", borderBottom: "1px solid #111827" }}>{p}</div>
              ))}
            </div>
          </>)}

        </div>
      </div>
    </>
  );
}
