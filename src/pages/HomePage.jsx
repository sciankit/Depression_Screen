import { useState, useRef, useMemo } from 'react';
import { PlayCircle, Square, Loader, Moon, Heart, ShieldAlert, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { RISK_TIERS } from '../riskUtils';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState } from '../growth/engagementEngine';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

export default function HomePage() {
    const navigate = useNavigate();
    const { prediction, phqPrediction, isScoring, interventionPlan, ensembleDecision } = useGlobalState();
    const [status, setStatus] = useState("idle");
    const audioRef = useRef(null);

    const engagement = useMemo(() => loadEngagementState(), []);
    const streak = calculateStreak(engagement.checkInDays);
    const growthRiskTier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const growthNudge = getNudgeForRiskTier(growthRiskTier, streak);
    const riskMeta = RISK_TIERS[growthRiskTier] || RISK_TIERS[0];

    const playPrompt = async (e) => {
        e.stopPropagation();
        if (status === "loading" || status === "playing") return;
        setStatus("loading");

        let promptText = "Good afternoon. I'm here if you want to reflect on your day or just take a breather. Just tap the button to start chatting when you're ready.";

        if (prediction || phqPrediction) {
            const insights = [];
            if (prediction && prediction.risk_tier > 0) {
                insights.push(`experiencing some ${prediction.predicted_class}`);
            }
            if (phqPrediction && phqPrediction.severity !== 'None') {
                insights.push(`showing signs of ${phqPrediction.severity} depression`);
            }

            if (insights.length > 0) {
                promptText = `Hi there. Based on the background signals, it seems like you might be ${insights.join(" and ")}. I'm here whenever you're ready to talk about it, or even if you just need a brief distraction.`;
            }
        }

        try {
            const res = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
                {
                    method: "POST",
                    headers: {
                        "xi-api-key": ELEVENLABS_API_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: promptText,
                        model_id: "eleven_turbo_v2",
                        voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.2 },
                    }),
                }
            );

            if (!res.ok) throw new Error("ElevenLabs API error");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
            }

            const audio = new Audio(url);
            audioRef.current = audio;
            setStatus("playing");
            audio.play();
            audio.onended = () => setStatus("idle");
        } catch (error) {
            console.error(error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    const stopAudio = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setStatus("idle");
    };

    return (
        <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '14px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                    Good Afternoon
                </h2>
                <h1 className="display" style={{ fontSize: '32px', margin: 0, lineHeight: 1.2 }}>
                    Ready to take a mind trace?
                </h1>

                <div style={{
                    marginTop: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '999px',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    color: riskMeta.color,
                    fontSize: '13px',
                    fontWeight: 700,
                }}>
                    <ShieldAlert size={14} />
                    Current Risk: {riskMeta.label}
                </div>

                <div style={{
                    marginTop: '10px',
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Target size={16} color="var(--color-primary)" />
                        <strong style={{ fontSize: '14px' }}>GrowthFactor Streak: {streak} day{streak === 1 ? '' : 's'}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {growthNudge}
                    </div>
                </div>
            </header>

            <div
                className="card"
                onClick={() => navigate('/chat')}
                style={{
                    marginBottom: '32px',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #E57D2C 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ color: 'white', marginBottom: '8px', fontSize: '20px' }}>Daily Check-in</h3>
                    <p style={{ opacity: 0.9, marginBottom: '24px', fontSize: '14px', lineHeight: 1.5, maxWidth: '80%' }}>
                        Take 2 minutes to text with your mindful companion about your day.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div
                            onClick={() => navigate('/chat')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 500 }}
                        >
                            Open Chat
                        </div>

                        <div
                            onClick={status === "playing" ? stopAudio : playPrompt}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: status === "playing" ? '#2c2420' : 'white',
                                color: status === "playing" ? 'white' : 'var(--color-primary)',
                                padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                                opacity: isScoring ? 0.7 : 1,
                                cursor: isScoring ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                ...(status === "error" && { background: "#c0392b", color: "white" })
                            }}
                        >
                            {isScoring && <><Loader size={16} className="animate-spin" /> Analyzing...</>}
                            {!isScoring && status === "idle" && <><PlayCircle size={16} /> Listen First</>}
                            {!isScoring && status === "loading" && <><Loader size={16} className="animate-spin" /> Generating...</>}
                            {!isScoring && status === "playing" && <><Square size={14} fill="currentColor" /> Stop</>}
                            {!isScoring && status === "error" && "Error"}
                        </div>
                    </div>
                </div>
                <div style={{
                    position: 'absolute',
                    right: '-20px',
                    bottom: '-40px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 0
                }} />
            </div>

            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Recommended for you</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" onClick={() => navigate('/stats')} style={{ cursor: 'pointer', padding: '20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--color-primary)' }}>
                        <Heart size={20} />
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>Weekly Stats</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>View your trends</p>
                </div>

                <div className="card" onClick={() => navigate('/safety')} style={{ cursor: 'pointer', padding: '20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--color-accent)' }}>
                        <Moon size={20} />
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>Safety Protocol</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>Escalation and support</p>
                </div>
            </div>
        </div>
    );
}
