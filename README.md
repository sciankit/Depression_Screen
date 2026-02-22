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
