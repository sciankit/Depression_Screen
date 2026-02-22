import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import ChatPage from './pages/ChatPage';
import CollectorPage from './pages/CollectorPage';
import SafetyPage from './pages/SafetyPage';
import ImpactPage from './pages/ImpactPage';
import VizLabPage from './pages/VizLabPage';
import PlanPage from './pages/PlanPage';
import DevDashboardPage from './pages/DevDashboardPage';
import { GlobalStateProvider } from './GlobalStateProvider';

function App() {
  return (
    <GlobalStateProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="data" element={<CollectorPage />} />
            <Route path="safety" element={<SafetyPage />} />
            <Route path="impact" element={<ImpactPage />} />
            <Route path="viz-lab" element={<VizLabPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="dev" element={<DevDashboardPage />} />
          </Route>
        </Routes>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;
