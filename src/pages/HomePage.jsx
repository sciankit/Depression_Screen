import { useMemo, useRef, useState } from 'react';
import {
    Activity,
    Flame,
    HeartPulse,
    Loader,
    MessageCircle,
    Orbit,
    PhoneCall,
    PlayCircle,
    ShieldAlert,
    Sparkles,
    Square,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { RISK_TIERS } from '../riskUtils';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState } from '../growth/engagementEngine';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

const QUICK_ACTIONS = [
    { label: 'Talk', route: '/chat' },
    { label: 'Plan', route: '/plan' },
    { label: 'Care', route: '/safety' },
    { label: 'Story', route: '/stats' },
];

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function buildSignalModel(riskTier, streak) {
    const sleep = clamp(80 - riskTier * 20 + streak * 2);
    const stress = clamp(30 + riskTier * 25 - streak * 2);
    const social = clamp(65 - riskTier * 12 + streak * 3);
    const readiness = clamp(Math.round((sleep + (100 - stress) + social) / 3));

    return { sleep, stress, social, readiness };
}

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
    const signals = useMemo(() => buildSignalModel(riskTier, streak), [riskTier, streak]);

    const momentum = useMemo(() => {
        if (riskTier >= 2) return 'Stabilize';
        if (riskTier === 1) return 'Recover';
        return 'Maintain';
    }, [riskTier]);

    const todayPlan = useMemo(() => {
        if (interventionPlan?.interventions?.length) {
            return interventionPlan.interventions.slice(0, 3);
        }
        return [
            '2-minute check-in',
            'Adaptive plan refresh',
            'Open care settings once',
        ];
    }, [interventionPlan]);

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

    const listenLabel = isScoring
        ? 'Analyzing...'
        : status === 'idle'
            ? 'Listen First'
            : status === 'loading'
                ? 'Generating...'
                : status === 'playing'
                    ? 'Stop'
                    : 'Try again';

    return (
        <div className="screen-wrap home-simplified-wrap animate-fade-in">
            <section className="card home-chat-card reveal-1">
                <div className="home-chat-glow" />
                <div className="home-chat-glow second" />
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="chip home-chat-chip">
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: riskMeta.color }} />
                        {riskMeta.label} support
                    </div>

                    <h1 className="display home-chat-title">Daily Check-in</h1>
                    <p className="home-chat-subtitle">Take 2 minutes to talk with your mindful companion about your day.</p>

                    <div className="home-chat-actions">
                        <button className="home-pill-btn" onClick={() => navigate('/chat')}>
                            <MessageCircle size={14} /> Text Chat
                        </button>
                        <button className="home-pill-btn" onClick={() => navigate('/chat')}>
                            <PhoneCall size={14} /> Voice Call
                        </button>
                        <button
                            className="home-pill-btn home-pill-btn-solid"
                            onClick={status === 'playing' ? stopPrompt : playPrompt}
                            disabled={isScoring}
                        >
                            {isScoring && <Loader size={14} className="animate-spin" />}
                            {!isScoring && status === 'idle' && <PlayCircle size={14} />}
                            {!isScoring && status === 'loading' && <Loader size={14} className="animate-spin" />}
                            {!isScoring && status === 'playing' && <Square size={12} fill="currentColor" />}
                            {listenLabel}
                        </button>
                    </div>
                </div>
            </section>

            <section className="home-signal-grid reveal-2">
                <div className="card home-signal-card">
                    <div className="home-signal-ring" style={{ '--ring': `${signals.readiness * 3.6}deg` }}>
                        <div className="home-signal-ring-inner">
                            <div className="home-mini-label">Readiness</div>
                            <div className="home-ring-value">{signals.readiness}</div>
                        </div>
                    </div>
                    <div className="home-mini-bars">
                        <div className="home-bar-row">
                            <span>Sleep</span>
                            <div className="home-bar-track"><div className="home-bar-fill" style={{ width: `${signals.sleep}%` }} /></div>
                        </div>
                        <div className="home-bar-row">
                            <span>Stress</span>
                            <div className="home-bar-track"><div className="home-bar-fill stress" style={{ width: `${signals.stress}%` }} /></div>
                        </div>
                        <div className="home-bar-row">
                            <span>Social</span>
                            <div className="home-bar-track"><div className="home-bar-fill" style={{ width: `${signals.social}%` }} /></div>
                        </div>
                    </div>
                </div>

                <div className="card home-plan-card">
                    <div className="home-mini-label" style={{ marginBottom: 8 }}>Today Stats</div>
                    <div className="home-stats-row">
                        <div className="home-stat-pill"><Orbit size={13} /> {streak}d streak</div>
                        <div className="home-stat-pill"><Flame size={13} /> {momentum}</div>
                    </div>
                    <div className="home-stats-row" style={{ marginBottom: 10 }}>
                        <div className="home-stat-pill"><ShieldAlert size={13} /> {riskMeta.label}</div>
                        <div className="home-stat-pill"><HeartPulse size={13} /> {nudge}</div>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {todayPlan.map((item, idx) => (
                            <div key={item} className="home-plan-item">
                                <span>{idx + 1}</span>
                                <p>{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-action-rail reveal-3">
                {QUICK_ACTIONS.map((item, index) => (
                    <button
                        key={item.label}
                        className="home-action-pill"
                        onClick={() => navigate(item.route)}
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <Sparkles size={12} />
                        {item.label}
                    </button>
                ))}
                <button className="home-action-pill" onClick={() => navigate('/plan')}>
                    <Activity size={12} /> Action Plan
                </button>
            </section>
        </div>
    );
}
