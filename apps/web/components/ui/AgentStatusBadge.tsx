'use client';
import { useAgentRealtime } from '@/lib/hooks/useAgentRealtime';
import { Brain, BarChart2, Loader2 } from 'lucide-react';

export function AgentStatusBadge({ userId }: { userId: string }) {
  const fh = useAgentRealtime(userId, 'financial_health');
  const ph = useAgentRealtime(userId, 'portfolio_health');

  const agents = [
    { label: 'Saúde Fin.', icon: Brain,     status: fh, color: 'rgba(10,132,255,1)'  },
    { label: 'Portfólio',   icon: BarChart2, status: ph, color: 'rgba(191,90,242,1)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {agents.map((a, i) => {
        const Icon = a.icon;
        const running = a.status.status === 'running';
        const done    = a.status.status === 'done';
        return (
          <div
            key={i}
            title={`Agente ${a.label} — ${a.status.status}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 20,
              background: done
                ? `rgba(${a.color.match(/\d+/g)?.slice(0,3).join(',')},0.10)`
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${done ? a.color.replace('1)', '0.30)') : 'rgba(255,255,255,0.10)'}`,
              fontSize: 11,
              fontWeight: 600,
              color: done ? a.color : 'rgba(255,255,255,0.45)',
              transition: 'all 0.3s ease',
            }}
          >
            {running ? (
              <Loader2
                size={11}
                style={{ animation: 'spin 1s linear infinite' }}
                color="rgba(255,255,255,0.45)"
              />
            ) : (
              <Icon
                size={11}
                color={done ? a.color : 'rgba(255,255,255,0.35)'}
              />
            )}
            {a.label}
            {a.status.score !== undefined && (
              <span style={{ fontWeight: 800, color: a.color }}>
                {a.status.score}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
