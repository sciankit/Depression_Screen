export const DEMO_PERSONAS = [
  {
    id: 'university-student',
    name: 'Maya, University Student',
    context: 'Midterm week with reduced sleep and social withdrawal.',
    cohort: 'Campus Wellness Pilot',
    trend: [
      { day: 'Mon', risk: 33, resilience: 66 },
      { day: 'Tue', risk: 40, resilience: 62 },
      { day: 'Wed', risk: 56, resilience: 49 },
      { day: 'Thu', risk: 62, resilience: 43 },
      { day: 'Fri', risk: 58, resilience: 46 },
      { day: 'Sat', risk: 46, resilience: 55 },
      { day: 'Sun', risk: 35, resilience: 63 },
    ],
    milestones: [
      {
        title: 'Adaptive check-in triggered',
        detail: 'Question flow skipped low-yield items and focused on sleep + social load.',
        impact: 'Completion time dropped from 7m to 3m.',
      },
      {
        title: 'Escalation avoided through early plan',
        detail: 'Personalized micro-plan delivered within 2 minutes of screen completion.',
        impact: 'Risk score dropped 27 points over 72 hours.',
      },
      {
        title: 'Trusted contact activation',
        detail: 'Student opted into check-in from roommate and counselor follow-up.',
        impact: 'No crisis event reported during exam period.',
      },
    ],
  },
  {
    id: 'frontline-worker',
    name: 'Daniel, Frontline Worker',
    context: 'Shift volatility and circadian disruption from rotating nights.',
    cohort: 'Employer Mental Health Program',
    trend: [
      { day: 'Mon', risk: 42, resilience: 58 },
      { day: 'Tue', risk: 47, resilience: 52 },
      { day: 'Wed', risk: 52, resilience: 50 },
      { day: 'Thu', risk: 67, resilience: 39 },
      { day: 'Fri', risk: 71, resilience: 34 },
      { day: 'Sat', risk: 63, resilience: 42 },
      { day: 'Sun', risk: 48, resilience: 56 },
    ],
    milestones: [
      {
        title: 'Passive stress spike detected',
        detail: 'HRV + sleep regularity divergence crossed employer alert policy.',
        impact: 'Escalation candidate surfaced before self-reported crisis.',
      },
      {
        title: 'Care-team referral assigned',
        detail: 'Case routed to program counselor in 4 minutes.',
        impact: 'Time-to-first-support reduced by 64%.',
      },
      {
        title: 'Recovery trend confirmed',
        detail: '3-day intervention improved sleep and lowered trend slope.',
        impact: 'Tier shifted from Critical to Moderate.',
      },
    ],
  },
  {
    id: 'community-health',
    name: 'Asha, Community Health Volunteer',
    context: 'High caregiving burden in low-bandwidth environment.',
    cohort: 'NGO Field Deployment',
    trend: [
      { day: 'Mon', risk: 35, resilience: 64 },
      { day: 'Tue', risk: 38, resilience: 61 },
      { day: 'Wed', risk: 43, resilience: 57 },
      { day: 'Thu', risk: 50, resilience: 50 },
      { day: 'Fri', risk: 54, resilience: 46 },
      { day: 'Sat', risk: 49, resilience: 51 },
      { day: 'Sun', risk: 40, resilience: 59 },
    ],
    milestones: [
      {
        title: 'Offline-first sync replay',
        detail: 'Captured check-ins offline and uploaded complete timeline later.',
        impact: 'Zero data loss despite unstable internet.',
      },
      {
        title: 'Localized support prompts',
        detail: 'Action plan switched to low-resource options with local constraints.',
        impact: 'Intervention adherence reached 82%.',
      },
      {
        title: 'Population impact rollup',
        detail: 'Cohort dashboard reflected support outcomes by region.',
        impact: 'Program manager expanded pilot to two new districts.',
      },
    ],
  },
];

export const CARE_QUEUE = [
  {
    id: 'case-4831',
    name: 'Maya J.',
    location: 'Campus North',
    risk: 'Moderate',
    lastSignal: 'Mood + Sleep divergence',
    status: 'Needs follow-up',
    eta: 'Today, 4:30 PM',
  },
  {
    id: 'case-4934',
    name: 'Daniel R.',
    location: 'Ops Team B',
    risk: 'Critical',
    lastSignal: 'Safety language + HRV drop',
    status: 'Escalated',
    eta: 'In progress',
  },
  {
    id: 'case-5010',
    name: 'Asha K.',
    location: 'District 7',
    risk: 'Moderate',
    lastSignal: 'Sustained stress load',
    status: 'Assigned counselor',
    eta: 'Tomorrow, 9:00 AM',
  },
];

export const IMPACT_KPIS = [
  {
    label: 'Average screening completion',
    value: '91%',
    note: 'Adaptive flow cuts unnecessary questions while preserving signal quality.',
  },
  {
    label: 'Median time-to-support',
    value: '5.2 min',
    note: 'From elevated risk detection to first human or guided intervention.',
  },
  {
    label: 'Weekly action-plan adherence',
    value: '76%',
    note: 'Users completing at least 3 prescribed micro-interventions per week.',
  },
  {
    label: 'Early-warning capture rate',
    value: '88%',
    note: 'High-risk trajectories detected before crisis threshold.',
  },
];
