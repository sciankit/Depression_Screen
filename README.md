# MindTrace: Early Mental Health Risk Detection with Wearable Signals

MindTrace is an AI-assisted early warning system for depression risk, burnout drift, and potential crisis patterns using wearable + passive behavioral signals.

The project combines:
- Databricks-hosted model inference for text + PHQ style scoring
- A tiered safety agent that chooses intervention intensity
- Explainability for judges and reviewers
- Human-in-the-loop escalation pathways (trusted contacts, hotline resources)

## Problem
Depression, substance-use relapse, and suicidal risk often worsen before visible crisis events. Most people carry devices that already track useful proxy signals (sleep regularity, heart-rate variability, activity rhythm, communication patterns).

MindTrace uses these streams as **early-warning markers**, not diagnosis.

## Core Flow
1. Collect multimodal telemetry (wearable + phone activity proxies).
2. Normalize relative to personal baseline.
3. Run model scoring (Databricks serving endpoints).
4. Apply safety-first ensemble policy.
5. Trigger tiered interventions:
   - Low: reinforcement + healthy routine nudges
   - Moderate: behavioral actions + trusted-contact prompts
   - Critical: immediate crisis resources and escalation guidance

## Implemented Features (Current)
- Risk-aware Home dashboard with live tier badge
- Chat assistant with risk-tier-sensitive responses
- Safety Protocol page with explicit escalation actions and hotline resources
- Explainability panel showing top contributing digital biomarkers
- BioHealth Collector with simulated telemetry, communication logs, and JSON export
- Databricks integration hooks for NLP + PHQ serving endpoints
- Prize Demo Command Center (`/demo-hq`) with interactive full-journey simulation

## New Flagship Capability: Prize Demo Command Center
The new `Demo HQ` experience is designed to make the app extremely useful and immediately demoable for judges, partners, and institutional pilots.

### What it does
1. Runs a complete storyline from user screening to intervention to care-team action.
2. Simulates multiple realistic personas (student, frontline worker, community health volunteer).
3. Displays live risk trend + resilience trend with policy-driven tier transitions.
4. Executes an adaptive branching screening flow instead of a static questionnaire.
5. Generates personalized intervention plans tied to the highest-load domains.
6. Activates escalation pathways and crisis links when high-risk conditions are reached.
7. Shows an operations-grade care queue for counselor assignment and follow-up.
8. Surfaces outcome KPIs that align with competition judging and pilot reporting.
9. Includes governance toggles for consent, data sharing, and analytics controls.

### Why this is useful
1. Converts screening from a one-time score into an ongoing decision system.
2. Demonstrates practical value for both individual users and care teams.
3. Proves "time-to-support" and "action adherence" outcomes, not vanity metrics.
4. Makes safety operations explicit and inspectable.
5. Creates a reusable demo narrative under real-world constraints (low bandwidth, constrained staff, mixed cohorts).

### Why this is needed
1. Most screening apps stop at a score and do not support immediate next actions.
2. Institutions need workflows, not only analytics.
3. Judges need clear evidence of impact and responsible AI practices.
4. Real deployments require consent and escalation guardrails to be first-class product elements.

## Adaptive Screening Engine Details
The new adaptive engine lives in `src/demo/adaptiveEngine.js` and introduces:
- Dynamic question branching based on previous answers and severity
- Safety-overrides that elevate risk tier when safety signals are present
- Category-level scoring (`sleep`, `mood`, `stress`, `social`, `function`, `safety`)
- Auto-generated plans by dominant burden category and overall risk tier

This enables shorter forms while preserving decision quality.

## Demo Story Mode Details
`src/demo/demoScenarios.js` defines:
- Persona-specific trend trajectories
- Milestones and measurable impact statements
- Care queue records with escalation state
- Competition-ready KPI blocks

This keeps demos consistent, reproducible, and narrative-driven.

## End-to-End Demo Script (Recommended)
1. Open `/demo-hq` and select a persona.
2. Move the timeline slider to show risk trend deterioration and recovery.
3. Complete adaptive screening with high-risk branch options.
4. Show auto-generated intervention plan.
5. Trigger safety state to reveal immediate support resources.
6. Walk through care-team queue and status transitions.
7. Close with KPI cards and current milestone impact.

Expected runtime: 5-7 minutes with full product story coverage.

## Award Track Mapping
### Best AI for Human Safety by SafetyKit
- Explicit safety escalation layer (`/safety` route)
- Crisis resources and immediate next-step protocol
- Non-diagnostic guardrails in UX copy

### Best Use of Actian VectorAI DB
- Structured telemetry schema with exportable JSON snapshots
- Feature groups organized for vector-search/analytics ingestion

### Most Unique Application of Sphinx
- Collector output and explainability labels are organized for documentation automation and reproducible reporting

### GrowthFactor Challenge
- Continuous engagement loop: check-ins, tailored nudges, and adherence-oriented interventions

### Databricks x United Nations Challenge
- Population-scale framing with low-cost passive sensing and transparent risk workflows

### Databricks Raffle Challenge
- Dual Databricks model endpoints integrated into app state orchestration

### Figma Make Challenge: Most Creative Data Visualization
- Multi-panel trends + explainability visual analytics with narrative context

## Project Submission Checklist (Devpost)
- 2-minute demo video
- Project write-up (this README + `/docs` notes)
- Public GitHub repository link

## Local Run
```bash
npm install
npm run dev
```

## Required Environment Variables
```bash
VITE_DATABRICKS_TOKEN=...
VITE_ELEVENLABS_API_KEY=...
VITE_ELEVENLABS_VOICE_ID=...
```

## Safety Note
MindTrace is a prevention and support assistant. It is not a medical diagnosis tool and does not replace licensed mental-health professionals or emergency services.
