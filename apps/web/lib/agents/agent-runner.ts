/**
 * Motor de execução de agentes autônomos.
 * Padrão ReAct (Reason + Act) com ciclo:
 * Observar → Raciocinar → Agir → Reportar → Aguardar
 */

export type AgentStatus =
  | 'idle'
  | 'observing'
  | 'reasoning'
  | 'acting'
  | 'reporting'
  | 'done'
  | 'error';

export interface AgentLog {
  id: string;
  timestamp: string;
  phase: AgentStatus;
  message: string;
  data?: Record<string, unknown>;
}

export interface AgentReport {
  agentId: string;
  userId: string;
  generatedAt: string;
  score: number;
  level: 'critica' | 'atencao' | 'boa' | 'excelente';
  summary: string;
  insights: AgentInsight[];
  actions: AgentAction[];
  logs: AgentLog[];
  nextRunAt: string;
}

export interface AgentInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  category?: string;
  title: string;
  description: string;
  detail?: string;
  methodology: string;
  confidence: number;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  severity?: string;
  data?: Record<string, unknown>;
}

export interface AgentAction {
  id: string;
  label: string;
  description: string;
  impact: 'baixo' | 'medio' | 'alto';
  effort: 'baixo' | 'medio' | 'alto';
  category: string;
  potentialGain?: number;
}

export function createAgentLog(
  phase: AgentStatus,
  message: string,
  data?: Record<string, unknown>
): AgentLog {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    phase,
    message,
    data,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
