import { useMemo, useRef, useState } from 'react';
import {
    Flame,
    HeartPulse,
    Loader,
    Orbit,
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
        ? 'Analyzing...'
        : status === 'idle'
            ? 'Play voice note'
            : status === 'loading'
                ? 'Generating...'
                : status === 'playing'
                    ? 'Stop'
                    : 'Try again';

    return (
        <div className="screen-wrap home-simplified-wrap animate-fade-in">
            <section className="card home-minimal-hero reveal-1">
                <div className="home-orb home-orb-a" />
                <div className="home-orb home-orb-b" />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="chip" style={{ marginBottom: '10px', color: riskMeta.color }}>
                        <ShieldAlert size={13} /> {riskMeta.label} support mode
                    </div>

                    <h1 className="display home-minimal-title">Today, one clear next step.</h1>

                    <div className="home-chip-row" style={{ marginBottom: '12px' }}>
                        <div className="chip"><Orbit size={13} /> {streak}d streak</div>
                        <div className="chip"><Flame size={13} /> {momentum}</div>
                        <div className="chip"><HeartPulse size={13} /> {nudge}</div>
                    </div>

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
                </div>
            </section>

            <section className="home-action-rail reveal-2">
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
            </section>

            <section className="card reveal-3" style={{ textAlign: 'center' }}>
                <div className="home-mini-label" style={{ marginBottom: '6px' }}>Quick Goal</div>
                <div className="home-metric" style={{ marginBottom: '2px' }}>3 min reset</div>
                <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
                    Talk, plan, and continue your day.
                </p>
            </section>
        </div>
    );
}
