import { NavLink, Outlet } from 'react-router-dom';
import { Home, BarChart2, MessageCircle, Activity, Globe2 } from 'lucide-react';

export default function Layout() {
    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Chat', path: '/chat', icon: MessageCircle },
        { name: 'Data', path: '/data', icon: Activity },
        { name: 'Impact', path: '/impact', icon: Globe2 },
        { name: 'Stats', path: '/stats', icon: BarChart2 },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Main Content Area */}
            <main style={{ flex: 1, paddingBottom: '80px', overflowY: 'auto' }}>
                <Outlet />
            </main>

            {/* Bottom Navigation for Mobile / Fixed Bottom Nav */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-bg-card)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
                boxShadow: '0 -4px 20px rgba(42, 60, 79, 0.04)',
                zIndex: 50
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            transform: isActive ? 'translateY(-2px)' : 'none',
                            transition: 'all 0.2s ease',
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'font-weight 0.2s'
                                }}>
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
