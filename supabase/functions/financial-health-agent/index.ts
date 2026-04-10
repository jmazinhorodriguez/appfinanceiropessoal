import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Buscar todos os usuários com agente financeiro ativo
  const { data: configs } = await supabase
    .from('agent_configs')
    .select('user_id')
    .eq('financial_health_enabled', true);

  const results = await Promise.allSettled(
    (configs ?? []).map((c: { user_id: string }) => runFinancialHealthAgent(c.user_id, supabase))
  );

  return new Response(JSON.stringify({
    processed: results.length,
    fulfilled: results.filter(r => r.status === 'fulfilled').length,
    rejected: results.filter(r => r.status === 'rejected').length,
  }), { headers: { 'Content-Type': 'application/json' } });
});

async function runFinancialHealthAgent(userId: string, supabase: ReturnType<typeof createClient>) {
  // 1. Registrar início do run
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({
      agent_type: 'financial_health',
      user_id: userId,
      trigger: 'cron',
      status: 'running',
    })
    .select()
    .single();

  try {
    // 2. Coletar dados dos últimos 90 dias
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [{ data: transactions }, { data: accounts }, { data: goals }] = await Promise.all([
      supabase.from('transactions').select('*')
        .eq('user_id', userId)
        .gte('date', since)
        .order('date', { ascending: true }),
      supabase.from('bank_accounts').select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase.from('financial_goals').select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
    ]);

    const txns = transactions ?? [];
    const accs = accounts ?? [];

    // 3. Calcular métricas base
    const income = txns
      .filter((t: Record<string, unknown>) => t.type === 'receita')
      .reduce((s: number, t: Record<string, unknown>) => s + Number(t.amount), 0);
    const expenses = txns
      .filter((t: Record<string, unknown>) => t.type === 'despesa')
      .reduce((s: number, t: Record<string, unknown>) => s + Math.abs(Number(t.amount)), 0);
    const balance = accs.reduce((s: number, a: Record<string, unknown>) => s + Number(a.balance), 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const monthlyIncome = income / 3;
    const emergencyMonths = monthlyIncome > 0 ? balance / monthlyIncome : 0;

    // Gastos por categoria
    const byCategory: Record<string, number> = {};
    txns
      .filter((t: Record<string, unknown>) => t.type === 'despesa')
      .forEach((t: Record<string, unknown>) => {
        const cat = (t.category as string) || 'Outros';
        byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number(t.amount));
      });

    // 4. ANÁLISE KAHNEMAN — Teoria dos Prospectos + Sistema 1 vs 2
    const kahnemanBiases = analyzeKahneman({
      savingsRate, expenses, income, byCategory,
      emergencyMonths, transactions: txns
    });

    // 5. ANÁLISE THALER — Nudge Theory + Contabilidade Mental
    const thalerBiases = analyzeThaler({
      savingsRate, byCategory, income, expenses,
      balance, goals: goals ?? [], transactions: txns
    });

    const allBiases = [...kahnemanBiases, ...thalerBiases];

    // 6. Score composto
    const savingsScore   = Math.min(savingsRate * 3.33, 100);
    const expenseScore   = expenses <= income * 0.80
      ? 100
      : Math.max(0, 100 - ((expenses / income) - 0.80) * 500);
    const emergencyScore = Math.min(emergencyMonths * 16.67, 100);
    const stabilityScore = calculateIncomeStability(txns);
    const biasScore      = Math.max(
      0,
      100
        - allBiases.filter((b: BiasResult) => b.severity === 'high').length * 20
        - allBiases.filter((b: BiasResult) => b.severity === 'medium').length * 10
    );

    const score = Math.round(
      savingsScore   * 0.30 +
      expenseScore   * 0.25 +
      emergencyScore * 0.20 +
      stabilityScore * 0.15 +
      biasScore      * 0.10
    );

    const level = score < 40 ? 'critica' : score < 60 ? 'atencao' : score < 80 ? 'boa' : 'excelente';

    // 7. Spending patterns com benchmarks 50/30/20
    const benchmarks: Record<string, number> = {
      'Moradia': 30, 'Alimentação': 15, 'Transporte': 10,
      'Saúde': 5, 'Educação': 5, 'Entretenimento': 5,
      'Vestuário': 3, 'Outros': 7,
    };
    const spendingPatterns = Object.entries(byCategory).map(([cat, amount]) => {
      const pct = income > 0 ? (amount / income) * 100 : 0;
      const bench = benchmarks[cat] ?? 5;
      return {
        category: cat,
        amount,
        pct_of_income: pct,
        benchmark_pct: bench,
        trend: 'stable' as const,
        status: (pct > bench * 1.4 ? 'danger' : pct > bench * 1.1 ? 'warning' : 'ok') as 'danger' | 'warning' | 'ok',
      };
    });

    // 8. Nudges baseados em Thaler
    const nudges = generateNudges({
      savingsRate, byCategory, income, expenses,
      emergencyMonths, goals: goals ?? [], biases: allBiases
    });

    // 9. Relatório completo
    const report = {
      score, level,
      score_breakdown: {
        savings_rate:     Math.round(savingsScore),
        expense_control:  Math.round(expenseScore),
        emergency_fund:   Math.round(emergencyScore),
        income_stability: Math.round(stabilityScore),
        budget_adherence: Math.round(biasScore),
      },
      biases: allBiases,
      spending_patterns: spendingPatterns,
      nudges,
      monthly_summary: {
        income:      income / 3,
        expenses:    expenses / 3,
        savings:     savings / 3,
        savings_rate: savingsRate,
        top_categories: Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category, amount]) => ({
            category,
            amount: amount / 3,
            pct: income > 0 ? (amount / income) * 100 : 0,
          })),
        vs_previous_month: { income: 0, expenses: 0, savings: 0 },
      },
    };

    // 10. Salvar snapshot
    await supabase.from('financial_snapshots').upsert({
      user_id: userId,
      snapshot_date: new Date().toISOString().split('T')[0],
      report,
      score,
      level,
    }, { onConflict: 'user_id,snapshot_date' });

    // 11. Gerar insights individuais para o feed
    const insights = buildInsights(userId, run.id, allBiases, nudges, report);
    if (insights.length > 0) {
      await supabase.from('agent_insights').insert(insights);
    }

    // 12. Finalizar run
    await supabase.from('agent_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      insights_generated: insights.length,
    }).eq('id', run.id);

    return { score, level, insights: insights.length };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    await supabase.from('agent_runs').update({
      status: 'error',
      completed_at: new Date().toISOString(),
      error_message: message,
    }).eq('id', run.id);
    throw err;
  }
}

// ── TIPOS INTERNOS ────────────────────────────────────────────────────────
interface BiasResult {
  id: string;
  name: string;
  scientist: string;
  theory: string;
  description: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
  action: string;
}

interface NudgeResult {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  potential_saving: number;
  action: string;
}

// ── KAHNEMAN ──────────────────────────────────────────────────────────────
function analyzeKahneman({
  savingsRate,
  income,
  byCategory,
  emergencyMonths,
  transactions,
}: {
  savingsRate: number;
  expenses: number;
  income: number;
  byCategory: Record<string, number>;
  emergencyMonths: number;
  transactions: Record<string, unknown>[];
}): BiasResult[] {
  const biases: BiasResult[] = [];

  // 1. Aversão à Perda (Loss Aversion) — Kahneman & Tversky 1979
  if (savingsRate < 10) {
    biases.push({
      id: 'loss_aversion',
      name: 'Aversão à Perda',
      scientist: 'kahneman',
      theory: 'Teoria dos Prospectos (1979)',
      description:
        'As perdas pesam psicologicamente 2x mais do que ganhos equivalentes. Você pode estar evitando investir por medo de perder, mantendo o dinheiro parado.',
      evidence: `Taxa de poupança atual: ${savingsRate.toFixed(1)}% (recomendado: mínimo 20%)`,
      severity: savingsRate < 5 ? 'high' : 'medium',
      action: 'Configure um débito automático no dia do pagamento para investimento antes de gastar.',
    });
  }

  // 2. Ilusão de Foco (Focusing Illusion) — Kahneman 2006
  const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCat && income > 0 && topCat[1] / income > 0.30) {
    biases.push({
      id: 'focusing_illusion',
      name: 'Ilusão de Foco',
      scientist: 'kahneman',
      theory: 'Focagem Cognitiva — Kahneman (2006)',
      description:
        'Concentrar excessivamente gastos em uma categoria cria a ilusão de que aquele gasto traz mais satisfação do que realmente traz.',
      evidence: `${topCat[0]} representa ${((topCat[1] / income) * 100).toFixed(1)}% da sua renda`,
      severity: 'medium',
      action: `Reduza gradualmente ${topCat[0]} em 10% nos próximos 2 meses e observe se seu bem-estar muda.`,
    });
  }

  // 3. Sistema 1 vs Sistema 2 — Compras impulsivas
  const smallTxns = transactions.filter(
    (t) =>
      t.type === 'despesa' &&
      Math.abs(Number(t.amount)) < 50 &&
      (t.category === 'Alimentação' || t.category === 'Entretenimento')
  );
  if (smallTxns.length > 20) {
    biases.push({
      id: 'system1_impulse',
      name: 'Pensamento Sistema 1 — Impulso',
      scientist: 'kahneman',
      theory: 'Pensamento Rápido e Lento (2011)',
      description:
        'O Sistema 1 (rápido, automático) domina suas decisões de pequenas compras. Cada micro-compra parece insignificante, mas acumulam-se silenciosamente.',
      evidence: `${smallTxns.length} micro-transações detectadas (< R$ 50 em alimentação/entretenimento)`,
      severity: 'medium',
      action: 'Regra dos 24h: espere 24h antes de qualquer compra não planejada, mesmo pequenas.',
    });
  }

  // 4. Viés do Presente (Present Bias) — Kahneman & Frederick 2002
  if (emergencyMonths < 3) {
    biases.push({
      id: 'present_bias',
      name: 'Viés do Presente',
      scientist: 'kahneman',
      theory: 'Desconto Hiperbólico — Kahneman & Frederick (2002)',
      description:
        'Você sobrevalora o presente e subvalora o futuro, preferindo consumir hoje a garantir segurança amanhã.',
      evidence: `Reserva de emergência: ${emergencyMonths.toFixed(1)} meses (mínimo recomendado: 6 meses)`,
      severity: emergencyMonths < 1 ? 'high' : 'medium',
      action:
        'Crie uma conta separada para emergências e transfira R$ X automático todo mês (comece com 5% da renda).',
    });
  }

  return biases;
}

// ── THALER ────────────────────────────────────────────────────────────────
function analyzeThaler({
  savingsRate,
  byCategory,
  income,
  goals,
}: {
  savingsRate: number;
  byCategory: Record<string, number>;
  income: number;
  expenses: number;
  balance: number;
  goals: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
}): BiasResult[] {
  const biases: BiasResult[] = [];

  // 1. Contabilidade Mental (Mental Accounting) — Thaler 1985
  const entertainment = byCategory['Entretenimento'] || 0;
  const food = byCategory['Alimentação'] || 0;
  if (income > 0 && (entertainment + food) / income > 0.25) {
    biases.push({
      id: 'mental_accounting',
      name: 'Contabilidade Mental',
      scientist: 'thaler',
      theory: 'Mental Accounting — Thaler (1985)',
      description:
        'Você trata o dinheiro de forma diferente dependendo de sua origem ou destino, criando "contas mentais" que justificam gastos excessivos em certas categorias.',
      evidence: `Alimentação + Entretenimento: ${(((entertainment + food) / income) * 100).toFixed(1)}% da renda (limite saudável: 20%)`,
      severity: (entertainment + food) / income > 0.35 ? 'high' : 'medium',
      action:
        'Unifique mentalmente todo seu dinheiro em uma única conta. Use o método envelope digital: separe fisicamente no app.',
    });
  }

  // 2. Efeito Dotação (Endowment Effect) — Thaler 1980
  const hasGoals = goals.length > 0;
  const goalsProgress = goals.filter(
    (g) => Number(g.current_amount) / Number(g.target_amount) < 0.10
  );
  if (hasGoals && goalsProgress.length > 0) {
    biases.push({
      id: 'endowment_effect',
      name: 'Efeito Dotação',
      scientist: 'thaler',
      theory: 'Endowment Effect — Thaler (1980)',
      description:
        'Você superestima o valor do que já possui e resiste a redirecionar recursos para metas futuras, mesmo que sejam mais importantes.',
      evidence: `${goalsProgress.length} meta(s) com menos de 10% de progresso`,
      severity: 'medium',
      action: 'Automatize contribuições mensais para suas metas. O que não vemos, não sentimos falta.',
    });
  }

  // 3. Nudge — Inércia (Status Quo Bias) — Thaler & Sunstein
  if (savingsRate < 5) {
    biases.push({
      id: 'status_quo_inertia',
      name: 'Inércia — Viés do Status Quo',
      scientist: 'thaler',
      theory: 'Nudge Theory — Thaler & Sunstein (2008)',
      description:
        'A inércia financeira mantém você no mesmo padrão de gastos mês após mês. Sem uma mudança intencional de arquitetura de escolha, nada muda.',
      evidence: 'Taxa de poupança abaixo de 5% por período prolongado',
      severity: 'high',
      action:
        'Mude o padrão: configure poupança automática como "opt-out" (padrão ativo). Dificulte gastar, facilite poupar.',
    });
  }

  // 4. Teoria do Empurrão — oportunidade positiva
  const alimentacaoPct = income > 0 ? (byCategory['Alimentação'] || 0) / income : 0;
  if (alimentacaoPct > 0.20) {
    biases.push({
      id: 'nudge_food',
      name: 'Oportunidade de Nudge — Alimentação',
      scientist: 'thaler',
      theory: 'Nudge — Paternalismo Libertário — Thaler (2008)',
      description:
        'Um pequeno empurrão pode reduzir seus gastos com alimentação sem sacrifício percebido.',
      evidence: `Alimentação representa ${(alimentacaoPct * 100).toFixed(1)}% da renda. Acima do benchmark de 15%.`,
      severity: 'low',
      action:
        'Planeje o cardápio semanal todo domingo. Estudos de Thaler mostram redução média de 23% no gasto com alimentação.',
    });
  }

  return biases;
}

// ── UTILITÁRIOS ──────────────────────────────────────────────────────────
function calculateIncomeStability(transactions: Record<string, unknown>[]): number {
  const monthlyIncome: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'receita')
    .forEach((t) => {
      const key = (t.date as string).substring(0, 7);
      monthlyIncome[key] = (monthlyIncome[key] || 0) + Number(t.amount);
    });
  const values = Object.values(monthlyIncome);
  if (values.length < 2) return 70;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  return Math.max(0, Math.min(100, 100 - cv * 100));
}

function generateNudges({
  savingsRate,
  byCategory,
  income,
  emergencyMonths,
}: {
  savingsRate: number;
  byCategory: Record<string, number>;
  income: number;
  expenses: number;
  emergencyMonths: number;
  goals: Record<string, unknown>[];
  biases: BiasResult[];
}): NudgeResult[] {
  const nudges: NudgeResult[] = [];

  if (savingsRate < 20) {
    nudges.push({
      id: 'increase_savings',
      type: 'save',
      priority: savingsRate < 10 ? 'high' : 'medium',
      title: 'Aumente sua taxa de poupança',
      description: `Você poupa ${savingsRate.toFixed(1)}% da renda. A regra 50/30/20 de Thaler recomenda 20%. Aumentar R$ ${Math.round((income / 3) * 0.05)} por mês já faz diferença.`,
      potential_saving: Math.round((income / 3) * (0.20 - savingsRate / 100)),
      action: 'Configurar poupança automática',
    });
  }

  if (emergencyMonths < 6) {
    nudges.push({
      id: 'emergency_fund',
      type: 'alert',
      priority: emergencyMonths < 2 ? 'high' : 'medium',
      title: 'Reserva de emergência incompleta',
      description: `Você tem ${emergencyMonths.toFixed(1)} meses de reserva. Kahneman demonstra que a ausência de reserva amplifica a aversão ao risco e paralisa decisões.`,
      potential_saving: 0,
      action: 'Criar meta de reserva de emergência',
    });
  }

  const topExpense = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topExpense && income > 0 && topExpense[1] / (income / 3) > 0.25) {
    nudges.push({
      id: 'cut_top_expense',
      type: 'cut',
      priority: 'medium',
      title: `Reduza gastos com ${topExpense[0]}`,
      description: `${topExpense[0]} é seu maior gasto (${((topExpense[1] / income) * 100).toFixed(1)}% da renda). Reduzir 15% libera R$ ${Math.round(topExpense[1] * 0.15 / 3)}/mês.`,
      potential_saving: Math.round(topExpense[1] * 0.15 / 3),
      action: `Revisar gastos com ${topExpense[0]}`,
    });
  }

  if (savingsRate > 25) {
    nudges.push({
      id: 'start_investing',
      type: 'invest',
      priority: 'high',
      title: 'Você está pronto para investir mais',
      description: `Parabéns! Taxa de poupança de ${savingsRate.toFixed(1)}%. É hora de fazer o dinheiro trabalhar. Considere aumentar aportes em renda variável.`,
      potential_saving: 0,
      action: 'Ver módulo de investimentos',
    });
  }

  return nudges;
}

function buildInsights(
  userId: string,
  runId: string,
  biases: BiasResult[],
  _nudges: NudgeResult[],
  report: { score: number; level: string }
) {
  const insights = [];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const bias of biases.filter((b) => b.severity !== 'low')) {
    insights.push({
      user_id:      userId,
      run_id:       runId,
      agent_type:   'financial_health',
      category:     'behavioral',
      severity:     bias.severity === 'high' ? 'critical' : 'warning',
      title:        bias.name,
      summary:      bias.description.substring(0, 120) + '...',
      detail:       bias.description,
      methodology:  bias.theory,
      scientist:    bias.scientist === 'kahneman' ? 'Daniel Kahneman' : 'Richard Thaler',
      action_label: 'Ver detalhes',
      action_href:  '/saude-financeira',
      data:         { bias },
      expires_at:   expiresAt,
    });
  }

  insights.push({
    user_id:      userId,
    run_id:       runId,
    agent_type:   'financial_health',
    category:     'cashflow',
    severity:     report.level === 'excelente'
      ? 'positive'
      : report.level === 'critica'
      ? 'critical'
      : 'info',
    title:        `Score de Saúde Financeira: ${report.score}/100`,
    summary:      `Análise automática concluída. Nível ${report.level}. ${biases.length} viés(es) detectado(s).`,
    detail:       'Análise baseada nas metodologias de Kahneman e Thaler dos seus últimos 90 dias de transações.',
    methodology:  'Teoria dos Prospectos + Nudge Theory',
    scientist:    'Daniel Kahneman & Richard Thaler',
    action_label: 'Ver relatório completo',
    action_href:  '/saude-financeira',
    data:         { score: report.score, level: report.level },
    expires_at:   expiresAt,
  });

  return insights;
}
