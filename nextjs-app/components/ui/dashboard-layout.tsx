'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Activity, Settings, LayoutDashboard, Database, ChevronRight, FolderOpen } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface DashboardLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    currentTab?: string;
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const inWorkspaceRoute = pathname === '/dashboard';

    const goToWorkspaceTab = (tab: string) => {
        if (!inWorkspaceRoute) {
            router.push('/dashboard');
        }
        onTabChange(tab);
    };

    return (
        <div className="min-h-screen bg-bg">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-60 border-r border-divider bg-bg-surface z-50 flex flex-col">
                <div className="px-5 py-5 border-b border-divider">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                            <Shield className="w-4 h-4 text-text-inverse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-semibold tracking-tight text-text">DocuIntel</span>
                            <span className="text-[10px] font-mono uppercase tracking-wide text-text-dim">Legal AI</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    <NavItem
                        onClick={() => goToWorkspaceTab('overview')}
                        icon={<LayoutDashboard size={18} />}
                        label="Overview"
                        active={inWorkspaceRoute && activeTab === 'overview'}
                    />
                    <NavItem
                        onClick={() => goToWorkspaceTab('audit')}
                        icon={<FileText size={18} />}
                        label="Case Audit"
                        active={inWorkspaceRoute && activeTab === 'audit'}
                    />
                    <NavItem
                        onClick={() => goToWorkspaceTab('vector')}
                        icon={<Database size={18} />}
                        label="Vector Store"
                        active={inWorkspaceRoute && activeTab === 'vector'}
                    />
                    <NavItem
                        onClick={() => goToWorkspaceTab('intelligence')}
                        icon={<Activity size={18} />}
                        label="Intelligence"
                        active={inWorkspaceRoute && activeTab === 'intelligence'}
                    />
                    <NavItem
                        onClick={() => router.push('/dashboard/cases')}
                        icon={<FolderOpen size={18} />}
                        label="Cases"
                        active={pathname === '/dashboard/cases'}
                    />
                    <NavItem
                        onClick={() => router.push('/dashboard/settings')}
                        icon={<Settings size={18} />}
                        label="Settings"
                        active={pathname === '/dashboard/settings'}
                    />
                </nav>

                <div className="px-3 py-4 border-t border-divider">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-bg-subtle border border-divider flex items-center justify-center font-semibold text-[11px] text-text">
                            DU
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-text">Demo User</p>
                            <p className="text-[10px] text-accent font-mono tracking-wide uppercase">Active</p>
                        </div>
                        <ChevronRight size={14} className="text-text-dim group-hover:text-text transition-colors" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="pl-60 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-14 border-b border-divider flex items-center justify-between px-8 bg-bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-text-dim uppercase tracking-wide">Dashboard</span>
                        <span className="text-text-dim">/</span>
                        <span className="text-xs font-mono text-accent uppercase tracking-wide font-medium">
                            {pathname === '/dashboard/cases' ? 'Cases' : pathname === '/dashboard/settings' ? 'Settings' : 'Workspace'}
                        </span>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                        aria-label="Open settings"
                    >
                        <Settings size={16} className="text-text-secondary" />
                    </button>
                </header>

                <main className="flex-1 p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ onClick, icon, label, active }: { onClick: () => void; icon: ReactNode; label: string; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${active
                    ? 'text-text bg-bg-subtle border border-divider'
                    : 'text-text-secondary hover:text-text hover:bg-bg-hover'
                }`}
        >
            <span className={`transition-colors ${active ? 'text-accent' : 'text-text-secondary group-hover:text-text'}`}>
                {icon}
            </span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
