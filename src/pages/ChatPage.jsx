import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { useGlobalState } from '../GlobalStateProvider';
import { calculateStreak, loadEngagementState, recordCheckIn } from '../growth/engagementEngine';

export default function ChatPage() {
    const { scoreModel, interventionPlan, ensembleDecision, prediction } = useGlobalState();
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hey, I’m here. Want to name your mood in one sentence?', sender: 'bot' },
    ]);
    const [engagementState, setEngagementState] = useState(() => loadEngagementState());
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [speechError, setSpeechError] = useState('');
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const messagesRef = useRef(messages);

    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const streak = useMemo(() => calculateStreak(engagementState.checkInDays), [engagementState.checkInDays]);

    useEffect(() => {
        messagesRef.current = messages;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, liveTranscript]);

    const buildReply = useCallback((text) => {
        const lowered = text.toLowerCase();
        if (lowered.includes('stressed') || lowered.includes('tired')) {
            return 'That sounds heavy. Try loosening your shoulders and taking three slow breaths with me.';
        }
        if (lowered.includes('good') || lowered.includes('great')) {
            return 'Love that. Let’s lock in this momentum with one small win before tonight.';
        }
        if (tier >= 2) {
            return 'Thanks for sharing honestly. I want you to open your Care page now so we can bring in support quickly.';
        }
        if (tier === 1) {
            return 'I’m seeing elevated pressure patterns. A short walk and one trusted check-in can help shift this.';
        }
        return 'I’m with you. Let’s take this one breath at a time.';
    }, [tier]);

    const submitUserMessage = useCallback(async (rawText) => {
        const text = rawText.trim();
        if (!text) return;

        const userMessage = { id: Date.now() + Math.random(), text, sender: 'user' };
        const nextMessages = [...messagesRef.current, userMessage];
        setMessages(nextMessages);
        messagesRef.current = nextMessages;
        setEngagementState(recordCheckIn());
        setIsTyping(true);

        setTimeout(() => {
            const botMessage = { id: Date.now() + Math.random(), text: buildReply(text), sender: 'bot' };
            setMessages((prev) => {
                const merged = [...prev, botMessage];
                messagesRef.current = merged;
                return merged;
            });
            setIsTyping(false);
        }, 980);

        try {
            const last20 = nextMessages.slice(-20).map((item) => item.text).join(' ');
            const databricksResponse = await scoreModel([last20]);
            if (databricksResponse?.predictions?.length) {
                const nlpPrediction = databricksResponse.predictions[0];
                if (nlpPrediction.risk_tier > 0) {
                    const systemMessage = {
                        id: Date.now() + Math.random(),
                        text: `Signal note: ${nlpPrediction.predicted_class} (${(nlpPrediction.confidence * 100).toFixed(1)}%)`,
                        sender: 'system',
                    };
                    setMessages((prev) => {
                        const merged = [...prev, systemMessage];
                        messagesRef.current = merged;
                        return merged;
                    });
                }
            }
        } catch (error) {
            console.error('Failed to score model:', error);
        }
    }, [buildReply, scoreModel]);

    const setupRecognition = useCallback(() => {
        if (typeof window === 'undefined') return null;
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return null;
        if (recognitionRef.current) return recognitionRef.current;

        const recognition = new Recognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interim = '';
            const finals = [];

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const transcript = event.results[i][0].transcript.trim();
                if (!transcript) continue;
                if (event.results[i].isFinal) {
                    finals.push(transcript);
                } else {
                    interim += `${transcript} `;
                }
            }

            setLiveTranscript(interim.trim());
            finals.forEach((segment) => {
                submitUserMessage(segment);
                setLiveTranscript('');
            });
        };

        recognition.onerror = () => {
            setSpeechError('Voice input is unavailable right now.');
            setIsListening(false);
            setLiveTranscript('');
        };

        recognition.onend = () => {
            setIsListening(false);
            setLiveTranscript('');
        };

        recognitionRef.current = recognition;
        return recognition;
    }, [submitUserMessage]);

    const toggleListening = useCallback(() => {
        const recognition = setupRecognition();
        if (!recognition) {
            setSpeechError('Voice input is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognition.stop();
            return;
        }

        try {
            setSpeechError('');
            setLiveTranscript('');
            recognition.start();
            setIsListening(true);
        } catch (error) {
            console.error('Unable to start speech recognition:', error);
            setSpeechError('Voice input is unavailable right now.');
            setIsListening(false);
        }
    }, [isListening, setupRecognition]);

    useEffect(() => () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        setInput('');
        await submitUserMessage(text);
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

                    {liveTranscript && (
                        <div style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
                            <div className="chat-bubble chat-bubble-user">{liveTranscript}</div>
                        </div>
                    )}

                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start' }}>
                            <div className="chip">typing...</div>
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
                    onClick={toggleListening}
                    className="chip"
                    style={{ height: 46, borderRadius: 999, padding: '0 14px', fontWeight: 700 }}
                >
                    {isListening ? <Square size={12} fill="currentColor" /> : <Mic size={15} />}
                    {isListening ? 'Stop' : 'Speak'}
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
