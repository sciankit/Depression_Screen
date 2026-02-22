import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { useGlobalState } from '../GlobalStateProvider';
import { calculateStreak, loadEngagementState, recordCheckIn } from '../growth/engagementEngine';
import { Conversation } from "@elevenlabs/client";

export default function ChatPage() {
    const { scoreModel, interventionPlan, ensembleDecision, prediction, phqPrediction, userName } = useGlobalState();
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hey, I’m here. Want to name your mood in one sentence? Start by connecting below.', sender: 'bot' },
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

    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const streak = useMemo(() => calculateStreak(engagementState.checkInDays), [engagementState.checkInDays]);

    useEffect(() => {
        messagesRef.current = messages;
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
            conversationRef.current.sendUserMessage(text);
            setEngagementState(recordCheckIn());
        } catch (err) {
            setSpeechError("Failed to send text.");
        }
    };

    return (
        <div className="screen-wrap animate-fade-in" style={{ maxWidth: '860px' }}>
            <div className="card" style={{ marginBottom: '12px' }}>
                <h1 className="display" style={{ fontSize: '30px', marginBottom: '8px' }}>Talk</h1>
                <p className="text-muted" style={{ margin: 0 }}>
                    Type or use voice. Streak: {streak}d.
                </p>
            </div>

            <div className="card" style={{ padding: '12px', marginBottom: '12px' }}>
                <div className="chat-thread">
                    {messages.map((msg) => {
                        const bubbleClass = msg.sender === 'user'
                            ? 'chat-bubble chat-bubble-user'
                            : msg.sender === 'system'
                                ? 'chat-bubble chat-bubble-system'
                                : 'chat-bubble chat-bubble-bot';

                        return (
                            <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                                <div className={bubbleClass}>{msg.text}</div>
                            </div>
                        );
                    })}

                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start' }}>
                            <div className="chip">agent is speaking...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSend} className="card" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Drop your thoughts here..."
                    className="chat-input"
                />

                <button
                    type="button"
                    onClick={toggleMicrophone}
                    className="chip"
                    disabled={!isConnected}
                    style={{
                        height: 46,
                        borderRadius: 999,
                        padding: '0 14px',
                        fontWeight: 700,
                        background: isMicActive ? '#FF2D2D22' : 'transparent',
                        color: isMicActive ? '#FF2D2D' : 'inherit',
                        opacity: isConnected ? 1 : 0.5
                    }}
                >
                    {isMicActive ? <Square size={12} fill="currentColor" /> : <Mic size={15} />}
                    {isMicActive ? 'Stop' : 'Speak'}
                </button>

                <button
                    type="button"
                    onClick={toggleConnection}
                    className="chip"
                    style={{ height: 46, borderRadius: 999, padding: '0 14px', fontWeight: 700, background: isConnected ? '#FF2D2D22' : 'transparent', color: isConnected ? '#FF2D2D' : 'inherit' }}
                >
                    {isConnected ? 'Disconnect' : 'Connect Agent'}
                </button>

                <button type="submit" className="btn-primary" style={{ width: 46, height: 46, borderRadius: '50%', padding: 0 }}>
                    <Send size={17} />
                </button>
            </form>

            {speechError && (
                <p className="text-muted" style={{ marginTop: '10px', marginBottom: 0, fontSize: '13px' }}>
                    {speechError}
                </p>
            )}
        </div>
    );
}
