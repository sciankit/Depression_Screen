import { NavLink, Outlet } from 'react-router-dom';
import { Home, MessageCircle, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

export default function Layout() {
    const navItems = [
        { name: 'Today', path: '/', icon: Home },
        { name: 'Talk', path: '/chat', icon: MessageCircle },
        { name: 'Care', path: '/safety', icon: ShieldCheck },
        { name: 'Story', path: '/stats', icon: Sparkles },
        { name: 'Demo HQ', path: '/demo-hq', icon: Trophy },
    ];

    return (
        <div className="app-shell">
            <div className="top-ribbon">
                <div className="brand-mark">MindTrace</div>
                <div className="chip">User Companion Mode</div>
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
