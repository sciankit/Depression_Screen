import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  LineChart as LineChartIcon,
  ShieldCheck,
} from 'lucide-react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useGlobalState } from '../GlobalStateProvider';
import { CRISIS_RESOURCES, RISK_TIERS } from '../riskUtils';
import {
  SCREENING_QUESTIONS,
  applyAnswer,
  buildActionPlan,
  initialScreeningState,
  summarizeScreening,
} from '../screening/adaptiveEngine';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildUserTrend(baseTier) {
  const baseRisk = [30, 34, 41, 44, 39, 31, 29];
  const uplift = baseTier === 2 ? 24 : baseTier === 1 ? 12 : 0;

  return baseRisk.map((risk, idx) => {
    const score = Math.min(95, risk + uplift + (idx === 2 ? 5 : 0));
    const resilience = Math.max(25, 82 - score + (idx >= 5 ? 6 : 0));
    return { day: DAY_LABELS[idx], risk: score, resilience };
  });
}

function ResourceLinks() {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {CRISIS_RESOURCES.map((resource, idx) => (
        <a
          key={resource.label}
          href={resource.href}
          target={resource.href.startsWith('http') ? '_blank' : undefined}
          rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="demo-resource-link"
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '18px' }}>{['📱', '🚨', '🗺️'][idx]}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{resource.label}</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>{resource.detail}</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>{resource.value}</div>
        </a>
      ))}
    </div>
  );
}

export default function PlanPage() {
  const { interventionPlan, ensembleDecision, prediction } = useGlobalState();
  const baseTier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
  const baseMeta = RISK_TIERS[baseTier] || RISK_TIERS[0];

  const [screeningState, setScreeningState] = useState(initialScreeningState);
  const [consent, setConsent] = useState({ trustedContact: true, careTeamShare: true });

  const userTrend = useMemo(() => buildUserTrend(baseTier), [baseTier]);
  const screeningSummary = summarizeScreening(screeningState.answers);
  const adaptivePlan = buildActionPlan(screeningSummary);
  const currentQuestion = screeningState.currentQuestionId
    ? SCREENING_QUESTIONS[screeningState.currentQuestionId]
    : null;
  const screeningMeta = RISK_TIERS[screeningSummary.tier] || RISK_TIERS[0];
  const progress = Math.min(100, Math.round((screeningState.answers.length / 6) * 100));

  const effectiveTier = Math.max(baseTier, screeningSummary.tier);
  const effectiveMeta = RISK_TIERS[effectiveTier] || RISK_TIERS[0];

  return (
    <div className="screen-wrap animate-fade-in" style={{ maxWidth: '920px' }}>
      <section className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
        <div className="chip" style={{ marginBottom: '8px', color: baseMeta.color }}>
          <HeartPulse size={12} /> Current support level: {baseMeta.label}
        </div>
        <h1 className="display" style={{ fontSize: '30px', marginBottom: '8px' }}><span className="section-icon-lg">🌈</span>Your Personal Care Plan</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: '12px', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.6 }}>
          Complete a fast adaptive check-in and get a plan that fits how this week is actually going.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          <div className="chip">📊 Trend-aware recommendations</div>
          <div className="chip">🛡️ Safety guardrails included</div>
        </div>
      </section>

      <section className="demo-grid" style={{ marginBottom: '16px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">📈</span>Your Weekly Risk Trend</h3>
          <p className="text-muted" style={{ marginTop: 0, fontSize: '14px', lineHeight: 1.6 }}>
            We watch changes over time to catch rising pressure early, not just a one-time score.
          </p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={userTrend}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="risk" name="Risk" stroke="var(--color-danger)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resilience" name="Resilience" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}><span className="section-icon">📋</span>Adaptive Check-in</h3>

          <div className="demo-progress-wrap">
            <div className="demo-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="demo-mini-label" style={{ marginBottom: '10px' }}>{progress}% complete</div>

          {!screeningState.completed && currentQuestion && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '10px', lineHeight: 1.4 }}>{currentQuestion.prompt}</div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    className="demo-option-btn"
                    onClick={() => setScreeningState((state) => applyAnswer(state, option.id))}
                  >
                    <span>{option.label}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {screeningState.completed && (
            <div className="demo-complete-box">
              <span style={{ fontSize: '18px' }}>✅</span>
              Check-in complete. Your action plan is now personalized.
            </div>
          )}

          <div style={{ marginTop: '14px' }}>
            <div className="chip" style={{ color: screeningMeta.color }}>
              <HeartPulse size={12} /> Check-in result: {screeningMeta.label} ({screeningSummary.totalScore} pts)
            </div>
          </div>

          <button className="chip" style={{ marginTop: '12px', cursor: 'pointer' }} onClick={() => setScreeningState(initialScreeningState())}>
            Reset Check-in
          </button>
        </div>
      </section>

      <section className="demo-grid">
        <div className="card">
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>
            <span className="section-icon">🌿</span>Action Plan For {adaptivePlan.window}
          </h3>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px' }}>{adaptivePlan.title}</p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {adaptivePlan.actions.map((item) => (
              <div key={item} className="demo-list-item">
                <span style={{ fontSize: '16px' }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>
            <span className="section-icon">🔒</span>Safety and Sharing Preferences
          </h3>
          <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
            <label className="demo-toggle-row">
              <input
                type="checkbox"
                checked={consent.trustedContact}
                onChange={() => setConsent((prev) => ({ ...prev, trustedContact: !prev.trustedContact }))}
              />
              Enable trusted-contact escalation
            </label>
            <label className="demo-toggle-row">
              <input
                type="checkbox"
                checked={consent.careTeamShare}
                onChange={() => setConsent((prev) => ({ ...prev, careTeamShare: !prev.careTeamShare }))}
              />
              Share with care team for faster follow-up
            </label>
          </div>

          <div className="demo-escalation-box">
            <div style={{ fontWeight: 700, marginBottom: '6px', color: effectiveMeta.color }}>
              Current Safety Decision: {effectiveTier >= 2 ? 'Immediate Support' : effectiveTier === 1 ? 'Early Support' : 'Routine Support'}
            </div>
            <div className="text-muted" style={{ fontSize: '13px', marginBottom: '8px' }}>{effectiveMeta.summary}</div>
            {effectiveTier >= 2 || screeningSummary.safetyFlag ? <ResourceLinks /> : <div className="text-muted" style={{ fontSize: '13px' }}>No crisis trigger right now. Continue check-ins daily.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
