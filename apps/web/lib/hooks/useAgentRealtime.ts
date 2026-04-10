'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AgentType = 'financial_health' | 'portfolio_health';

export interface AgentRealtimeStatus {
  agentType: AgentType;
  status: 'idle' | 'running' | 'done' | 'error';
  phase: string;
  score?: number;
  level?: string;
  generatedAt?: string;
}

export function useAgentRealtime(userId: string, agentType: AgentType) {
  const [status, setStatus] = useState<AgentRealtimeStatus>({
    agentType,
    status: 'idle',
    phase: '',
  });

  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const agentSlug =
      agentType === 'financial_health'
        ? 'financial-health-agent-v1'
        : 'portfolio-health-agent-v1';

    const channel = supabase
      .channel(`agent-${agentType}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_reports',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row?.agent_id === agentSlug) {
            setStatus({
              agentType,
              status: 'done',
              phase: 'Análise concluída',
              score: row.score as number | undefined,
              level: row.level as string | undefined,
              generatedAt: row.generated_at as string | undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, agentType, supabase]);

  return status;
}
