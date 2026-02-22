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
- Personal Care Plan page (`/plan`) with adaptive check-in and guided actions

## New Flagship Capability: Personal Care Plan
The new `Personal Care Plan` experience is built for daily users first.

### What it does
1. Shows a weekly risk and resilience trend for the current user context.
2. Runs adaptive branching check-ins instead of static long forms.
3. Generates a personalized action plan based on dominant burden categories.
4. Applies safety logic that can elevate support intensity when needed.
5. Surfaces crisis resources immediately for high-risk or safety-positive states.
6. Includes user-facing consent controls for trusted-contact and care-team sharing.

### Why this is useful
1. Converts screening from a one-time score into an ongoing decision system.
2. Gives users clear next steps, not only a label.
3. Proves "time-to-support" and "action adherence" outcomes, not vanity metrics.
4. Makes safety operations explicit and understandable for users.
5. Keeps the experience short, actionable, and repeatable each day.

### Why this is needed
1. Most screening apps stop at a score and do not support immediate next actions.
2. Users need guided routines that adjust with changing stress patterns.
3. Safety escalation should be built into normal use, not hidden.
4. Real deployments require consent and escalation guardrails to be first-class product elements.

## Adaptive Screening Engine Details
The adaptive engine lives in `src/screening/adaptiveEngine.js` and introduces:
- Dynamic question branching based on previous answers and severity
- Safety-overrides that elevate risk tier when safety signals are present
- Category-level scoring (`sleep`, `mood`, `stress`, `social`, `function`, `safety`)
- Auto-generated plans by dominant burden category and overall risk tier

This enables shorter forms while preserving decision quality.

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
