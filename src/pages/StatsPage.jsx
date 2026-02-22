import MoodLens from '../MindTrace';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

export default function StatsPage() {
    return (
        <div className="screen-wrap animate-fade-in" style={{ maxWidth: '860px' }}>
            <MoodLens />
            <ExplainabilityPanel />
        </div>
    );
}
