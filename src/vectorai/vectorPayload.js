function stableHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function buildEmbeddingFromMetrics(metrics = {}) {
    const keys = Object.keys(metrics).sort();
    const dims = 12;
    const vec = Array.from({ length: dims }, () => 0);

    keys.forEach((key, idx) => {
        const raw = Number(metrics[key] || 0);
        const seed = stableHash(key) % dims;
        vec[seed] += raw;
        vec[idx % dims] += raw * 0.35;
    });

    const norm = Math.sqrt(vec.reduce((sum, x) => sum + (x * x), 0)) || 1;
    return vec.map((x) => Number((x / norm).toFixed(5)));
}

export function cosineSimilarity(a = [], b = []) {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    const denom = (Math.sqrt(na) * Math.sqrt(nb)) || 1;
    return Number((dot / denom).toFixed(5));
}

export function buildVectorEventWindow({ metrics, callLogs, smsLogs, riskTier = 0 }) {
    const embedding = buildEmbeddingFromMetrics(metrics);
    return {
        schemaVersion: 'vector-event-v1',
        timestamp: new Date().toISOString(),
        riskTier,
        modalityCounts: {
            physiological: Object.keys(metrics || {}).length,
            calls: (callLogs || []).length,
            sms: (smsLogs || []).length,
        },
        embedding,
        metadata: {
            source: 'mindtrace-demo',
            normalization: 'z-score-baseline-relative',
        },
    };
}

export function findMostSimilarCases(currentEmbedding) {
    const library = [
        {
            id: 'case-sleep-fragmentation',
            intervention: 'Prioritize sleep stabilization and daylight routine',
            embedding: [0.31, 0.24, 0.1, 0.29, 0.07, 0.15, 0.42, 0.3, 0.22, 0.16, 0.2, 0.11],
        },
        {
            id: 'case-social-withdrawal',
            intervention: 'Prompt trusted contact check-in and activity scheduling',
            embedding: [0.14, 0.39, 0.21, 0.1, 0.28, 0.33, 0.19, 0.2, 0.16, 0.22, 0.11, 0.31],
        },
        {
            id: 'case-recovery-positive',
            intervention: 'Reinforce protective habits and consistency tracking',
            embedding: [0.08, 0.15, 0.35, 0.12, 0.31, 0.1, 0.11, 0.18, 0.41, 0.34, 0.2, 0.24],
        },
    ];

    return library
        .map((item) => ({
            ...item,
            similarity: cosineSimilarity(currentEmbedding, item.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity);
}
