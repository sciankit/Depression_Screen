import { useMemo, useRef, useState } from 'react';
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Flame,
    HeartPulse,
    Loader,
    MessageCircle,
    Orbit,
    PlayCircle,
    ShieldAlert,
    Square,
    Sparkles,
    Target,
    TimerReset,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { RISK_TIERS } from '../riskUtils';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState } from '../growth/engagementEngine';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

const TODAY_TASKS = [
    {
        title: '2-minute emotional check-in',
        detail: 'Name your current mood and get an adjusted response.',
        route: '/chat',
        icon: MessageCircle,
        kind: 'primary',
    },
    {
        title: 'Adaptive plan refresh',
        detail: 'Run a short branching check-in for today\'s plan.',
        route: '/plan',
        icon: Target,
        kind: 'focus',
    },
    {
        title: 'Care circle quick review',
        detail: 'Verify support contacts and escalation settings.',
        route: '/safety',
        icon: ShieldAlert,
        kind: 'safety',
    },
];

const WEEKLY_STEPS = [
    { day: 'Mon', done: true },
    { day: 'Tue', done: true },
    { day: 'Wed', done: false },
    { day: 'Thu', done: false },
    { day: 'Fri', done: false },
    { day: 'Sat', done: false },
    { day: 'Sun', done: false },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { prediction, phqPrediction, isScoring, interventionPlan, ensembleDecision } = useGlobalState();
    const [status, setStatus] = useState('idle');
    const audioRef = useRef(null);

    const engagement = useMemo(() => loadEngagementState(), []);
    const streak = calculateStreak(engagement.checkInDays);
    const riskTier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const riskMeta = RISK_TIERS[riskTier] || RISK_TIERS[0];
    const nudge = getNudgeForRiskTier(riskTier, streak);

    const completedTasks = useMemo(() => {
        if (streak >= 5) return 2;
        if (streak >= 2) return 1;
        return 0;
    }, [streak]);

    const momentum = useMemo(() => {
        if (riskTier >= 2) return 'Stabilize';
        if (riskTier === 1) return 'Recover';
        return 'Maintain';
    }, [riskTier]);

    const playPrompt = async () => {
        if (status === 'loading' || status === 'playing') return;
        setStatus('loading');

        let promptText = "Hey, I'm here with you. We can do a quick check-in or just breathe together for a minute.";
        if (prediction || phqPrediction) {
            const insights = [];
            if (prediction?.risk_tier > 0) insights.push(prediction.predicted_class);
            if (phqPrediction?.severity && phqPrediction.severity !== 'None') insights.push(`${phqPrediction.severity} mood strain`);
            if (insights.length) promptText = `Quick note from your patterns: ${insights.join(' and ')}. I'm here to help you reset softly.`;
        }

        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: promptText,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.2 },
                }),
            });
            if (!res.ok) throw new Error('ElevenLabs API error');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }

            const audio = new Audio(url);
            audioRef.current = audio;
            setStatus('playing');
            audio.play();
            audio.onended = () => setStatus('idle');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const stopPrompt = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setStatus('idle');
    };

    const btnLabel = isScoring
        ? 'Analyzing your rhythm...'
        : status === 'idle'
            ? 'Play morning voice note'
            : status === 'loading'
                ? 'Generating...'
                : status === 'playing'
                    ? 'Stop voice note'
                    : 'Try again';

    return (
        <div className="screen-wrap animate-fade-in">
            <section className="home-hero card">
                <div className="home-hero-shape" />
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="chip" style={{ marginBottom: '10px', color: riskMeta.color }}>
                        <ShieldAlert size={13} /> Risk Signal: {riskMeta.label}
                    </div>
                    <h1 className="display" style={{ fontSize: '34px', lineHeight: 1.03, marginBottom: '10px' }}>
                        A useful plan for today, not just a score.
                    </h1>
                    <p className="text-muted" style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px', maxWidth: '600px' }}>
                        We combine your trend, check-ins, and safety context to give clear next actions that are easy to complete.
                    </p>

                    <div className="home-chip-row" style={{ marginBottom: '14px' }}>
                        <div className="chip"><Orbit size={13} /> Streak: {streak}d</div>
                        <div className="chip"><HeartPulse size={13} /> {nudge}</div>
                        <div className="chip"><Flame size={13} /> Mode: {momentum}</div>
                    </div>

                    <div className="home-chip-row">
                        <button
                            className="btn-primary"
                            onClick={status === 'playing' ? stopPrompt : playPrompt}
                            disabled={isScoring}
                            style={{ opacity: isScoring ? 0.75 : 1 }}
                        >
                            {isScoring && <Loader size={14} className="animate-spin" />}
                            {!isScoring && status === 'idle' && <PlayCircle size={14} />}
                            {!isScoring && status === 'loading' && <Loader size={14} className="animate-spin" />}
                            {!isScoring && status === 'playing' && <Square size={13} fill="currentColor" />}
                            {btnLabel}
                        </button>
                        <button className="chip" onClick={() => navigate('/plan')}>
                            <Sparkles size={13} /> Open your personal plan
                        </button>
                    </div>
                </div>
            </section>

            <section className="home-glance-grid" style={{ marginBottom: '12px' }}>
                <div className="card home-glance-card">
                    <div className="home-mini-label">Today Completion</div>
                    <div className="home-metric">{completedTasks}/3</div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                        Finish your daily trio to keep momentum stable.
                    </p>
                </div>
                <div className="card home-glance-card">
                    <div className="home-mini-label">Support Response Window</div>
                    <div className="home-metric">&lt; 6 min</div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                        Safety and care actions are prioritized in-app.
                    </p>
                </div>
                <div className="card home-glance-card">
                    <div className="home-mini-label">Next Reset Slot</div>
                    <div className="home-metric">8:30 PM</div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                        Suggested 6-minute wind-down routine.
                    </p>
                </div>
            </section>

            <section className="home-two-col" style={{ marginBottom: '12px' }}>
                <div className="card">
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Your next best actions</h3>
                    <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
                        Ordered by impact on your current risk profile.
                    </p>

                    <div style={{ display: 'grid', gap: '8px' }}>
                        {TODAY_TASKS.map((task, idx) => (
                            <button
                                key={task.title}
                                onClick={() => navigate(task.route)}
                                className="home-task-btn"
                            >
                                <div className="home-task-index">{idx + 1}</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{task.title}</div>
                                    <div className="text-muted" style={{ fontSize: '13px' }}>{task.detail}</div>
                                </div>
                                <task.icon size={16} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Weekly focus track</h3>
                    <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
                        A simple scoreboard to keep consistency visible.
                    </p>

                    <div className="home-week-strip" style={{ marginBottom: '10px' }}>
                        {WEEKLY_STEPS.map((item) => (
                            <div key={item.day} className={`home-week-day${item.done ? ' done' : ''}`}>
                                <span>{item.day}</span>
                                {item.done ? <CheckCircle2 size={13} /> : <TimerReset size={13} />}
                            </div>
                        ))}
                    </div>

                    <div className="home-safety-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <CalendarClock size={15} color={riskMeta.color} />
                            <strong>Safety readiness</strong>
                        </div>
                        <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                            {riskTier >= 2
                                ? 'High-support mode active. Keep your care circle and urgent resources one tap away.'
                                : 'Your care settings are configured. Review them once this week for faster support if needed.'}
                        </p>
                        <button className="chip" style={{ marginTop: '8px' }} onClick={() => navigate('/safety')}>
                            Open care settings <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="home-quick-grid">
                <button
                    className="card"
                    onClick={() => navigate('/chat')}
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(10,143,123,0.25)' }}
                >
                    <div className="chip" style={{ width: 'fit-content', marginBottom: '8px', color: 'var(--color-accent)' }}>
                        Talk
                    </div>
                    <h3 style={{ fontSize: '21px', marginBottom: '6px' }}>2-minute mood check</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        Vent, reflect, reset. Your assistant adapts to how your day feels.
                    </p>
                </button>

                <button
                    className="card"
                    onClick={() => navigate('/plan')}
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,95,46,0.24)' }}
                >
                    <div className="chip" style={{ width: 'fit-content', marginBottom: '8px', color: 'var(--color-primary)' }}>
                        Plan
                    </div>
                    <h3 style={{ fontSize: '21px', marginBottom: '6px' }}>Adaptive daily plan</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        Personalized interventions based on your latest check-in and trend.
                    </p>
                </button>

                <button
                    className="card"
                    onClick={() => navigate('/stats')}
                    style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,208,95,0.34)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,240,211,0.72))',
                    }}
                >
                    <div className="chip" style={{ width: 'fit-content', marginBottom: '8px' }}>
                        Story
                    </div>
                    <h3 style={{ fontSize: '21px', marginBottom: '6px' }}>Your weekly vibe arc</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        See your patterns as a personal story, not a clinical dashboard.
                    </p>
                </button>
            </section>
        </div>
    );
}
