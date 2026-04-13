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
        <div className="w-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1">Risk Overview</span>
                    <h3 className="text-base font-semibold text-white">Risk Profile</h3>
                </div>
                <span className="text-xs font-mono text-text-dim">{total} clauses</span>
            </div>

            <div className="relative h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={8}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(5, 7, 10, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-semibold text-white">{total}</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-dim font-medium">Issues</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/[0.05]">
                {chartData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-text-secondary">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono text-text-dim">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
