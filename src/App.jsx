import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import ChatPage from './pages/ChatPage';
import CollectorPage from './pages/CollectorPage';
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
          </Route>
        </Routes>
      </Router>
    </GlobalStateProvider>
  );
}

export default App;
