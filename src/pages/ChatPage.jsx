import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState, recordCheckIn } from '../growth/engagementEngine';

export default function ChatPage() {
    const { scoreModel, interventionPlan, ensembleDecision, prediction } = useGlobalState();
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi there. I'm here if you want to reflect on your day or just take a breather. How are you feeling right now?", sender: 'bot' }
    ]);
    const [engagementState, setEngagementState] = useState(() => loadEngagementState());
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), text: input, sender: 'user' };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setInput('');
        setEngagementState(recordCheckIn());

        const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;

        setTimeout(() => {
            let reply = "I hear you. Taking a moment to acknowledge that is a great first step.";
            if (input.toLowerCase().includes('stressed') || input.toLowerCase().includes('tired')) {
                reply = "It sounds like you've had a lot on your plate. Maybe a short breathing exercise could help settle your mind when you're ready.";
            } else if (input.toLowerCase().includes('good') || input.toLowerCase().includes('great')) {
                reply = "That's wonderful to hear. Holding onto that positive energy can really carry you through the rest of the week.";
            } else if (tier >= 2) {
                reply = "Thank you for sharing that. I strongly recommend opening the Safety Protocol now so we can connect you with immediate support resources.";
            } else if (tier === 1) {
                reply = "I notice elevated stress trends. A short walk, hydration, and one trusted check-in could help stabilize your day.";
            }
            setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
        }, 1200);

        try {
            const last20 = updatedMessages.slice(-20).map((m) => m.text).join(" ");
            const databricksResponse = await scoreModel([last20]);

            if (databricksResponse && databricksResponse.predictions && databricksResponse.predictions.length > 0) {
                const nlpPrediction = databricksResponse.predictions[0];
                if (nlpPrediction.risk_tier > 0) {
                    setMessages((prev) => [...prev, {
                        id: Date.now() + 2,
                        text: `[Internal Tracker]: Model predicted ${nlpPrediction.predicted_class} with confidence ${(nlpPrediction.confidence * 100).toFixed(1)}%`,
                        sender: 'system'
                    }]);
                }
            }
        } catch (e) {
            console.error("Failed to score model:", e);
        }
    };

    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const streak = calculateStreak(engagementState.checkInDays);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>Mindful Companion</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    background: '#fff',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    color: 'var(--color-text-muted)'
                }}>
                    Streak: <strong style={{ color: 'var(--color-text-main)' }}>{streak} days</strong> · {getNudgeForRiskTier(tier, streak)}
                </div>

                {tier >= 1 && (
                    <div style={{
                        border: '1px solid #f1d8c2',
                        background: '#fff8f2',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '13px',
                        color: '#7b4a1e'
                    }}>
                        Elevated risk detected from passive signals.
                        <Link to="/safety" style={{ color: '#b85e1f', marginLeft: '6px', textDecoration: 'underline' }}>
                            Open safety protocol
                        </Link>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            background: msg.sender === 'user' ? 'var(--color-primary)' : msg.sender === 'system' ? '#fde0df' : 'var(--color-bg-card)',
                            color: msg.sender === 'user' ? 'white' : msg.sender === 'system' ? '#c0392b' : 'var(--color-text-main)',
                            padding: msg.sender === 'system' ? '8px 12px' : '14px 18px',
                            borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : msg.sender === 'system' ? '8px' : '20px 20px 20px 4px',
                            boxShadow: msg.sender === 'bot' ? '0 2px 10px rgba(42, 60, 79, 0.04)' : 'none',
                            border: msg.sender === 'bot' ? '1px solid var(--color-border)' : 'none',
                            fontSize: msg.sender === 'system' ? '12px' : '15px',
                            fontFamily: msg.sender === 'system' ? 'monospace' : 'inherit',
                            lineHeight: 1.5,
                        }}>
                            {msg.text}
                        </div>
                        {msg.sender === 'bot' && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', marginLeft: '4px' }}>MindTrace Bot</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px 24px 24px', background: 'var(--color-bg)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your thoughts..."
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            borderRadius: '30px',
                            border: '1px solid var(--color-border)',
                            outline: 'none',
                            fontSize: '15px',
                            background: 'white',
                            fontFamily: 'var(--font-sans)',
                        }}
                    />
                    <button type="submit" style={{
                        background: 'var(--color-secondary)',
                        color: 'var(--color-text-main)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
