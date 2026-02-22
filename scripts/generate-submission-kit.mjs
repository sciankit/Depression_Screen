import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('docs', 'submission');
const today = new Date().toISOString().slice(0, 10);

function ensureDir() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

function write(file, content) {
    fs.writeFileSync(path.join(OUT_DIR, file), content, 'utf8');
}

function writeupTemplate() {
    return `# Project Write-up (${today})

## Problem
Depression and related risk states are often detected too late.

## Solution
MindTrace combines wearable biomarkers, risk-tier modeling, and intervention policy logic.

## What We Built
- Multimodal passive signal ingestion
- Databricks model scoring orchestration
- Tiered safety escalation pathways
- Explainability and intervention visualization

## Impact
Early detection plus behavior-first intervention before crisis thresholds.

## Responsible AI
- Non-diagnostic positioning
- Human-in-the-loop escalation
- Consent-driven contact routing
`;
}

function videoScriptTemplate() {
    return `# 2-Minute Demo Script (${today})

## 0:00 - 0:20 Problem
Mental health deterioration is usually identified after severe symptoms emerge.

## 0:20 - 0:55 Data + Model Pipeline
Show wearable + behavioral signal collection, Databricks scoring, and risk tiering.

## 0:55 - 1:25 Safety and Explainability
Show risk protocol flow, crisis resources, and contributing signal explanation.

## 1:25 - 1:50 Impact
Show population dashboard and intervention outcomes.

## 1:50 - 2:00 Close
Summarize prevention-first vision and next deployment milestones.
`;
}

function checklistTemplate() {
    return `# Devpost Submission Checklist (${today})

- [ ] Public GitHub repository link added
- [ ] 2-minute demo video uploaded
- [ ] Project write-up complete
- [ ] Challenge-specific notes included
- [ ] Team and attribution verified
- [ ] Ethical/safety statement included
`;
}

ensureDir();
write('project_writeup.md', writeupTemplate());
write('demo_video_script.md', videoScriptTemplate());
write('submission_checklist.md', checklistTemplate());

console.log(`Generated submission kit in ${OUT_DIR}`);
