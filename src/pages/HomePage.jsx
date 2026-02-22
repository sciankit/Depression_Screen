import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader, MessageCircle, Mic, PlayCircle, Square, Waves } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

const GUIDED_MEDITATION_TEXT = [
    'Take a slow breath in through your nose.',
    'Hold for a moment, then release gently.',
    'Relax your shoulders and soften your jaw.',
    'Notice one thing in your body that feels safe right now.',
    'Stay here for a few breaths. You are doing enough.',
].join(' ');

export default function HomePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [soothingState, setSoothingState] = useState('idle'); // idle | ambient | loading-guided | guided
    const [soothingError, setSoothingError] = useState('');
    const ambientCtxRef = useRef(null);
    const ambientNodesRef = useRef([]);
    const guidedAudioRef = useRef(null);
    const autoStartedRef = useRef(false);

    const stopSoothing = useCallback(() => {
        if (guidedAudioRef.current) {
            guidedAudioRef.current.pause();
            URL.revokeObjectURL(guidedAudioRef.current.src);
            guidedAudioRef.current = null;
        }

        ambientNodesRef.current.forEach((node) => {
            try {
                node.stop?.();
            } catch {
                // no-op
            }
            try {
                node.disconnect?.();
            } catch {
                // no-op
            }
        });
        ambientNodesRef.current = [];

        if (ambientCtxRef.current) {
            ambientCtxRef.current.close();
            ambientCtxRef.current = null;
        }

        setSoothingState('idle');
    }, []);

    const startAmbientOnly = useCallback(async () => {
        stopSoothing();
        setSoothingError('');

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            setSoothingError('Soothing audio is not supported in this browser.');
            return;
        }

        const ctx = new AudioCtx();
        ambientCtxRef.current = ctx;

        const master = ctx.createGain();
        master.gain.value = 0.03;
        master.connect(ctx.destination);

        const lowPad = ctx.createOscillator();
        lowPad.type = 'sine';
        lowPad.frequency.value = 174;

        const highPad = ctx.createOscillator();
        highPad.type = 'triangle';
        highPad.frequency.value = 261.63;

        const lowGain = ctx.createGain();
        const highGain = ctx.createGain();
        lowGain.gain.value = 0.6;
        highGain.gain.value = 0.22;

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.09;
        lfoGain.gain.value = 0.06;

        lfo.connect(lfoGain);
        lfoGain.connect(lowGain.gain);

        lowPad.connect(lowGain).connect(master);
        highPad.connect(highGain).connect(master);

        lowPad.start();
        highPad.start();
        lfo.start();

        ambientNodesRef.current = [lowPad, highPad, lfo, lowGain, highGain, lfoGain, master];
        setSoothingState('ambient');
    }, [stopSoothing]);

    const startGuidedMeditation = useCallback(async () => {
        setSoothingState('loading-guided');
        await startAmbientOnly();

        try {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: GUIDED_MEDITATION_TEXT,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: { stability: 0.78, similarity_boost: 0.8, style: 0.15 },
                }),
            });
            if (!res.ok) throw new Error('Failed to generate guided meditation audio.');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            guidedAudioRef.current = audio;
            audio.play();
            setSoothingState('guided');
            audio.onended = () => {
                setSoothingState('ambient');
                URL.revokeObjectURL(url);
                guidedAudioRef.current = null;
            };
        } catch (error) {
            console.error(error);
            setSoothingError('Unable to start guided meditation right now.');
            setSoothingState('ambient');
        }
    }, [startAmbientOnly]);

    useEffect(() => () => {
        stopSoothing();
    }, [stopSoothing]);

    useEffect(() => {
        const mode = searchParams.get('soothing');
        if (autoStartedRef.current || !mode) return;
        autoStartedRef.current = true;
        if (mode === 'guided') {
            startGuidedMeditation();
            return;
        }
        if (mode === 'ambient') {
            startAmbientOnly();
        }
    }, [searchParams, startAmbientOnly, startGuidedMeditation]);

    return (
        <div className="screen-wrap animate-fade-in" style={{ maxWidth: '860px' }}>
            <section className="card home-daily-card" style={{ marginBottom: '12px' }}>
                <h1 className="display home-daily-title">Start Here</h1>
                <p className="home-daily-subtitle">
                    Choose how you want to begin: soothing audio with optional guided meditation, or a chat by text/voice.
                </p>

                <div className="home-daily-actions">
                    <button className="home-daily-btn" onClick={startAmbientOnly}>
                        <Waves size={14} /> Soothing music only
                    </button>
                    <button className="home-daily-btn home-daily-btn-solid" onClick={startGuidedMeditation}>
                        {soothingState === 'loading-guided' ? <Loader size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                        Soothing + guided meditation
                    </button>
                    {(soothingState === 'ambient' || soothingState === 'guided' || soothingState === 'loading-guided') && (
                        <button className="home-daily-btn" onClick={stopSoothing}>
                            <Square size={12} fill="currentColor" /> Stop audio
                        </button>
                    )}
                </div>

                <div style={{ marginTop: '10px' }}>
                    <div className="chip">
                        {soothingState === 'guided' ? 'Guided meditation playing' : soothingState === 'ambient' ? 'Soothing audio playing' : 'Audio idle'}
                    </div>
                </div>
                {soothingError && <p className="text-muted" style={{ marginBottom: 0 }}>{soothingError}</p>}
            </section>

            <section className="card">
                <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Chat with MindTrace</h3>
                <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>
                    You can continue by text or speak naturally and see your words as chat messages.
                </p>
                <div className="home-daily-actions">
                    <button className="home-daily-btn" onClick={() => navigate('/chat')}>
                        <MessageCircle size={14} /> Open text chat
                    </button>
                    <button className="home-daily-btn" onClick={() => navigate('/chat')}>
                        <Mic size={14} /> Open voice chat
                    </button>
                </div>
            </section>
        </div>
    );
}
