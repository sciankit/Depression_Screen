import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gauge,
  HeartPulse,
  LineChart as LineChartIcon,
  Play,
  ShieldCheck,
  Users,
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
import { CRISIS_RESOURCES, RISK_TIERS } from '../riskUtils';
import { CARE_QUEUE, DEMO_PERSONAS, IMPACT_KPIS } from '../demo/demoScenarios';
import {
  SCREENING_QUESTIONS,
  applyAnswer,
  buildActionPlan,
  initialScreeningState,
  summarizeScreening,
} from '../demo/adaptiveEngine';

function mapTierFromRiskScore(riskScore) {
  if (riskScore >= 65) return 2;
  if (riskScore >= 45) return 1;
  return 0;
}

function trendDirection(points) {
  if (!points || points.length < 2) return 'Stable';
  const delta = points[points.length - 1].risk - points[0].risk;
  if (delta >= 12) return 'Deteriorating';
  if (delta <= -12) return 'Improving';
  return 'Stable';
}

function statusColor(status) {
  if (status === 'Escalated') return '#c23934';
  if (status === 'Needs follow-up') return '#d9822b';
  return '#1f8f5f';
}

function ResourceLinks() {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {CRISIS_RESOURCES.map((resource) => (
        <a
          key={resource.label}
          href={resource.href}
          target={resource.href.startsWith('http') ? '_blank' : undefined}
          rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="demo-resource-link"
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{resource.label}</div>
            <div className="text-muted" style={{ fontSize: '12px' }}>{resource.detail}</div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700 }}>{resource.value}</div>
        </a>
      ))}
    </div>
  );
}

export default function DemoHQPage() {
  const [personaId, setPersonaId] = useState(DEMO_PERSONAS[0].id);
  const [simulationStep, setSimulationStep] = useState(0);
  const [screeningState, setScreeningState] = useState(initialScreeningState);
  const [consent, setConsent] = useState({
    trustedContact: true,
    careTeamShare: true,
    analytics: true,
  });

  const persona = useMemo(
    () => DEMO_PERSONAS.find((entry) => entry.id === personaId) || DEMO_PERSONAS[0],
    [personaId]
  );

  const currentPoint = persona.trend[simulationStep] || persona.trend[persona.trend.length - 1];
  const currentTier = mapTierFromRiskScore(currentPoint.risk);
  const currentTierMeta = RISK_TIERS[currentTier] || RISK_TIERS[0];

  const screeningSummary = summarizeScreening(screeningState.answers);
  const adaptivePlan = buildActionPlan(screeningSummary);
  const screeningTierMeta = RISK_TIERS[screeningSummary.tier] || RISK_TIERS[0];

  const currentQuestion = screeningState.currentQuestionId
    ? SCREENING_QUESTIONS[screeningState.currentQuestionId]
    : null;

  const progress = Math.min(100, Math.round((screeningState.answers.length / 6) * 100));
  const direction = trendDirection(persona.trend.slice(0, simulationStep + 1));

  const primaryMilestone = persona.milestones[Math.min(simulationStep, persona.milestones.length - 1)];

  return (
    <div className="screen-wrap animate-fade-in" style={{ maxWidth: '1020px', paddingBottom: '126px' }}>
      <section className="card" style={{ marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
        <div className="demo-pulse-glow" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="chip" style={{ marginBottom: '8px' }}>
            <Play size={12} /> Prize Demo Command Center
          </div>
          <h1 className="display" style={{ fontSize: '34px', marginBottom: '8px' }}>
            End-to-end mental health intelligence, in one live story.
          </h1>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: '12px' }}>
            Simulate real users, run adaptive screening, generate intervention plans, and show care-team outcomes with safety guardrails.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <div className="chip"><LineChartIcon size={12} /> Trend: {direction}</div>
            <div className="chip"><Gauge size={12} /> Live Risk: {currentPoint.risk}/100</div>
            <div className="chip"><Users size={12} /> Cohort: {persona.cohort}</div>
          </div>
        </div>
      </section>

      <section className="demo-grid" style={{ marginBottom: '14px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LineChartIcon size={16} color="var(--color-accent)" /> Scenario Story Mode
          </h3>
          <p className="text-muted" style={{ marginTop: 0, fontSize: '14px' }}>{persona.context}</p>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700 }}>Persona</label>
            <select
              value={personaId}
              onChange={(event) => {
                setPersonaId(event.target.value);
                setSimulationStep(0);
              }}
              className="demo-select"
            >
              {DEMO_PERSONAS.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700 }}>Timeline Step: {simulationStep + 1}/{persona.trend.length}</label>
            <input
              type="range"
              min={0}
              max={persona.trend.length - 1}
              value={simulationStep}
              onChange={(event) => setSimulationStep(Number(event.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>

          <div style={{ width: '100%', height: 220, marginBottom: '10px' }}>
            <ResponsiveContainer>
              <LineChart data={persona.trend}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="risk" name="Risk" stroke="#c23934" strokeWidth={2.6} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resilience" name="Resilience" stroke="#1f8f5f" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="demo-metric-strip">
            <div>
              <div className="demo-mini-label">Current Tier</div>
              <div style={{ color: currentTierMeta.color, fontWeight: 800 }}>{currentTierMeta.label}</div>
            </div>
            <div>
              <div className="demo-mini-label">Risk-Resilience Gap</div>
              <div style={{ fontWeight: 800 }}>{Math.max(0, currentPoint.risk - currentPoint.resilience)}</div>
            </div>
            <div>
              <div className="demo-mini-label">Policy Trigger</div>
              <div style={{ fontWeight: 800 }}>{currentTier >= 2 ? 'Escalate' : currentTier === 1 ? 'Intervene' : 'Monitor'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} color="var(--color-primary)" /> Adaptive Screening
          </h3>
          <p className="text-muted" style={{ marginTop: 0, fontSize: '14px' }}>
            Branching flow dynamically prioritizes high-signal questions and skips low-yield prompts.
          </p>

          <div className="demo-progress-wrap">
            <div className="demo-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="demo-mini-label" style={{ marginBottom: '8px' }}>{progress}% complete</div>

          {!screeningState.completed && currentQuestion && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: '8px', lineHeight: 1.35 }}>{currentQuestion.prompt}</div>
              <div style={{ display: 'grid', gap: '8px' }}>
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
              <CheckCircle2 size={15} color="#1f8f5f" />
              Adaptive screen complete. Ready for personalized plan and escalation decisioning.
            </div>
          )}

          <div style={{ marginTop: '12px' }}>
            <div className="chip" style={{ color: screeningTierMeta.color, borderColor: `${screeningTierMeta.color}55` }}>
              <HeartPulse size={12} /> Screening Tier: {screeningTierMeta.label} ({screeningSummary.totalScore} pts)
            </div>
          </div>

          <button
            className="chip"
            style={{ marginTop: '10px' }}
            onClick={() => setScreeningState(initialScreeningState())}
          >
            Reset Screening
          </button>
        </div>
      </section>

      <section className="demo-grid" style={{ marginBottom: '14px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--color-accent)" /> Personalized Action Plan
          </h3>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
            {adaptivePlan.title} for {adaptivePlan.window}. Focused on highest-load category from adaptive screening.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {adaptivePlan.actions.map((item) => (
              <div key={item} className="demo-list-item">
                <CheckCircle2 size={14} color="#1f8f5f" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--color-primary)" /> Safety + Governance Controls
          </h3>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
            <label className="demo-toggle-row">
              <input
                type="checkbox"
                checked={consent.trustedContact}
                onChange={() => setConsent((prev) => ({ ...prev, trustedContact: !prev.trustedContact }))}
              />
              Trusted-contact escalation permission
            </label>
            <label className="demo-toggle-row">
              <input
                type="checkbox"
                checked={consent.careTeamShare}
                onChange={() => setConsent((prev) => ({ ...prev, careTeamShare: !prev.careTeamShare }))}
              />
              Care-team data sharing for follow-up
            </label>
            <label className="demo-toggle-row">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={() => setConsent((prev) => ({ ...prev, analytics: !prev.analytics }))}
              />
              Anonymous analytics for outcomes reporting
            </label>
          </div>

          <div className="demo-escalation-box" style={{ borderColor: `${currentTierMeta.color}66` }}>
            <div style={{ fontWeight: 800, marginBottom: '6px', color: currentTierMeta.color }}>
              Live Escalation Decision: {currentTier >= 2 ? 'Immediate' : currentTier === 1 ? 'Early Support' : 'Routine Monitoring'}
            </div>
            <div className="text-muted" style={{ fontSize: '13px', marginBottom: '8px' }}>{currentTierMeta.summary}</div>
            {currentTier >= 2 || screeningSummary.safetyFlag ? <ResourceLinks /> : <div className="text-muted" style={{ fontSize: '13px' }}>No critical safety trigger in current demo state.</div>}
          </div>
        </div>
      </section>

      <section className="demo-grid">
        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-accent)" /> Care Team Operations Queue
          </h3>
          <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
            Institution-ready panel to route high-risk users, assign counselors, and track closure status.
          </p>

          <div className="demo-table-wrap">
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Risk</th>
                  <th>Signal</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {CARE_QUEUE.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div className="demo-mini-label">{item.location}</div>
                    </td>
                    <td>{item.risk}</td>
                    <td>{item.lastSignal}</td>
                    <td>
                      <span className="demo-status-pill" style={{ background: `${statusColor(item.status)}22`, color: statusColor(item.status) }}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="demo-complete-box" style={{ marginTop: '10px' }}>
            <CheckCircle2 size={14} color="#1f8f5f" />
            Demo proof point: median handoff from detection to assignment under 6 minutes.
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={16} color="var(--color-primary)" /> Outcome KPIs for Judges and Partners
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {IMPACT_KPIS.map((metric) => (
              <div key={metric.label} className="demo-kpi-row">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{metric.label}</div>
                  <div className="text-muted" style={{ fontSize: '12px', lineHeight: 1.4 }}>{metric.note}</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{metric.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px', padding: '10px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Current Story Milestone</div>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>{primaryMilestone.title}</div>
            <div className="text-muted" style={{ fontSize: '13px' }}>{primaryMilestone.detail}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '6px', fontWeight: 700 }}>{primaryMilestone.impact}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
