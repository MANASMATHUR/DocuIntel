'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export function SystemStatusBadge() {
    const [status, setStatus] = useState<'loading' | 'healthy' | 'degraded' | 'unhealthy'>('loading');

    useEffect(() => {
        fetch('/api/health')
            .then((r) => r.json())
            .then((data) => setStatus(data.status === 'healthy' ? 'healthy' : data.status === 'degraded' ? 'degraded' : 'unhealthy'))
            .catch(() => setStatus('unhealthy'));
    }, []);

    const colors = {
        loading: '#888',
        healthy: '#059669',
        degraded: '#D97706',
        unhealthy: '#DC2626',
    };

    const labels = {
        loading: 'Checking status...',
        healthy: 'All systems operational',
        degraded: 'Partial degradation',
        unhealthy: 'Service unavailable',
    };

    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border"
            style={{ borderColor: colors[status], color: colors[status] }}
        >
            <Activity size={12} className={status === 'loading' ? 'animate-pulse' : ''} />
            {labels[status]}
        </div>
    );
}
