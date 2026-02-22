import MindTrace from '../MindTrace';
import ExplainabilityPanel from '../components/ExplainabilityPanel';

export default function StatsPage() {
    return (
        <div className="animate-fade-in">
            <MindTrace />
            <ExplainabilityPanel />
        </div>
    );
}
