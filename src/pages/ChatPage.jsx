import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalState } from '../GlobalStateProvider';
import { calculateStreak, getNudgeForRiskTier, loadEngagementState, recordCheckIn } from '../growth/engagementEngine';

export default function ChatPage() {
    const { scoreModel, interventionPlan, ensembleDecision, prediction } = useGlobalState();
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hey, I’m here. Want to name your mood in one sentence?', sender: 'bot' }
    ]);
    const [engagementState, setEngagementState] = useState(() => loadEngagementState());
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const tier = interventionPlan?.tier ?? ensembleDecision?.tier ?? prediction?.risk_tier ?? 0;
    const streak = useMemo(() => calculateStreak(engagementState.checkInDays), [engagementState.checkInDays]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), text: input, sender: 'user' };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setInput('');
        setEngagementState(recordCheckIn());
        setIsTyping(true);

        setTimeout(() => {
            let reply = 'I’m with you. Let’s take this one breath at a time.';
            if (input.toLowerCase().includes('stressed') || input.toLowerCase().includes('tired')) {
                reply = 'That sounds heavy. Try loosening your shoulders and taking three slow breaths with me.';
            } else if (input.toLowerCase().includes('good') || input.toLowerCase().includes('great')) {
                reply = 'Love that. Let’s lock in this momentum with one small win before tonight.';
            } else if (tier >= 2) {
                reply = 'Thanks for sharing honestly. I want you to open your Care page now so we can bring in support quickly.';
            } else if (tier === 1) {
                reply = 'I’m seeing elevated pressure patterns. A short walk and one trusted check-in can help shift this.';
            }
            setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
            setIsTyping(false);
        }, 980);

        try {
            const last20 = updatedMessages.slice(-20).map((m) => m.text).join(' ');
            const databricksResponse = await scoreModel([last20]);
            if (databricksResponse?.predictions?.length) {
                const nlpPrediction = databricksResponse.predictions[0];
                if (nlpPrediction.risk_tier > 0) {
                    setMessages((prev) => [...prev, {
                        id: Date.now() + 2,
                        text: `Signal note: ${nlpPrediction.predicted_class} (${(nlpPrediction.confidence * 100).toFixed(1)}%)`,
                        sender: 'system'
                    }]);
                }
            }
        } catch (error) {
            console.error('Failed to score model:', error);
        }
    };

    return (
        <div className="screen-wrap animate-fade-in" style={{ maxWidth: '860px' }}>
            <div className="card chat-hero" style={{ marginBottom: '12px' }}>
                <h1 className="display" style={{ fontSize: '30px', marginBottom: '8px' }}>Talk it out, live.</h1>
                <p className="text-muted" style={{ marginTop: 0, marginBottom: '10px' }}>
                    This space is for real words, not polished answers.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <div className="chip"><Sparkles size={13} /> Streak {streak}d</div>
                    <div className="chip">{getNudgeForRiskTier(tier, streak)}</div>
                </div>
            </div>

            {tier >= 1 && (
                <div className="card chat-alert" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <ShieldAlert size={14} />
                        Elevated pressure pattern detected
                    </div>
                    <p className="text-muted" style={{ marginBottom: 0 }}>
                        You can open your care settings anytime.
                        <Link to="/safety" className="chat-alert-link">Open Care page</Link>
                    </p>
                </div>
            )}

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
                <button type="submit" className="btn-primary" style={{ width: 46, height: 46, borderRadius: '50%', padding: 0 }}>
                    <Send size={17} />
                </button>
            </form>
        </div>
    );
}
