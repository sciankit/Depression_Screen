import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, MessageCircle, ShieldCheck, Sparkles, ClipboardList } from 'lucide-react';

export default function Layout() {
    const location = useLocation();
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('mindtrace-theme');
        return stored ? stored : 'dark';
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mindtrace-theme', theme);
    }, [theme]);

    const navItems = [
        { name: 'Today', path: '/', icon: Home },
        { name: 'Talk', path: '/chat', icon: MessageCircle },
        { name: 'Care', path: '/safety', icon: ShieldCheck },
        { name: 'Story', path: '/stats', icon: Sparkles },
        { name: 'Plan', path: '/plan', icon: ClipboardList },
    ];

    return (
        <div className="app-shell">
            <div className="top-ribbon-wrap">
                <div className="top-ribbon">
                    <div className="brand-mark">
                        <span className="brand-glyph">🌿</span>
                        <span className="brand-text">MindTrace</span>
                    </div>
                    <button
                        type="button"
                        className="chip"
                        onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
                        style={{ cursor: 'pointer' }}
                    >
                        <span style={{ display: 'inline-flex', transition: 'transform 0.5s ease' }}>
                            {theme === 'light' ? '🌙' : '☀️'}
                        </span>
                        {theme === 'light' ? 'Night' : 'Day'} mode
                    </button>
                </div>
            </div>

            <main className="app-main">
                <Outlet />
            </main>

            <nav className="dock-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `dock-link${isActive ? ' active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
