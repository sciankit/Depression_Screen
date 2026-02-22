import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('docs', 'sphinx');

const modelCard = {
    name: 'MindTrace Passive Risk Stratification',
    version: '0.1.0',
    intendedUse: 'Early warning and behavioral support for mental-health risk trends. Not diagnostic.',
    inputs: [
        'Heart-rate and HRV derived metrics',
        'Sleep timing and variability signals',
        'Activity rhythm and movement regularity',
        'Communication frequency deltas (metadata-level)',
    ],
    outputs: [
        'Risk tier: low | moderate | critical',
        'Top contributing signals',
        'Intervention guidance tier',
    ],
    limitations: [
        'Cannot diagnose depression, substance-use disorder, or suicidality.',
        'Sensitive to missing sensor data and sparse baseline windows.',
        'Requires explicit consent and governance for escalation actions.',
    ],
};

const riskPolicy = [
    {
        tier: 'Low',
        trigger: 'Stable baseline-aligned trends across sleep/activity/HR signals',
        action: 'Reinforcement nudge and routine maintenance',
    },
    {
        tier: 'Moderate',
        trigger: 'Sustained deviations from baseline and/or mixed signal strain',
        action: 'Behavioral action plan and trusted-contact check-in suggestion',
    },
    {
        tier: 'Critical',
        trigger: 'Severe score proxy, safety override, or high-risk NLP result',
        action: 'Immediate crisis resources and escalation protocol',
    },
];

function write(fileName, contents) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, fileName), contents, 'utf8');
}

function heading(text, level = '=') {
    return `${text}\n${level.repeat(text.length)}\n\n`;
}

function buildIndexRst() {
    return `${heading('MindTrace Explainability Docs')}` +
`.. toctree::
   :maxdepth: 2

   model_card
   risk_policy
`;
}

function buildModelCardRst() {
    return `${heading('Model Card')}
${heading('Overview', '-')}
**Name:** ${modelCard.name}

**Version:** ${modelCard.version}

**Intended Use:** ${modelCard.intendedUse}

${heading('Inputs', '-')}
${modelCard.inputs.map((item) => `- ${item}`).join('\n')}

${heading('Outputs', '-')}
${modelCard.outputs.map((item) => `- ${item}`).join('\n')}

${heading('Known Limitations', '-')}
${modelCard.limitations.map((item) => `- ${item}`).join('\n')}
`;
}

function buildRiskPolicyRst() {
    const sections = riskPolicy.map((row) => (
`${heading(`Tier: ${row.tier}`, '-')}
**Trigger:** ${row.trigger}

**Action:** ${row.action}
`
    )).join('\n');

    return `${heading('Risk Escalation Policy')}
This document describes how model output is converted into intervention pathways.

${sections}`;
}

write('index.rst', buildIndexRst());
write('model_card.rst', buildModelCardRst());
write('risk_policy.rst', buildRiskPolicyRst());

console.log(`Generated Sphinx docs in ${OUT_DIR}`);
