'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatBRL } from '@/lib/utils/format';

type Props = {
  data: { name: string; value: number; color?: string; }[];
};

const DEFAULT_COLORS = [
  'rgba(10,132,255,1)', // blue
  'rgba(191,90,242,1)', // violet
  'rgba(90,200,250,1)', // cyan
  'rgba(48,209,88,1)',  // green
  'rgba(255,214,10,1)', // amber
  'rgba(255,69,58,1)',  // red
];

import { memo } from 'react';

export const DonutChart = memo(function DonutChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(10,11,15,0.85)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-regular)', 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'var(--text-primary)'
            }}
            itemStyle={{ fontSize: 13, fontWeight: 500 }}
            formatter={(value: number) => formatBRL(value)}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: 'var(--text-tertiary)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
