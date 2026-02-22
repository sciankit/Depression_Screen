import { useMemo, useRef, useState } from 'react';
import { PlayCircle, Loader, Square, Sparkles, HeartPulse, ShieldAlert, Orbit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { RISK_TIERS } from '../riskUtils';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState } from '../growth/engagementEngine';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

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
            <section
                className="card"
                style={{
                    marginBottom: '14px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255,95,46,0.16) 0%, rgba(255,208,95,0.22) 56%, rgba(10,143,123,0.2) 100%)',
                }}
            >
                <div
                    className="animate-bob"
                    style={{
                        position: 'absolute',
                        right: '-22px',
                        top: '-18px',
                        width: '112px',
                        height: '112px',
                        borderRadius: '28px',
                        transform: 'rotate(18deg)',
                        background: 'rgba(255,255,255,0.45)',
                    }}
                />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="chip" style={{ marginBottom: '10px', color: riskMeta.color }}>
                        <ShieldAlert size={13} /> Risk Signal: {riskMeta.label}
                    </div>
                    <h1 className="display" style={{ fontSize: '34px', lineHeight: 1.02, marginBottom: '10px' }}>
                        Your emotional co-pilot for the day.
                    </h1>
                    <p className="text-muted" style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px' }}>
                        No forms. No jargon. Just gentle support shaped by your real patterns.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        <div className="chip"><Orbit size={13} /> Streak: {streak}d</div>
                        <div className="chip"><HeartPulse size={13} /> {nudge}</div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        <button className="chip" onClick={() => navigate('/chat')}>
                            <Sparkles size={13} /> Start check-in chat
                        </button>
                        <button className="chip" onClick={() => navigate('/plan')}>
                            <Sparkles size={13} /> Open your personal plan
                        </button>
                    </div>
                </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <button
                    className="card"
                    onClick={() => navigate('/chat')}
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(10,143,123,0.25)' }}
                >
                    <div className="chip" style={{ width: 'fit-content', marginBottom: '8px', color: 'var(--color-accent)' }}>
                        Talk
                    </div>
                    <h3 style={{ fontSize: '22px', marginBottom: '6px' }}>2-minute mood check</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        Vent, reflect, reset. Your assistant adapts to how your day feels.
                    </p>
                </button>

                <button
                    className="card"
                    onClick={() => navigate('/safety')}
                    style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,95,46,0.24)' }}
                >
                    <div className="chip" style={{ width: 'fit-content', marginBottom: '8px', color: 'var(--color-primary)' }}>
                        Care
                    </div>
                    <h3 style={{ fontSize: '22px', marginBottom: '6px' }}>Care circle settings</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        Manage trusted contacts and escalation preferences in plain language.
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
                    <h3 style={{ fontSize: '22px', marginBottom: '6px' }}>Your weekly vibe arc</h3>
                    <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                        See your patterns as a personal story, not a clinical dashboard.
                    </p>
                </button>
            </section>
        </div>
    );
}
