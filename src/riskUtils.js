export const RISK_TIERS = {
    0: {
        label: "Low",
        color: "var(--color-success)",
        summary: "Stable signals. Keep reinforcing healthy routines.",
    },
    1: {
        label: "Moderate",
        color: "var(--color-warning)",
        summary: "Rising strain detected. Early intervention is recommended.",
    },
    2: {
        label: "Critical",
        color: "var(--color-danger)",
        summary: "High-risk pattern detected. Escalate immediately.",
    },
};

export const CRISIS_RESOURCES = [
    {
        label: "US 988 Lifeline",
        value: "Call or text 988",
        detail: "24/7 confidential support",
        href: "https://988lifeline.org/",
    },
    {
        label: "Emergency",
        value: "Call 911",
        detail: "Immediate danger or medical emergency",
        href: "tel:911",
    },
    {
        label: "Find Local Care",
        value: "SAMHSA treatment locator",
        detail: "Mental health and substance-use services",
        href: "https://findtreatment.gov/",
    },
];

const KEY_METRIC_LABELS = {
    "sleep.offset.wd.sd": "Sleep timing variability",
    "ICV.hr.wd": "Heart-rate rhythm instability",
    "NHR.0204.cv": "Nocturnal HR variability",
    "AC.st.30m.wd": "Daily activity consistency",
    "peaks.st.wd": "Activity peak irregularity",
};

export function buildExplainabilitySummary(prediction) {
    if (!prediction) return [];

    if (Array.isArray(prediction.top_features) && prediction.top_features.length > 0) {
        return prediction.top_features.slice(0, 5).map((f, idx) => ({
            name: f.feature || `Signal ${idx + 1}`,
            effect: typeof f.impact === "number" ? f.impact : 0.15 + idx * 0.03,
        }));
    }

    const seed = prediction.risk_tier || 0;
    const base = [
        { key: "sleep.offset.wd.sd", effect: 0.42 + seed * 0.06 },
        { key: "NHR.0204.cv", effect: 0.36 + seed * 0.05 },
        { key: "AC.st.30m.wd", effect: 0.3 + seed * 0.05 },
        { key: "ICV.hr.wd", effect: 0.25 + seed * 0.04 },
        { key: "peaks.st.wd", effect: 0.2 + seed * 0.03 },
    ];

    return base.map((item) => ({
        name: KEY_METRIC_LABELS[item.key] || item.key,
        effect: Number(item.effect.toFixed(2)),
    }));
}

export function buildInterventionPlan(ensembleDecision, prediction, phqPrediction) {
    if (!ensembleDecision) return null;

    const { tier, reason } = ensembleDecision;
    const riskInfo = RISK_TIERS[tier] || RISK_TIERS[0];
    const interventions = {
        0: [
            "Celebrate one positive routine you maintained this week.",
            "Keep sleep and wake windows within 30 minutes.",
            "Schedule one social check-in today.",
        ],
        1: [
            "Take a 10-minute walk or sunlight break within the next hour.",
            "Reduce late-night screen time tonight by 30 minutes.",
            "Prompt a trusted contact to check in within 24 hours.",
        ],
        2: [
            "Immediately surface emergency resources and hotlines.",
            "Notify designated trusted contact(s) with user consent.",
            "Recommend professional intervention and same-day support.",
        ],
    };

    return {
        tier,
        label: riskInfo.label,
        color: riskInfo.color,
        summary: riskInfo.summary,
        reason,
        interventions: interventions[tier] || interventions[0],
        predictedClass: prediction?.predicted_class || "unknown",
        confidence: prediction?.confidence || 0,
        phqSeverity: phqPrediction?.severity || "Not available",
    };
}
