'use client';

import { ReactNode } from 'react';
import { Scale, FileText, Activity, Settings, LayoutDashboard, Database, FolderOpen, LogOut, GitCompare, BookOpen, Search, CreditCard, Plug } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useUser();

    const inWorkspaceRoute = pathname === '/dashboard';

    const goToWorkspaceTab = (tab: string) => {
        if (!inWorkspaceRoute) router.push('/dashboard');
        onTabChange(tab);
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-60 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                {/* Logo */}
                <div className="px-5 py-5 border-b cursor-pointer" style={{ borderColor: 'var(--border)' }} onClick={() => router.push('/')}>
                    <div className="flex items-center gap-2.5">
                        <Scale size={18} />
                        <div>
                            <span className="text-base font-bold tracking-tight block" style={{ fontFamily: 'var(--font-serif)' }}>DocuIntel</span>
                            <span className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--accent)' }}>Legal Intelligence Bureau</span>
                        </div>
                    </div>
                </div>

                {/* Editorial Desk */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                    <p className="gazette-label px-3 mb-2" style={{ color: 'var(--accent)' }}>Editorial Desk</p>
                    <NavItem onClick={() => goToWorkspaceTab('overview')} icon={<LayoutDashboard size={16} />} label="Overview" active={inWorkspaceRoute && activeTab === 'overview'} />
                    <NavItem onClick={() => router.push('/dashboard/cases')} icon={<FolderOpen size={16} />} label="Cases" active={pathname === '/dashboard/cases'} />
                    <NavItem onClick={() => router.push('/dashboard/compare')} icon={<GitCompare size={16} />} label="Compare" active={pathname === '/dashboard/compare'} />
                    <NavItem onClick={() => router.push('/dashboard/library')} icon={<BookOpen size={16} />} label="Clause Library" active={pathname === '/dashboard/library'} />
                    <NavItem onClick={() => router.push('/dashboard/search')} icon={<Search size={16} />} label="Search" active={pathname === '/dashboard/search'} />

                    <hr className="my-3" style={{ borderColor: 'var(--border)' }} />
                    <p className="gazette-label px-3 mb-2" style={{ color: 'var(--accent)' }}>Administration</p>
                    <NavItem onClick={() => router.push('/dashboard/integrations')} icon={<Plug size={16} />} label="Integrations" active={pathname === '/dashboard/integrations'} />
                    <NavItem onClick={() => router.push('/dashboard/billing')} icon={<CreditCard size={16} />} label="Billing" active={pathname === '/dashboard/billing'} />
                    <NavItem onClick={() => router.push('/dashboard/settings')} icon={<Settings size={16} />} label="Settings" active={pathname === '/dashboard/settings'} />
                </nav>

                {/* User */}
                <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px]" style={{ background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'Loading...'}</p>
                            <p className="gazette-label truncate">{user?.plan?.toUpperCase() || 'FREE'} PLAN</p>
                        </div>
                        <button onClick={logout} className="p-1.5 rounded hover:bg-red-50 text-text-dim hover:text-red-600 transition-colors" title="Sign out">
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="pl-60 flex flex-col min-h-screen">
                {/* Gazette Header */}
                <header className="border-b flex items-center justify-between px-8 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <div className="flex items-center gap-3">
                        <FileText size={14} style={{ color: 'var(--text-dim)' }} />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--text-dim)' }}>{today}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--text-dim)' }}>Final Edition</span>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ onClick, icon, label, active }: { onClick: () => void; icon: ReactNode; label: string; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all group text-left ${active
                ? 'font-semibold'
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={active ? { background: 'var(--bg-subtle)', color: 'var(--text)' } : { color: 'var(--text-secondary)' }}
        >
            <span style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );
}
