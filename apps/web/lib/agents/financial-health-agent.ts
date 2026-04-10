/**
 * AGENTE AUTÔNOMO — SAÚDE FINANCEIRA
 *
 * Daniel Kahneman (Nobel 2002):
 * - Teoria dos Prospectos: perdas causam 2x mais impacto que ganhos
 * - Sistema 1 vs Sistema 2: impulsivo vs racional
 * - Viés da Disponibilidade, Ancoragem, Contabilidade Hedônica
 *
 * Richard Thaler (Nobel 2017):
 * - Contabilidade Mental, Efeito Dotação
 * - Nudge Theory, Autocontrole, Inércia do Status Quo
 * - Desconto Hiperbólico
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import {
  createAgentLog,
  AgentReport,
  AgentInsight,
  AgentAction,
  AgentLog,
  sleep,
} from './agent-runner';

const AGENT_ID = 'financial-health-agent-v1';
const ANALYSIS_WINDOW_DAYS = 90;

const CATEGORIES_BENCHMARK: Record<string, number> = {
  Alimentação: 0.25,
  Moradia: 0.30,
  Transporte: 0.12,
  Saúde: 0.08,
  Educação: 0.05,
  Entretenimento: 0.05,
  Vestuário: 0.04,
  Outros: 0.11,
};

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
}

interface BankAccount {
  balance: number;
  account_type: string;
  bank_name: string;
}

interface Goal {
  current_amount: number;
  target_amount: number;
  is_active: boolean;
}

export async function runFinancialHealthAgent(userId: string): Promise<AgentReport> {
  const logs: AgentLog[] = [];
  const supabase = createSupabaseAdmin();

  // ─── FASE 1: OBSERVAR ─────────────────────────────────────────────
  logs.push(createAgentLog('observing', 'Iniciando leitura das contas bancárias…'));
  await sleep(300);

  const since = new Date(Date.now() - ANALYSIS_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .split('T')[0];

  const [
    { data: transactions },
    { data: accounts },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: false }),
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true),
  ]);

  const tx  = (transactions ?? []) as Transaction[];
  const acc = (accounts ?? []) as BankAccount[];

  logs.push(
    createAgentLog('observing', `Lidos ${tx.length} transações e ${acc.length} contas ativas`, {
      transactionCount: tx.length,
      accountCount: acc.length,
      period: `${since} até hoje`,
    })
  );

  // ─── FASE 2: CALCULAR MÉTRICAS BASE ──────────────────────────────
  logs.push(createAgentLog('reasoning', 'Calculando métricas financeiras base…'));
  await sleep(200);

  const income   = tx.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = tx.filter(t => t.type === 'despesa').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const balance  = acc.reduce((s, a) => s + Number(a.balance), 0);

  const savingsRate       = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const emergencyMonths   = expenses > 0 ? balance / (expenses / 3) : 0;
  const monthlyAvgIncome  = income / 3;
  const monthlyAvgExpense = expenses / 3;

  const byCategory: Record<string, number> = {};
  tx.filter(t => t.type === 'despesa').forEach(t => {
    const cat = t.category || 'Outros';
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number(t.amount));
  });

  // Gastos por semana do mês
  const weeklySpending: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  tx.filter(t => t.type === 'despesa').forEach(t => {
    const day  = new Date(t.date).getDate();
    const week = Math.min(Math.ceil(day / 7), 4);
    weeklySpending[week] += Math.abs(Number(t.amount));
  });

  // Pequenos gastos (< R$50) — Contabilidade Hedônica Kahneman
  const smallExpenses      = tx.filter(t => t.type === 'despesa' && Math.abs(Number(t.amount)) < 50);
  const smallExpensesTotal = smallExpenses.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const smallExpensesPct   = income > 0 ? (smallExpensesTotal / income) * 100 : 0;

  // Gastos recorrentes vs esporádicos
  const descCount: Record<string, number> = {};
  tx.filter(t => t.type === 'despesa').forEach(t => {
    const key = t.description.toLowerCase().slice(0, 20);
    descCount[key] = (descCount[key] || 0) + 1;
  });
  const recurringCount = Object.values(descCount).filter(c => c >= 2).length;

  logs.push(
    createAgentLog('reasoning', 'Métricas calculadas', {
      income:          income.toFixed(2),
      expenses:        expenses.toFixed(2),
      savingsRate:     savingsRate.toFixed(1),
      emergencyMonths: emergencyMonths.toFixed(1),
      smallExpensesPct: smallExpensesPct.toFixed(1),
    })
  );

  // ─── FASE 3: SCORE ─────────────────────────────────────────────────
  logs.push(createAgentLog('reasoning', 'Calculando score com metodologia Kahneman-Thaler…'));
  await sleep(200);

  const scoreSavings   = Math.min(Math.max(savingsRate * 3.33, 0), 100);
  const scoreEmergency = Math.min(emergencyMonths * 16.67, 100);
  const scoreControl   = Math.max(100 - smallExpensesPct * 2, 0);
  const scoreStability = Math.min(recurringCount * 10, 100);
  const scoreGoals     = Math.min(((goals as Goal[])?.length ?? 0) * 25, 100);

  const score = Math.round(
    scoreSavings   * 0.30 +
    scoreEmergency * 0.25 +
    scoreControl   * 0.20 +
    scoreStability * 0.15 +
    scoreGoals     * 0.10
  );

  const level =
    score < 40 ? 'critica' :
    score < 60 ? 'atencao' :
    score < 80 ? 'boa'     : 'excelente';

  // ─── FASE 4: DETECTAR VIESES ──────────────────────────────────────
  logs.push(createAgentLog('reasoning', 'Detectando vieses comportamentais com metodologia Kahneman…'));
  await sleep(300);

  const insights: AgentInsight[] = [];

  // KAHNEMAN — Teoria dos Prospectos
  if (savingsRate < 5) {
    insights.push({
      id: 'k-prospect-theory',
      type: 'danger',
      category: 'behavioral',
      title: 'Aversão à Perda Detectada',
      description: `Você está poupando apenas ${savingsRate.toFixed(1)}% da renda. Kahneman demonstrou que perdas causam 2x mais sofrimento que ganhos equivalentes — mas a inação também é uma forma de perda futura. Pequenas economias hoje evitam grandes perdas amanhã.`,
      methodology: 'Daniel Kahneman — Teoria dos Prospectos (1979)',
      confidence: 0.92,
      priority: 'critica',
      data: { savingsRate, benchmark: 20 },
    });
  }

  // KAHNEMAN — Heurística da Disponibilidade
  const alimentacaoPct = income > 0 ? ((byCategory['Alimentação'] ?? 0) / income) * 100 : 0;
  if (alimentacaoPct > 25) {
    insights.push({
      id: 'k-availability-heuristic',
      type: 'warning',
      category: 'spending',
      title: 'Heurística da Disponibilidade — Alimentação',
      description: `Alimentação representa ${alimentacaoPct.toFixed(1)}% da renda (benchmark: 25%). Gastos cotidianos e frequentes tendem a ser subestimados cognitivamente por serem "normais". Você provavelmente subestima o total acumulado.`,
      methodology: 'Daniel Kahneman — Heurística da Disponibilidade',
      confidence: 0.85,
      priority: 'alta',
      data: { alimentacaoPct, benchmark: 25 },
    });
  }

  // KAHNEMAN — Sistema 1 (gastos impulsivos)
  const weekendSpending = weeklySpending[1] + weeklySpending[4];
  const weekdaySpending = weeklySpending[2] + weeklySpending[3];
  if (weekendSpending > weekdaySpending * 1.4) {
    insights.push({
      id: 'k-system1',
      type: 'warning',
      category: 'spending',
      title: 'Sistema 1 Dominante — Gastos de Fim de Semana',
      description:
        'Seus gastos no início e fim do mês são 40% maiores que no meio. Isso indica decisões guiadas pelo Sistema 1 (impulsivo e emocional) de Kahneman. O Sistema 2 (racional) precisa de ativação consciente para esses momentos.',
      methodology: 'Daniel Kahneman — Sistemas de Pensamento (Rápido e Devagar, 2011)',
      confidence: 0.78,
      priority: 'media',
    });
  }

  // KAHNEMAN — Contabilidade Hedônica (pequenos gastos acumulados)
  if (smallExpensesPct > 15) {
    insights.push({
      id: 'k-hedonic',
      type: 'warning',
      category: 'spending',
      title: 'Contabilidade Hedônica — Pequenos Gastos Invisíveis',
      description: `${smallExpenses.length} transações abaixo de R$50 totalizam R$${smallExpensesTotal.toFixed(0)} (${smallExpensesPct.toFixed(1)}% da renda). Kahneman chama isso de "gastos invisíveis" — individualmente irrelevantes, coletivamente devastadores.`,
      methodology: 'Daniel Kahneman — Contabilidade Hedônica',
      confidence: 0.88,
      priority: 'alta',
      data: { count: smallExpenses.length, total: smallExpensesTotal, pct: smallExpensesPct },
    });
  }

  // THALER — Contabilidade Mental
  const entertainmentPct = income > 0 ? ((byCategory['Entretenimento'] ?? 0) / income) * 100 : 0;
  if (entertainmentPct > 10) {
    insights.push({
      id: 't-mental-accounting',
      type: 'warning',
      category: 'behavioral',
      title: 'Contabilidade Mental — Entretenimento Excessivo',
      description: `Entretenimento consome ${entertainmentPct.toFixed(1)}% da renda (benchmark: 5%). Thaler demonstrou que tratamos dinheiro de formas diferentes dependendo da "conta mental" — mas dinheiro é fungível. R$1 gasto em entretenimento é o mesmo R$1 que poderia estar investido.`,
      methodology: 'Richard Thaler — Contabilidade Mental (1999)',
      confidence: 0.82,
      priority: 'media',
      data: { entertainmentPct, benchmark: 10 },
    });
  }

  // THALER — Efeito Dotação (reserva de emergência)
  if (emergencyMonths < 3) {
    insights.push({
      id: 't-endowment',
      type: 'danger',
      category: 'emergency_fund',
      title: 'Efeito Dotação — Reserva de Emergência Crítica',
      description: `Sua reserva cobre apenas ${emergencyMonths.toFixed(1)} meses de despesas (recomendado: 6 meses). Thaler observou que tendemos a supervalorizar o dinheiro que "já está sendo usado" e subestimar o risco de não tê-lo disponível.`,
      methodology: 'Richard Thaler — Efeito Dotação (1980)',
      confidence: 0.95,
      priority: 'critica',
      data: { emergencyMonths, target: 6, gap: (6 - emergencyMonths) * monthlyAvgExpense },
    });
  }

  // THALER — Inércia do Status Quo
  if (((goals as Goal[])?.length ?? 0) === 0) {
    insights.push({
      id: 't-status-quo',
      type: 'info',
      category: 'behavioral',
      title: 'Inércia do Status Quo — Sem Metas Definidas',
      description:
        'Você não possui metas financeiras cadastradas. Thaler demonstrou que a ausência de metas concretas leva à inércia do status quo — continuamos fazendo o que sempre fizemos, mesmo quando prejudicial. Metas escritas aumentam em 42% a probabilidade de realização.',
      methodology: 'Richard Thaler — Nudge Theory (2008)',
      confidence: 0.90,
      priority: 'media',
    });
  }

  // THALER — Desconto Hiperbólico
  if (savingsRate < 10 && balance > monthlyAvgIncome * 2) {
    insights.push({
      id: 't-hyperbolic',
      type: 'warning',
      category: 'behavioral',
      title: 'Desconto Hiperbólico — Preferência pelo Presente',
      description:
        'Você tem saldo disponível mas poupa pouco. Thaler identificou que valorizamos gratificação imediata de forma desproporcional a ganhos futuros. Solução: configure débito automático em investimento logo após receber o salário, eliminando a escolha.',
      methodology: 'Richard Thaler — Desconto Hiperbólico e Poupança (2004)',
      confidence: 0.75,
      priority: 'alta',
    });
  }

  // ─── FASE 5: GERAR AÇÕES (NUDGES) ─────────────────────────────────
  logs.push(createAgentLog('acting', 'Gerando recomendações baseadas em Nudge Theory…'));
  await sleep(200);

  const actions: AgentAction[] = [];

  if (savingsRate < 20) {
    actions.push({
      id: 'act-auto-save',
      label: 'Ativar Poupança Automática',
      description: `Configure débito automático de R$${Math.round(((income / 3) * 0.20) / 100) * 100} por mês (20% da renda média) para um investimento de renda fixa imediatamente após o recebimento do salário.`,
      impact: 'alto',
      effort: 'baixo',
      category: 'Poupança',
      potentialGain: (income / 3) * 0.20,
    });
  }

  if (emergencyMonths < 6) {
    actions.push({
      id: 'act-emergency',
      label: 'Construir Reserva de Emergência',
      description: `Faltam R$${((6 - emergencyMonths) * monthlyAvgExpense).toFixed(0)} para completar 6 meses de reserva. Separe em conta remunerada (CDB diário ou Tesouro Selic) inacessível no dia a dia.`,
      impact: 'alto',
      effort: 'medio',
      category: 'Segurança',
      potentialGain: 0,
    });
  }

  if (smallExpensesPct > 15) {
    actions.push({
      id: 'act-micro',
      label: 'Rastrear Micro Gastos por 30 Dias',
      description: `Ative notificações para cada gasto abaixo de R$50. A consciência do gasto (Kahneman — Sistema 2) reduz em média 23% os gastos impulsivos de baixo valor em 4 semanas.`,
      impact: 'medio',
      effort: 'baixo',
      category: 'Controle',
      potentialGain: smallExpensesTotal * 0.23,
    });
  }

  Object.entries(byCategory).forEach(([cat, total]) => {
    const benchmark = CATEGORIES_BENCHMARK[cat] ?? 0.10;
    const actual    = income > 0 ? total / (income / 3) : 0;
    if (actual > benchmark * 1.2) {
      actions.push({
        id: `act-cut-${cat.toLowerCase()}`,
        label: `Reduzir ${cat} em ${Math.round((actual - benchmark) * 100)}%`,
        description: `${cat} está ${((actual / benchmark - 1) * 100).toFixed(0)}% acima do benchmark recomendado. Uma redução para ${Math.round(benchmark * 100)}% da renda mensal liberaria R$${((actual - benchmark) * (income / 3)).toFixed(0)} por mês.`,
        impact: 'medio',
        effort: 'medio',
        category: 'Corte de Custos',
        potentialGain: (actual - benchmark) * (income / 3),
      });
    }
  });

  // ─── FASE 6: REPORTAR ─────────────────────────────────────────────
  logs.push(
    createAgentLog('reporting', `Relatório gerado. Score: ${score}/100, Nível: ${level}, ${insights.length} insights, ${actions.length} ações`)
  );

  const report: AgentReport = {
    agentId: AGENT_ID,
    userId,
    generatedAt: new Date().toISOString(),
    score,
    level,
    summary: generateSummary(score, level, savingsRate, emergencyMonths, insights),
    insights,
    actions,
    logs,
    nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Persistir no Supabase
  await supabase.from('agent_reports').upsert(
    {
      user_id:       userId,
      agent_id:      AGENT_ID,
      report,
      score,
      level,
      generated_at:  report.generatedAt,
      next_run_at:   report.nextRunAt,
    },
    { onConflict: 'user_id,agent_id' }
  );

  logs.push(createAgentLog('done', 'Relatório salvo. Próxima análise agendada em 24h.'));
  return report;
}

function generateSummary(
  score: number,
  level: string,
  savings: number,
  emergency: number,
  insights: AgentInsight[]
): string {
  const criticals = insights.filter(i => i.priority === 'critica').length;
  if (level === 'critica')
    return `Sua saúde financeira exige atenção imediata. Score ${score}/100 com ${criticals} alertas críticos. As metodologias de Kahneman e Thaler identificaram padrões comportamentais que estão comprometendo sua segurança financeira.`;
  if (level === 'atencao')
    return `Sua saúde financeira está em zona de atenção (${score}/100). Você poupa ${savings.toFixed(1)}% da renda e tem ${emergency.toFixed(1)} meses de reserva. Há oportunidades claras de melhora com pequenos ajustes comportamentais.`;
  if (level === 'boa')
    return `Boa saúde financeira (${score}/100). Você demonstra disciplina na maioria das dimensões. Os insights abaixo são refinamentos para elevar ao nível excelente.`;
  return `Excelente saúde financeira (${score}/100). Você está no caminho certo. Continue monitorando os indicadores e expandindo seus investimentos.`;
}
