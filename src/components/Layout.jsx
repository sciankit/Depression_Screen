import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, MessageCircle, ShieldCheck, Sparkles, ClipboardList, Moon, Sun } from 'lucide-react';

export default function Layout() {
    const [theme, setTheme] = useState(() => localStorage.getItem('mindtrace-theme') || 'light');

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
            <div className="top-ribbon">
                <div className="brand-mark">MindTrace</div>
                <button
                    type="button"
                    className="chip"
                    onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
                >
                    {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
                    {theme === 'light' ? 'Dark' : 'Light'} mode
                </button>
            </div>

            <main style={{ minHeight: '100vh' }}>
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
