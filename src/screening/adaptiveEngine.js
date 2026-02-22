export const SCREENING_QUESTIONS = {
  sleep_quality: {
    id: 'sleep_quality',
    prompt: 'How has your sleep quality been over the last 7 days?',
    category: 'sleep',
    options: [
      { id: 'great', label: 'Consistent and restful', score: 0, next: 'mood_frequency' },
      { id: 'mixed', label: 'Inconsistent but manageable', score: 1, next: 'mood_frequency' },
      { id: 'poor', label: 'Frequent wake-ups or very little sleep', score: 2, next: 'anhedonia' },
    ],
  },
  mood_frequency: {
    id: 'mood_frequency',
    prompt: 'How often did you feel low, down, or hopeless recently?',
    category: 'mood',
    options: [
      { id: 'rarely', label: 'Rarely', score: 0, next: 'energy' },
      { id: 'sometimes', label: 'Several days', score: 1, next: 'energy' },
      { id: 'often', label: 'Most days', score: 2, next: 'anhedonia' },
    ],
  },
  anhedonia: {
    id: 'anhedonia',
    prompt: 'How hard was it to feel interest or pleasure in normal activities?',
    category: 'mood',
    options: [
      { id: 'none', label: 'No significant change', score: 0, next: 'energy' },
      { id: 'some', label: 'Somewhat difficult', score: 1, next: 'social_connection' },
      { id: 'high', label: 'Very difficult', score: 2, next: 'safety_signal' },
    ],
  },
  energy: {
    id: 'energy',
    prompt: 'How would you describe your energy and concentration this week?',
    category: 'function',
    options: [
      { id: 'good', label: 'Generally steady', score: 0, next: 'social_connection' },
      { id: 'dip', label: 'Noticeable dips in focus', score: 1, next: 'social_connection' },
      { id: 'crash', label: 'Severe fatigue most days', score: 2, next: 'safety_signal' },
    ],
  },
  social_connection: {
    id: 'social_connection',
    prompt: 'How connected did you feel to people you trust?',
    category: 'social',
    options: [
      { id: 'connected', label: 'Connected and supported', score: 0, next: 'stress_load' },
      { id: 'neutral', label: 'Somewhat isolated', score: 1, next: 'stress_load' },
      { id: 'isolated', label: 'Very isolated', score: 2, next: 'safety_signal' },
    ],
  },
  stress_load: {
    id: 'stress_load',
    prompt: 'How intense was your stress load across work/school/home?',
    category: 'stress',
    options: [
      { id: 'light', label: 'Low and manageable', score: 0, next: 'done' },
      { id: 'moderate', label: 'Moderate but controllable', score: 1, next: 'done' },
      { id: 'high', label: 'Overwhelming', score: 2, next: 'safety_signal' },
    ],
  },
  safety_signal: {
    id: 'safety_signal',
    prompt: 'Have you had thoughts of harming yourself or feeling unsafe?',
    category: 'safety',
    options: [
      { id: 'no', label: 'No', score: 0, next: 'done' },
      { id: 'uncertain', label: 'Unsure / fleeting thoughts', score: 2, next: 'done' },
      { id: 'yes', label: 'Yes, and I need support now', score: 4, next: 'done' },
    ],
  },
};

export function initialScreeningState() {
  return {
    currentQuestionId: 'sleep_quality',
    answers: [],
    completed: false,
  };
}

export function applyAnswer(state, optionId) {
  if (state.completed) return state;

  const question = SCREENING_QUESTIONS[state.currentQuestionId];
  const option = question.options.find((entry) => entry.id === optionId);
  if (!option) return state;

  const answers = [
    ...state.answers,
    {
      questionId: question.id,
      prompt: question.prompt,
      category: question.category,
      optionId: option.id,
      optionLabel: option.label,
      score: option.score,
    },
  ];

  const completed = option.next === 'done';

  return {
    currentQuestionId: completed ? null : option.next,
    answers,
    completed,
  };
}

export function summarizeScreening(answers) {
  const totals = answers.reduce(
    (acc, answer) => {
      acc.score += answer.score;
      acc.categories[answer.category] = (acc.categories[answer.category] || 0) + answer.score;
      if (answer.category === 'safety' && answer.optionId !== 'no') {
        acc.safetyFlag = true;
      }
      return acc;
    },
    { score: 0, categories: {}, safetyFlag: false }
  );

  let tier = 0;
  let label = 'Low';
  if (totals.score >= 4) {
    tier = 1;
    label = 'Moderate';
  }

  return {
    totalScore: totals.score,
    categoryScores: totals.categories,
    safetyFlag: totals.safetyFlag,
    tier,
    label,
  };
}

export function buildActionPlan(summary) {
  const focusOrder = Object.entries(summary.categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const topFocus = focusOrder[0] || 'sleep';

  const planByFocus = {
    sleep: [
      'Set a fixed sleep window for the next 3 nights (+/- 30 minutes).',
      'Stop phone scrolling 45 minutes before bedtime.',
      'Use a 6-minute wind-down routine: breathing, hydration, and lights down.',
    ],
    mood: [
      'Book two 15-minute mood breaks in your calendar tomorrow.',
      'Write one sentence naming the toughest feeling and one needed support.',
      'Do one low-effort activity that usually gives mild relief.',
    ],
    stress: [
      'Run a 20-minute focus sprint, then take a 5-minute walk break.',
      'Move one non-essential task from today to later this week.',
      'Send a short message requesting help on one current stress point.',
    ],
    social: [
      'Send a check-in to one trusted person now.',
      'Schedule one in-person or voice connection in the next 48 hours.',
      'Use the care circle feature if isolation continues tomorrow.',
    ],
    function: [
      'Start the day with one easy task to build momentum.',
      'Use a 25/5 focus block for your highest-value work.',
      'Avoid multitasking in the first 90 minutes of tomorrow.',
    ],
    safety: [
      'Open immediate support resources and keep them pinned.',
      'Notify trusted contact with a predefined message.',
      'Escalate to crisis support now if you feel unsafe.',
    ],
  };

  const baseActions = planByFocus[topFocus] || planByFocus.sleep;

  if (summary.tier === 2) {
    return {
      title: 'Immediate Stabilization Plan',
      window: 'Next 24 hours',
      actions: [
        'Start crisis-safe protocol and do not stay alone if unsafe.',
        ...planByFocus.safety,
        ...baseActions.slice(0, 1),
      ],
    };
  }

  if (summary.tier === 1) {
    return {
      title: 'Early Intervention Plan',
      window: 'Next 72 hours',
      actions: [...baseActions, 'Re-screen in 48 hours to confirm trend direction.'],
    };
  }

  return {
    title: 'Prevention Momentum Plan',
    window: 'Next 7 days',
    actions: [...baseActions, 'Keep daily check-ins to sustain your current baseline.'],
  };
}
