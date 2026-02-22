import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Send, Square } from 'lucide-react';
import { useGlobalState } from '../GlobalStateProvider';
import { calculateStreak, loadEngagementState, recordCheckIn } from '../growth/engagementEngine';
import { Conversation } from "@elevenlabs/client";
import emailjs from '@emailjs/browser';

export default function ChatPage() {
    const { scoreModel, interventionPlan, ensembleDecision, prediction, phqPrediction, userName } = useGlobalState();
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hey, I\u2019m here. Want to name your mood in one sentence? Start by connecting below.', sender: 'bot' },
    ]);
    const [engagementState, setEngagementState] = useState(() => loadEngagementState());
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMicActive, setIsMicActive] = useState(false);
    const [speechError, setSpeechError] = useState('');
    const messagesEndRef = useRef(null);
    const conversationRef = useRef(null);
    const messagesRef = useRef(messages);
    const initialRenderRef = useRef(true);

    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const streak = useMemo(() => calculateStreak(engagementState.checkInDays), [engagementState.checkInDays]);

    useEffect(() => {
        messagesRef.current = messages;
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return;
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);



    const toggleConnection = async () => {
        if (isConnected) {
            await conversationRef.current?.endSession();
            conversationRef.current = null;
            setIsConnected(false);
            return;
        }

        try {
            setSpeechError('');
            await navigator.mediaDevices.getUserMedia({ audio: true });

            const phqScoreRaw = phqPrediction?.score ?? phqPrediction?.prediction ?? phqPrediction ?? 0;
            const phqScore = typeof phqScoreRaw === 'string' ? parseFloat(phqScoreRaw) : (typeof phqScoreRaw === 'number' ? phqScoreRaw : 0);

            // Map tier to agent IDs directly
            const agentIds = {
                0: import.meta.env.VITE_ELEVENLABS_COMPANION_AGENT_ID,
                1: import.meta.env.VITE_ELEVENLABS_COACH_AGENT_ID,
                2: import.meta.env.VITE_ELEVENLABS_RESPONDER_AGENT_ID
            };

            const conversation = await Conversation.startSession({
                agentId: agentIds[tier] || import.meta.env.VITE_ELEVENLABS_COMPANION_AGENT_ID,
                dynamicVariables: {
                    user_name: userName || "Friend",
                    nlp_class: prediction?.predicted_class || "Neutral",
                    phq_score: phqScore.toString()
                },
                onModeChange: (mode) => {
                    setIsTyping(mode.mode === 'speaking');
                },
                onMessage: async (message) => {
                    if (message.message) {
                        setMessages(prev => [...prev, {
                            id: Date.now() + Math.random(),
                            text: message.message,
                            sender: message.source === 'user' ? 'user' : 'bot'
                        }]);

                        if (message.source === 'user') {
                            try {
                                const databricksResponse = await scoreModel([message.message]);
                                if (databricksResponse?.predictions?.length) {
                                    const nlpPrediction = databricksResponse.predictions[0];
                                    if (nlpPrediction.risk_tier > 0) {
                                        setMessages(prev => [...prev, {
                                            id: Date.now() + Math.random(),
                                            text: `Signal note: ${nlpPrediction.predicted_class} (${(nlpPrediction.confidence * 100).toFixed(1)}%)`,
                                            sender: 'system',
                                        }]);

                                        if (nlpPrediction.risk_tier === 2) {
                                            const templateParams = {
                                                to_name: 'Swebert Correa',
                                                to_email: 'correaswebert@gmail.com',
                                                user_name: userName || 'Friend',
                                                flagged_message: message.message,
                                                tendency: nlpPrediction.predicted_class,
                                                confidence: (nlpPrediction.confidence * 100).toFixed(1)
                                            };

                                            // Make sure to replace these with real EmailJS Service/Template/Key if executing in production
                                            // Using dummy IDs here as a scaffold to fulfill the logic structure
                                            emailjs.send(
                                                'service_aura_alerts',
                                                'template_tier2_alert',
                                                templateParams,
                                                'YOUR_PUBLIC_KEY'
                                            ).then((response) => {
                                                console.log('Tier 2 Alert Email sent!', response.status, response.text);
                                            }).catch((err) => {
                                                console.error('Failed to send Tier 2 alert.', err);
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                },
                onError: (error) => {
                    console.error("Error:", error);
                    setSpeechError(typeof error === 'string' ? error : error.message || 'Connection error.');
                    setIsConnected(false);
                    setIsMicActive(false);
                },
            });

            // Do not listen by default! Wait for user to explicitly activate it.
            await conversation.setVolume({ volume: 1 });
            try {
                conversation.setMicMuted(true);
            } catch (e) {
                // Ignore if mute fails initially
            }
            setIsMicActive(false);

            conversationRef.current = conversation;
            setIsConnected(true);
            setEngagementState(recordCheckIn());

        } catch (error) {
            console.error("Failed to start Aura:", error);
            setSpeechError("Microphone access is required to connect, or there was a network error.");
            setIsConnected(false);
            setIsMicActive(false);
        }
    };

    useEffect(() => () => {
        if (conversationRef.current) {
            conversationRef.current.endSession();
            conversationRef.current = null;
        }
    }, []);

    const toggleMicrophone = async () => {
        if (!isConnected || !conversationRef.current) return;

        try {
            if (isMicActive) {
                conversationRef.current.setMicMuted(true);
                setIsMicActive(false);
            } else {
                conversationRef.current.setMicMuted(false);
                setIsMicActive(true);
            }
        } catch (e) {
            setSpeechError("Microphone control failed.");
            setIsMicActive(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;

        if (!isConnected || !conversationRef.current) {
            setSpeechError("Please click 'Connect' before typing so the AI can engage.");
            return;
        }

        setInput('');
        try {
            // Append instantly to UI so user sees it, then send to ElevenLabs
            setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender: 'user' }]);

            // We also need to manually trigger our own text if they're purely typing and testing Databricks.
            // But ElevenLabs will inherently process it and reply by triggering `onMessage` back down to us,
            // However, we want the Databricks test fired on user entry too:
            try {
                const databricksResponse = await scoreModel([text]);
                if (databricksResponse?.predictions?.length) {
                    const nlpPrediction = databricksResponse.predictions[0];
                    if (nlpPrediction.risk_tier > 0) {
                        setMessages(prev => [...prev, {
                            id: Date.now() + Math.random(),
                            text: `Signal note: ${nlpPrediction.predicted_class} (${(nlpPrediction.confidence * 100).toFixed(1)}%)`,
                            sender: 'system',
                        }]);

                        if (nlpPrediction.risk_tier === 2) {
                            const templateParams = {
                                to_name: 'Swebert Correa',
                                to_email: 'correaswebert@gmail.com',
                                user_name: userName || 'Friend',
                                flagged_message: text,
                                tendency: nlpPrediction.predicted_class,
                                confidence: (nlpPrediction.confidence * 100).toFixed(1)
                            };
                            emailjs.send(
                                'service_aura_alerts',
                                'template_tier2_alert',
                                templateParams,
                                'YOUR_PUBLIC_KEY'
                            ).catch(console.error);
                        }
                    }
                }
            } catch (dbErr) {
                console.error("Databricks error:", dbErr);
            }

            conversationRef.current.sendUserMessage(text);
            setEngagementState(recordCheckIn());
        } catch (err) {
            setSpeechError("Failed to send text.");
        }
    };

    return (
        <div className="screen-wrap animate-fade-in chat-page-wrap" style={{ maxWidth: '860px' }}>
            <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
                <h1 className="display" style={{ fontSize: '28px', marginBottom: '6px' }}><span className="section-icon-lg">🕊️</span>Talk</h1>
                <p className="text-muted" style={{ margin: 0, fontSize: '14px' }}>
                    Type or use voice. Streak: {streak}d.
                </p>
            </div>

            <div className="card chat-card">
                <div className="chat-thread">
                    {messages.map((msg) => {
                        const rowClass = msg.sender === 'user'
                            ? 'chat-row chat-row-user'
                            : msg.sender === 'system'
                                ? 'chat-row chat-row-system'
                                : 'chat-row chat-row-bot';

                        const bubbleClass = msg.sender === 'user'
                            ? 'chat-bubble chat-bubble-user'
                            : msg.sender === 'system'
                                ? 'chat-bubble chat-bubble-system'
                                : 'chat-bubble chat-bubble-bot';

                        return (
                            <div key={msg.id} className={rowClass}>
                                {msg.sender === 'bot' && <span className="chat-sender">MoodLens</span>}
                                <div className={bubbleClass}>{msg.text}</div>
                            </div>
                        );
                    })}

                    {isTyping && (
                        <div className="chat-typing">
                            <span className="chat-typing-dot" />
                            <span className="chat-typing-dot" />
                            <span className="chat-typing-dot" />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="chat-input-bar">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Drop your thoughts here..."
                        className="chat-input"
                    />

                    {isConnected && (
                        <button
                            type="button"
                            onClick={toggleMicrophone}
                            className="chip"
                            style={{
                                height: 48,
                                borderRadius: 999,
                                padding: '0 16px',
                                fontWeight: 600,
                                background: isMicActive ? 'var(--color-danger-soft)' : 'var(--surface)',
                                color: isMicActive ? 'var(--color-danger)' : 'inherit',
                                cursor: 'pointer',
                                marginRight: '8px'
                            }}
                        >
                            {isMicActive ? <MicOff size={15} /> : <Mic size={15} />}
                            {isMicActive ? 'Mute' : 'Unmute'}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={toggleConnection}
                        className="chip"
                        style={{
                            height: 48,
                            borderRadius: 999,
                            padding: '0 16px',
                            fontWeight: 600,
                            background: isConnected ? 'var(--color-danger-soft)' : 'var(--surface)',
                            color: isConnected ? 'var(--color-danger)' : 'inherit',
                            cursor: 'pointer',
                        }}
                    >
                        {isConnected ? <Square size={12} fill="currentColor" /> : <Mic size={15} />}
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </button>

                    <button type="submit" className="btn-primary" style={{ width: 48, height: 48, borderRadius: '50%', padding: 0 }}>
                        <Send size={17} />
                    </button>
                </form>
            </div>

            {speechError && (
                <p className="text-muted" style={{ marginTop: '12px', marginBottom: 0, fontSize: '13px' }}>
                    {speechError}
                </p>
            )}
        </div>
    );
}
