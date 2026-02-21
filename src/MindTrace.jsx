import { useState, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

// ── CONFIG ──────────────────────────────────────────────────────────────────
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const sleepData = [
  { day: "Mon", hours: 7.2 }, { day: "Tue", hours: 6.5 },
  { day: "Wed", hours: 5.8 }, { day: "Thu", hours: 6.1 },
  { day: "Fri", hours: 7.5 }, { day: "Sat", hours: 8.1 },
  { day: "Sun", hours: 6.9 },
];

const heartRateData = [
  { day: "Mon", hrv: 58 }, { day: "Tue", hrv: 54 },
  { day: "Wed", hrv: 49 }, { day: "Thu", hrv: 51 },
  { day: "Fri", hrv: 55 }, { day: "Sat", hrv: 62 },
  { day: "Sun", hrv: 60 },
];

const stepsData = [
  { day: "Mon", steps: 8200 }, { day: "Tue", steps: 6100 },
  { day: "Wed", steps: 4300 }, { day: "Thu", steps: 5500 },
  { day: "Fri", steps: 7800 }, { day: "Sat", steps: 9200 },
  { day: "Sun", steps: 6600 },
];

const phqData = [
  { day: "Mon", score: 4 }, { day: "Tue", score: 5 },
  { day: "Wed", score: 8 }, { day: "Thu", score: 6 },
  { day: "Fri", score: 4 }, { day: "Sat", score: 2 },
  { day: "Sun", score: 3 },
];

const INSIGHT_TEXT =
  "Here's your weekly wellbeing summary. Your sleep averaged 6.9 hours, " +
  "with a noticeable dip mid-week on Wednesday to just 5.8 hours. " +
  "Your estimated PHQ-9 depression severity score also peaked on Wednesday at 8 (mild depression), " +
  "aligning with the drop in your heart rate variability to 49 and step count to 4,300. " +
  "The good news is that all signals, including your mood, " +
  "recovered strongly by Saturday and Sunday. " +
  "Consider protecting your Wednesday schedule — that day consistently shows " +
  "the most strain across your behavioral signals.";

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #e2ddd6",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 12,
        color: "#3d3530",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ color: "#7c6f64" }}>{payload[0].value}{unit}</div>
      </div>
    );
  }
  return null;
};

// ── CHART CARD ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children }) => (
  <div style={{
    background: "#fff",
    border: "1px solid #e8e3db",
    borderRadius: 16,
    padding: "24px 24px 16px",
    flex: 1,
    minWidth: 260,
  }}>
    <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#2c2420", letterSpacing: "-0.2px" }}>
      {title}
    </div>
    <div style={{ marginBottom: 20, fontSize: 11, color: "#a89e94" }}>{subtitle}</div>
    {children}
  </div>
);

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function MindTrace() {
  const [status, setStatus] = useState("idle"); // idle | loading | playing | error
  const audioRef = useRef(null);

  const speakInsight = async () => {
    if (status === "loading" || status === "playing") return;
    setStatus("loading");

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: INSIGHT_TEXT,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.2 },
          }),
        }
      );

      if (!res.ok) throw new Error("ElevenLabs API error");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setStatus("playing");
      audio.play();
      audio.onended = () => setStatus("idle");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus("idle");
  };

  const btnLabel = {
    idle: "▶  Hear Weekly Summary",
    loading: "Generating audio…",
    playing: "■  Stop",
    error: "Something went wrong",
  }[status];

  const btnColor = status === "error" ? "#c0392b" : status === "playing" ? "#5a4a3a" : "#2c2420";

  return (
    <div style={{
      padding: "24px 24px 40px",
      maxWidth: "600px",
      margin: "0 auto",
    }}>

      {/* Styles */}
      <style>{`
        .recharts-cartesian-axis-tick-value { font-size: 11px; fill: #a89e94; }
        .recharts-cartesian-grid line { stroke: #f0ebe3; }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6; }
          70% { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#b0a498", textTransform: "uppercase", marginBottom: 8 }}>
          Weekly Report · Feb 15 – 21, 2026
        </div>
        <h1 className="display" style={{ fontSize: 32, fontWeight: 500, color: "#1e1712", letterSpacing: "-0.5px", margin: 0 }}>
          Your Wellbeing at a Glance
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#8a7d74", lineHeight: 1.6, maxWidth: 520 }}>
          Passive signals from your wearable and phone, summarized for the week.
          Mid-week showed strain — the weekend brought recovery.
        </p>
      </div>

      {/* Charts */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto 40px",
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <ChartCard title="Sleep Duration" subtitle="Hours per night">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sleepData} barSize={20}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip unit="h" />} />
              <Bar dataKey="hours" fill="#c9b99a" radius={[4, 4, 0, 0]}
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Heart Rate Variability" subtitle="ms — higher is better">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={heartRateData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[40, 70]} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip unit="ms" />} />
              <Line
                type="monotone" dataKey="hrv"
                stroke="#7e9e8a" strokeWidth={2.5}
                dot={{ fill: "#7e9e8a", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#5a8068" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Steps" subtitle="Step count">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={stepsData} barSize={20}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 12000]} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip unit=" steps" />} />
              <Bar dataKey="steps" fill="#a8b8c8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Depression Score (Estimated)" subtitle="PHQ-9 — lower is better">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={phqData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 27]} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip unit=" pts" />} />
              <Line
                type="monotone" dataKey="score"
                stroke="#d98971" strokeWidth={2.5}
                dot={{ fill: "#d98971", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#b96951" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Insight text */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto 40px",
        background: "#fff",
        border: "1px solid #e8e3db",
        borderRadius: 16,
        padding: "24px 28px",
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b0a498", marginBottom: 10 }}>
          Weekly Insight
        </div>
        <p className="display" style={{ fontSize: 16, color: "#3d3530", lineHeight: 1.8, margin: 0, fontWeight: 400 }}>
          {INSIGHT_TEXT}
        </p>
      </div>

      {/* ElevenLabs Voice Button */}
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          {status === "playing" && (
            <span style={{
              position: "absolute",
              width: "100%", height: "100%",
              borderRadius: 50,
              background: "#2c2420",
              animation: "pulse-ring 1.8s ease-out infinite",
              pointerEvents: "none",
            }} />
          )}
          <button
            onClick={status === "playing" ? stopAudio : speakInsight}
            disabled={status === "loading"}
            style={{
              position: "relative",
              background: btnColor,
              color: "#f7f4ef",
              border: "none",
              borderRadius: 50,
              padding: "14px 28px",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.03em",
              cursor: status === "loading" ? "default" : "pointer",
              transition: "background 0.2s, transform 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            {status === "loading" && (
              <span style={{
                width: 12, height: 12,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {btnLabel}
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#b0a498", lineHeight: 1.5 }}>
          Powered by <span style={{ color: "#7c6f64", fontWeight: 500 }}>ElevenLabs</span>
          <br />Calm, natural voice summary
        </div>
      </div>

    </div>
  );
}
