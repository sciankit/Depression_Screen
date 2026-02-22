import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--surface-strong)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 12,
        color: "var(--color-ink)",
        boxShadow: "var(--card-shadow)",
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ color: "var(--color-muted)" }}>{payload[0].value}{unit}</div>
      </div>
    );
  }
  return null;
};

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{
    background: "var(--surface-strong)",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    padding: "24px 24px 16px",
    flex: 1,
    minWidth: 260,
  }}>
    <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--color-ink)", letterSpacing: "-0.2px" }}>
      {title}
    </div>
    <div style={{ marginBottom: 20, fontSize: 11, color: "var(--color-muted)" }}>{subtitle}</div>
    {children}
  </div>
);

export default function MindTrace() {
  return (
    <section style={{
      padding: "24px 0 16px",
      maxWidth: "860px",
      margin: "0 auto",
    }}>
      <style>{`
        .recharts-cartesian-axis-tick-value { font-size: 11px; fill: var(--color-muted); }
        .recharts-cartesian-grid line { stroke: var(--color-border); }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto 24px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--color-muted)", textTransform: "uppercase", marginBottom: 8 }}>
          Weekly Report · Feb 15 – 21, 2026
        </div>
        <h1 className="display" style={{ fontSize: 32, fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.5px", margin: 0 }}>
          Your Wellbeing at a Glance
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--color-muted)", lineHeight: 1.6, maxWidth: 520 }}>
          Passive signals from your wearable and phone, summarized for the week.
          Mid-week showed strain, then weekend recovery.
        </p>
      </div>

      <div style={{
        maxWidth: 900,
        margin: "0 auto",
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
              <Bar dataKey="hours" fill="var(--chart-sleep)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Heart Rate Variability" subtitle="ms - higher is better">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={heartRateData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[40, 70]} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip unit="ms" />} />
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="var(--chart-hrv)"
                strokeWidth={2.5}
                dot={{ fill: "var(--chart-hrv)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--chart-hrv-strong)" }}
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
              <Bar dataKey="steps" fill="var(--chart-steps)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Depression Score (Estimated)" subtitle="PHQ-9 - lower is better">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={phqData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis domain={[0, 27]} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip unit=" pts" />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-phq)"
                strokeWidth={2.5}
                dot={{ fill: "var(--chart-phq)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--chart-phq-strong)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
