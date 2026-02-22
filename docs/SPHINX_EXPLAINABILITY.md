# Sphinx Explainability Docs Track

## Objective
Generate judge-friendly technical docs from live model outputs.

## Planned Sections
- Model card
- Data dictionary
- Risk policy and escalation ladder
- Explainability examples by tier

## Implemented in this branch
- Added auto-generator script: `scripts/generate-sphinx-docs.mjs`
- Added npm command: `npm run docs:sphinx`
- Generated pages under `docs/sphinx/`:
  - `index.rst`
  - `model_card.rst`
  - `risk_policy.rst`

## Why This Matters
Transparent decisioning is required for high-stakes mental-health workflows.
