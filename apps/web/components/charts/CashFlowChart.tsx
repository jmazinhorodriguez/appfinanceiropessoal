'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/utils/format';

type Props = {
  data: { month: string; receitas: number; despesas: number; }[];
};

export function CashFlowChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(48,209,88,1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgba(48,209,88,1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(255,69,58,1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="rgba(255,69,58,1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
            tickFormatter={(value) => `R$ ${value / 1000}k`} 
          />
          <Tooltip 
            cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
            contentStyle={{ 
              background: 'rgba(10,11,15,0.85)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-regular)', 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'var(--text-primary)'
            }}
            itemStyle={{ fontSize: 13, fontWeight: 500 }}
            labelStyle={{ color: 'var(--text-tertiary)', marginBottom: 4, fontSize: 12 }}
            formatter={(value: number) => formatBRL(value)}
          />
          <Area type="monotone" dataKey="receitas" stroke="rgba(48,209,88,1)" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" activeDot={{ r: 6, strokeWidth: 0, fill: 'rgba(48,209,88,1)' }} />
          <Area type="monotone" dataKey="despesas" stroke="rgba(255,69,58,1)" strokeWidth={3} fillOpacity={1} fill="url(#colorDes)" activeDot={{ r: 6, strokeWidth: 0, fill: 'rgba(255,69,58,1)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
