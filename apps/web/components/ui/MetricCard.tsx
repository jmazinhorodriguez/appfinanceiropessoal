'use client';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, Landmark } from 'lucide-react';
import { formatBRL, formatUSD } from '@/lib/utils/format';

const ICON_MAP = {
  wallet: Wallet,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'pie-chart': PieChart,
  activity: Activity,
  landmark: Landmark,
} as const;

type MetricCardProps = {
  title: string;
  value: number;
  currency?: 'BRL' | 'USD';
  change?: number; // percentage
  icon: keyof typeof ICON_MAP;
  color: 'blue' | 'green' | 'red' | 'violet' | 'cyan' | 'amber';
  delay?: number;
};

export function MetricCard({ title, value, currency = 'BRL', change, icon, color, delay = 0 }: MetricCardProps) {
  const Icon = ICON_MAP[icon] || Wallet;
  const cssColor = `var(--accent-${color})`;
  const cssColorGlow = `var(--accent-${color}-g)`;
  
  const formattedValue = currency === 'USD' ? formatUSD(value) : formatBRL(value);

  return (
    <div className="lg-card animate-fade-up" style={{ padding: '24px', animationDelay: `${delay}ms`, position: 'relative' }}>
      {/* Orb glow */}
      <div style={{ 
        position: 'absolute', top: -30, right: -30, width: 120, height: 120, 
        borderRadius: '50%', background: `radial-gradient(circle, ${cssColorGlow} 0%, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>{title}</h3>
        <div style={{ 
          width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={18} color={cssColor} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          {formattedValue}
        </p>
        
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {change >= 0 ? (
              <TrendingUp size={16} color="var(--accent-green)" />
            ) : (
              <TrendingDown size={16} color="var(--accent-red)" />
            )}
            <span style={{ 
              fontSize: 13, fontWeight: 600, 
              color: change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' 
            }}>
              {Math.abs(change).toFixed(2)}%
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>vs. mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
