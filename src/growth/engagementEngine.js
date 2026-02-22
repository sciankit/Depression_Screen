const STORAGE_KEY = 'MoodLens_growthfactor_v1';

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function ymdToDate(ymd) {
    return new Date(`${ymd}T00:00:00`);
}

function uniqueDays(days = []) {
    return [...new Set(days)].sort();
}

export function loadEngagementState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { checkInDays: [] };
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.checkInDays)) return { checkInDays: [] };
        return { checkInDays: uniqueDays(parsed.checkInDays) };
    } catch {
        return { checkInDays: [] };
    }
}

export function saveEngagementState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordCheckIn() {
    const state = loadEngagementState();
    const days = uniqueDays([...state.checkInDays, todayISO()]);
    const next = { checkInDays: days };
    saveEngagementState(next);
    return next;
}

export function calculateStreak(checkInDays = []) {
    if (checkInDays.length === 0) return 0;
    const sorted = uniqueDays(checkInDays).reverse();
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const day of sorted) {
        const current = ymdToDate(day);
        const diff = Math.round((cursor - current) / (24 * 60 * 60 * 1000));
        if (diff === 0) {
            streak += 1;
            cursor = new Date(cursor.getTime() - (24 * 60 * 60 * 1000));
        } else if (diff === 1 && streak === 0) {
            cursor = current;
            streak += 1;
            cursor = new Date(cursor.getTime() - (24 * 60 * 60 * 1000));
        } else {
            break;
        }
    }
    return streak;
}

export function getNudgeForRiskTier(tier = 0, streak = 0) {
    if (tier >= 2) {
        return 'High-risk signals detected. Prioritize immediate support and a trusted-contact check-in now.';
    }
    if (tier === 1) {
        return streak >= 3
            ? 'Great consistency. Keep the streak with a 10-minute walk and early wind-down tonight.'
            : 'Build momentum with one check-in daily this week and a short activity break today.';
    }
    return streak >= 5
        ? 'Strong adherence streak. Reinforce it by protecting sleep timing tonight.'
        : 'You are on track. A quick daily reflection helps lock in healthy habits.';
}
