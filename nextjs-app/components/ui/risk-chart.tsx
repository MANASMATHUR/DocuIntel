'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface RiskChartProps {
    data: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

const COLORS = {
    critical: '#f87171',
    high: '#fbbf24',
    medium: '#818cf8',
    low: '#34d399'
};

export function RiskChart({ data }: RiskChartProps) {
    const chartData = [
        { name: 'Critical', value: data.critical, color: COLORS.critical },
        { name: 'High', value: data.high, color: COLORS.high },
        { name: 'Medium', value: data.medium, color: COLORS.medium },
        { name: 'Low', value: data.low, color: COLORS.low },
    ].filter(d => d.value > 0);

    const total = Object.values(data).reduce((a, b) => a + b, 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[400px] w-full glass-card p-10 relative group border-white/[0.03] flex flex-col"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <span className="text-primary font-bold text-[9px] uppercase tracking-[0.4em] mb-2 block">Metrics // 04</span>
                    <h3 className="text-xl font-bold font-['Outfit'] tracking-tight text-white">Risk Profile</h3>
                </div>
                <div className="text-[10px] font-mono text-text-dim text-right">
                    SECURE_AUDIT_DATA <br />
                    V2.4.0
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={12}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-2xl"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(5, 7, 10, 0.95)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(20px)',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-extralight font-['Outfit'] leading-none text-white tracking-tighter">{total}</span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-bold mt-2">Vulnerabilities</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/[0.03]">
                {chartData.map(item => (
                    <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{item.name}</span>
                            </div>
                            <span className="text-[11px] font-mono text-white opacity-40">{item.value}</span>
                        </div>
                        <div className="w-full h-[1px] bg-white/[0.03] mt-1 relative overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / total) * 100}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                                style={{ backgroundColor: item.color, opacity: 0.3 }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid Decoration */}
            <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                <div className="grid grid-cols-4 gap-1">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
