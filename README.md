# 🧠 MoodLens: Catching the Storm Before It Hits

<p align="center">
  <img src="images/moodlens_crop.png" alt="MoodLens logo" width="180" />
</p>

<p align="center">
  <strong>Passive mental health risk detection and supportive intervention planning from wearable + message logs.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Status-Prototype-orange" alt="Prototype" />
</p>

---

## 🔗 Project Links
- **🌐 Live Demo:** [mymoodlens.vercel.app](https://mymoodlens.vercel.app)
- **🎨 Design Specs:** [Figma Board](figma.com/make/P1XolyuEL2wsGdTxLjhysS/MoodLens?t=wnHRINpw1j1xbFdk-0)
- **📖 Technical Docs:** [Documentation](https://docs.google.com/document/d/1Kda0piDNNX-MX9SClmGdG3jWk4bufQMjBttqhIKtmQs/edit?usp=sharing)
- **📺 Video Walkthrough:** [YouTube Demo](https://youtu.be/bELvE8N3xHI)

---

## 📝 Executive Summary
MoodLens is an AI-assisted prevention and support application that identifies mental health risk patterns early using passive digital biomarkers and conversational signals. By fusing biometric telemetry with linguistic analysis, it bridges the "critical middle ground" in mental healthcare—reaching users in the weeks before a crisis occurs.

**MoodLens is designed for early support, not diagnosis.**

## 🚀 What MoodLens Does
- **Multimodal Ingestion:** Syncs passive signals (HRV, sleep, steps) via Google Health Connect and monitors linguistic sentiment.
- **Ensemble Inference:** Scores risk patterns using **XGBoost** (Biometrics) and **multiMentalRoBERTa** (NLP) hosted on **Databricks Serving Endpoints**.
- **Tiered Safety Logic:** Applies a clinical PHQ-9 aligned framework with hard safety overrides for suicidal ideation.
- **Adaptive Intervention:** Routes users to one of four **ElevenLabs** agents (Companion, Coach, or Responder) based on real-time risk tiers.
  
## Product Experience
Primary app routes:

| Route | Purpose |
| --- | --- |
| `/` | Daily check-in and quick actions |
| `/chat` | Voice/text support conversation with adaptive risk signals |
| `/safety` | Safety protocol and escalation resources |
| `/stats` | Trend and explainability-oriented story view |
| `/plan` | Adaptive check-in and personalized care plan |

Additional internal routes include `/data`, `/impact`, `/viz-lab`, and `/dev`.

## 🛠 System Architecture
MoodLens follows an explainability-first decision pipeline:

1. **Collect:** Passive smartwatch signals + conversational message data.
2. **Score:** Parallel inference through Databricks-hosted NLP + PHQ models.
3. **Analyze:** Ensemble decision logic applies safety-first escalation overrides.
4. **Intervene:** Real-time generation of intervention plans and agent routing.
5. **Explain:** Sphinx-generated summaries provide context for clinical contributors.

![MoodLens architecture](images/Architecture.png)

## ✨ Key Capabilities
- Adaptive screening engine (`src/screening/adaptiveEngine.js`).
- Tiered risk logic with critical safety override handling.
- Explainability summaries for key risk contributors.
- Personal care plan generation from dominant burden categories.
- Exportable structured snapshots for analysis and submission workflows.
- Optional voice conversation via ElevenLabs with risk-tier-aware agent routing.

## 💻 Tech Stack
- Frontend: React 19, React Router, Vite.
- Visualisation: Sphinx.
- ML/Ops: Databricks (Model Serving), XGBoost, multiMentalRoBERTa.
- Voice AI: ElevenLabs (Conversational Agents + TTS + RAG).


## ⚡ Quick Start
### 1. Prerequisites
- Node.js 20+ (recommended).
- npm 10+.

### 2. Install
```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the project root:

```bash
VITE_DATABRICKS_TOKEN=...
VITE_ELEVENLABS_API_KEY=...
VITE_ELEVENLABS_VOICE_ID=...
VITE_ELEVENLABS_COMPANION_AGENT_ID=...
VITE_ELEVENLABS_TEXTCOMPANION_AGENT_ID=...
VITE_ELEVENLABS_COACH_AGENT_ID=...
VITE_ELEVENLABS_RESPONDER_AGENT_ID=...
```

### 4. Run locally
```bash
npm run dev
```

Open the local Vite URL shown in your terminal.

## Available Scripts
```bash
npm run dev                 # Start development server
npm run build               # Production build
npm run preview             # Preview production build locally
npm run lint                # Run ESLint
npm run docs:sphinx         # Generate Sphinx-oriented docs
npm run submission:generate # Build submission kit assets
```

## Repository Layout
```text
main/
├── docs/                   # Submission + technical documentation
├── images/                 # Brand and architecture assets
├── ml/                     # Databricks Notebooks + synthetic dataset
├── public/                 # Static public assets
├── scripts/                # Automation scripts for docs/submission
├── src/
│   ├── components/         # Shared UI components
│   ├── pages/              # Route-level pages
│   ├── screening/          # Adaptive screening engine
│   ├── growth/             # Engagement logic
│   └── vectorai/           # Vector payload utilities
├── REQUIREMENTS.md
└── README.md
```

## ⚖️ Safety and Ethical Guardrails
- Prevention, Not Diagnosis: MoodLens acts as a support assistant, not a clinical diagnostic tool.
- Privacy First: Responders see context (PHQ trends) rather than raw message content to preserve user dignity.
- Hard Overrides: Suicidal ideation markers bypass the aggregate score to trigger immediate Tier 2 protocols.
- Human-in-the-loop support is part of the operating model.

## Documentation
- Product requirements: `REQUIREMENTS.md`
- Feature roadmap: `docs/IMPORTANT_FEATURES.md`
- Submission resources: `docs/submission/`
- Integration notes: `docs/VECTORAI_INTEGRATION.md`, `docs/DATABRICKS_UN_PLAYBOOK.md`, `docs/SPHINX_EXPLAINABILITY.md`

##  ⚠️ Disclaimer
MoodLens does not replace licensed mental-health professionals or emergency services. If you are in immediate danger, contact local emergency services or a crisis hotline (e.g., 988 in the US) right away.
