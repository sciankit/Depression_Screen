import MindTrace from '../MindTrace';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

export default function StatsPage() {
    return (
        <div className="screen-wrap animate-fade-in" style={{ maxWidth: '860px' }}>
            <div className="card" style={{ marginBottom: '14px' }}>
                <h1 className="display" style={{ marginBottom: '8px', fontSize: '30px' }}>Your Weekly Story</h1>
                <p className="text-muted" style={{ margin: 0 }}>
                    These patterns are here to help you notice rhythms, not judge you.
                </p>
            </div>
            <MindTrace />
            <ExplainabilityPanel />
        </div>
    );
}
