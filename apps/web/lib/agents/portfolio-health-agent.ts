/**
 * AGENTE AUTÔNOMO — SAÚDE DE APLICAÇÕES
 *
 * Larry Fink (BlackRock) — ESG + Diversificação Global
 * Jim Simons (Renaissance) — Quant e Momentum
 * Ron Kahn (BlackRock) — Fundamental Law of Active Management
 * Robert Shiller (Yale) — CAPE Ratio e Valuation
 * James Tobin (Yale) — Tobin's Q e Fronteira Eficiente
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

const AGENT_ID = 'portfolio-health-agent-v1';

interface PortfolioAsset {
  ticker: string;
  name: string;
  asset_type: string;
  exchange: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  sector: string;
}

interface MacroData {
  selic: number;
  ipca: number;
  dolar: number;
  ibovespa: number;
  sp500: number;
  capeRatio: number;
}

// Dados macro realistas (em produção integrar com API pública)
function getMacroData(): MacroData {
  return {
    selic:     10.75,
    ipca:      4.83,
    dolar:     5.15,
    ibovespa:  127420,
    sp500:     5232,
    capeRatio: 31.2,
  };
}

// Volatilidade histórica anualizada por tipo de ativo (%)
const VOLATILITY_BY_TYPE: Record<string, number> = {
  acao_br:    28,
  fii:        14,
  bdr:        25,
  etf_ouro:   16,
  renda_fixa:  2,
  acao_us:    22,
  reit:       18,
  bond:        6,
};

// Alocação-alvo teórica por tipo (filosofia Fink/BlackRock)
const TARGET_ALLOCATION: Record<string, number> = {
  renda_fixa: 0.30,
  acao_br:    0.25,
  fii:        0.15,
  acao_us:    0.15,
  bdr:        0.05,
  etf_ouro:   0.05,
  reit:       0.03,
  bond:       0.02,
};

export async function runPortfolioHealthAgent(userId: string): Promise<AgentReport> {
  const logs: AgentLog[] = [];
  const supabase = createSupabaseAdmin();

  // ─── FASE 1: OBSERVAR ─────────────────────────────────────────────
  logs.push(createAgentLog('observing', 'Lendo carteira de investimentos…'));
  await sleep(300);

  const [
    { data: assets },
    { data: dividends },
  ] = await Promise.all([
    supabase
      .from('portfolio_assets')
      .select('*')
      .eq('user_id', userId)
      .gt('quantity', 0),
    supabase
      .from('dividends')
      .select('*')
      .eq('user_id', userId)
      .gte(
        'payment_date',
        new Date(Date.now() - 365 * 86_400_000).toISOString().split('T')[0]
      ),
  ]);

  const portfolio = (assets ?? []) as PortfolioAsset[];
  const macro     = getMacroData();

  logs.push(
    createAgentLog('observing', `Carteira lida: ${portfolio.length} ativos`, {
      tickers: portfolio.map(a => a.ticker),
      macro,
    })
  );

  if (portfolio.length === 0) {
    const emptyReport: AgentReport = {
      agentId:     AGENT_ID,
      userId,
      generatedAt: new Date().toISOString(),
      score:       0,
      level:       'critica',
      summary:
        'Nenhum ativo encontrado na carteira. Importe sua nota de corretagem para iniciar a análise.',
      insights: [],
      actions:  [],
      logs,
      nextRunAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    };
    return emptyReport;
  }

  // ─── FASE 2: CALCULAR PORTFÓLIO ───────────────────────────────────
  logs.push(createAgentLog('reasoning', 'Calculando alocação atual e métricas de risco…'));
  await sleep(400);

  const totalValue = portfolio.reduce(
    (s, a) => s + Number(a.quantity) * Number(a.current_price),
    0
  );
  const totalCost = portfolio.reduce(
    (s, a) => s + Number(a.quantity) * Number(a.avg_price),
    0
  );
  const totalPnL  = totalValue - totalCost;
  const returnPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Alocação por tipo
  const byType: Record<string, number> = {};
  portfolio.forEach(a => {
    byType[a.asset_type] =
      (byType[a.asset_type] || 0) + Number(a.quantity) * Number(a.current_price);
  });

  const allocation: Record<string, number> = {};
  Object.entries(byType).forEach(([type, val]) => {
    allocation[type] = totalValue > 0 ? val / totalValue : 0;
  });

  // Concentração — maior ativo
  const assetValues = portfolio
    .map(a => ({
      ticker: a.ticker,
      value: Number(a.quantity) * Number(a.current_price),
      pct:
        totalValue > 0
          ? (Number(a.quantity) * Number(a.current_price)) / totalValue
          : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const topAssetPct = assetValues[0]?.pct ?? 0;

  // Volatilidade ponderada (Simons)
  const portfolioVolatility = Object.entries(allocation).reduce((s, [type, w]) => {
    return s + w * (VOLATILITY_BY_TYPE[type] ?? 20);
  }, 0);

  // Dividend Yield
  const annualDividends = ((dividends ?? []) as { net_amount: number }[]).reduce(
    (s, d) => s + Number(d.net_amount),
    0
  );
  const dividendYield = totalValue > 0 ? (annualDividends / totalValue) * 100 : 0;

  // Sharpe simplificado (Ron Kahn)
  const riskFreeRate     = macro.selic / 100;
  const returnDecimal    = returnPct / 100;
  const volatilityDecimal = portfolioVolatility / 100;
  const sharpe =
    volatilityDecimal > 0 ? (returnDecimal - riskFreeRate) / volatilityDecimal : 0;

  // Exposição internacional (Fink)
  const intlAllocation =
    (allocation['acao_us'] ?? 0) +
    (allocation['reit']    ?? 0) +
    (allocation['bond']    ?? 0) +
    (allocation['bdr']     ?? 0);

  logs.push(
    createAgentLog('reasoning', 'Métricas calculadas', {
      totalValue:          totalValue.toFixed(2),
      returnPct:           returnPct.toFixed(2),
      sharpe:              sharpe.toFixed(2),
      portfolioVolatility: portfolioVolatility.toFixed(1),
      dividendYield:       dividendYield.toFixed(2),
      intlAllocation:      (intlAllocation * 100).toFixed(1),
      topAssetPct:         (topAssetPct * 100).toFixed(1),
    })
  );

  // ─── FASE 3: INSIGHTS ─────────────────────────────────────────────
  logs.push(createAgentLog('reasoning', 'Analisando macro e micro — Shiller, Tobin, Simons, Kahn, Fink…'));
  await sleep(300);

  const insights: AgentInsight[] = [];

  // SHILLER — CAPE Ratio
  if (macro.capeRatio > 30) {
    insights.push({
      id:          'sh-cape',
      type:        'warning',
      category:    'macro',
      title:       `CAPE Ratio Elevado — Mercado EUA Caro (${macro.capeRatio}x)`,
      description: `O CAPE Ratio de Shiller está em ${macro.capeRatio}x. Historicamente, CAPE > 30 está associado a retornos abaixo da média nos próximos 10 anos (média histórica: 16x). Não significa queda iminente, mas exige expectativas realistas.`,
      methodology: 'Robert Shiller — Cyclically Adjusted Price-to-Earnings (1988)',
      confidence:  0.82,
      priority:    'media',
      data:        { capeRatio: macro.capeRatio, historicalAvg: 16, threshold: 30 },
    });
  }

  // TOBIN — Q implícito
  const tobinQ = riskFreeRate > 0 ? returnDecimal / riskFreeRate : 0;
  if (tobinQ < 1.0) {
    insights.push({
      id:          'tb-q-ratio',
      type:        'warning',
      category:    'risk',
      title:       `Q de Tobin < 1.0 — Risco/Retorno Desfavorável`,
      description: `Seu retorno de ${returnPct.toFixed(1)}% contra SELIC de ${macro.selic}% resulta em Q de Tobin implícito de ${tobinQ.toFixed(2)}. Quando o custo de oportunidade supera o retorno do portfólio, a renda fixa seria mais eficiente neste ciclo.`,
      methodology: 'James Tobin — Separação Portfólio (1958) e Q de Tobin (1969)',
      confidence:  0.79,
      priority:    returnPct < macro.selic ? 'alta' : 'media',
      data:        { returnPct, selic: macro.selic, tobinQ },
    });
  }

  // SIMONS — Concentração
  if (topAssetPct > 0.20) {
    insights.push({
      id:          'si-concentration',
      type:        'danger',
      category:    'risk',
      title:       `Concentração Excessiva — ${assetValues[0]?.ticker} (${(topAssetPct * 100).toFixed(1)}%)`,
      description: `O ativo ${assetValues[0]?.ticker} representa ${(topAssetPct * 100).toFixed(1)}% do portfólio. Simons (Renaissance Technologies) demonstrou que risco não-sistemático é evitável via diversificação estatística. Acima de 20% por ativo, o risco específico domina.`,
      methodology: 'Jim Simons — Gestão Quantitativa e Diversificação (Renaissance Technologies)',
      confidence:  0.91,
      priority:    topAssetPct > 0.35 ? 'critica' : 'alta',
      data:        { ticker: assetValues[0]?.ticker, pct: topAssetPct, threshold: 0.20 },
    });
  }

  // KAHN — Sharpe
  if (sharpe < 0.5) {
    insights.push({
      id:          'kh-sharpe',
      type:        sharpe < 0 ? 'danger' : 'warning',
      category:    'risk',
      title:       `Índice de Sharpe Insuficiente (${sharpe.toFixed(2)})`,
      description: `Sharpe de ${sharpe.toFixed(2)} indica retorno insuficiente para o risco assumido. Ron Kahn (BlackRock) estabelece Sharpe > 0.5 como mínimo para gestão ativa eficiente. Acima de 1.0 é considerado excelente.`,
      methodology: 'Ron Kahn — Fundamental Law of Active Management (1994)',
      confidence:  0.86,
      priority:    sharpe < 0 ? 'critica' : 'alta',
      data:        { sharpe, benchmark: 0.5, portfolioVolatility, returnPct },
    });
  }

  // FINK — Diversificação global
  if (intlAllocation < 0.15) {
    insights.push({
      id:          'fk-global',
      type:        'info',
      category:    'macro',
      title:       `Exposição Internacional Baixa (${(intlAllocation * 100).toFixed(1)}%)`,
      description: `Apenas ${(intlAllocation * 100).toFixed(1)}% em ativos internacionais. Larry Fink (BlackRock) recomenda mínimo de 15-20% em exposição global para carteiras de longo prazo. A descorrelação com o mercado brasileiro reduz o risco sistêmico.`,
      methodology: 'Larry Fink — Alocação Estratégica Global (BlackRock, 2020)',
      confidence:  0.84,
      priority:    intlAllocation < 0.05 ? 'alta' : 'media',
      data:        { intlAllocation, target: 0.20 },
    });
  }

  // FINK — Renda fixa com SELIC alta
  const rendaFixaAlloc = allocation['renda_fixa'] ?? 0;
  if (rendaFixaAlloc < 0.20 && macro.selic > 8) {
    insights.push({
      id:          'fk-fixed-income',
      type:        'warning',
      category:    'rebalance',
      title:       `Renda Fixa Subrepresentada com SELIC a ${macro.selic}%`,
      description: `Com SELIC em ${macro.selic}% e renda fixa ocupando apenas ${(rendaFixaAlloc * 100).toFixed(1)}% do portfólio, você está deixando retorno livre de risco na mesa. Fink recomenda aumentar renda fixa em cenários de juros altos.`,
      methodology: 'Larry Fink — Alocação Tática em Ciclos de Juros (BlackRock)',
      confidence:  0.80,
      priority:    'alta',
      data:        { rendaFixaAlloc, selic: macro.selic, target: 0.30 },
    });
  }

  // SIMONS — Volatilidade excessiva
  if (portfolioVolatility > 25) {
    insights.push({
      id:          'si-volatility',
      type:        'warning',
      category:    'risk',
      title:       `Volatilidade Anualizada Elevada (${portfolioVolatility.toFixed(1)}%)`,
      description: `Volatilidade estimada de ${portfolioVolatility.toFixed(1)}% ao ano. Simons utiliza modelos de redução de volatilidade como eixo central da gestão quantitativa. Portfólios com volatilidade acima de 25% exigem retornos proporcionalmente maiores.`,
      methodology: 'Jim Simons — Modelos Quantitativos de Risco (Medallion Fund)',
      confidence:  0.77,
      priority:    'media',
      data:        { portfolioVolatility, threshold: 25 },
    });
  }

  // SHILLER — Desvio da alocação-alvo
  const typeLabels: Record<string, string> = {
    acao_br:    'Ações BR',
    fii:        'Fundos Imobiliários',
    renda_fixa: 'Renda Fixa',
    acao_us:    'Ações EUA',
    bdr:        'BDRs',
    etf_ouro:   'ETFs/Ouro',
  };
  Object.entries(TARGET_ALLOCATION).forEach(([type, target]) => {
    const actual = allocation[type] ?? 0;
    const drift  = Math.abs(actual - target);
    if (drift > 0.10 && target > 0.05) {
      insights.push({
        id:          `sh-drift-${type}`,
        type:        actual > target ? 'warning' : 'info',
        category:    'rebalance',
        title:       `${typeLabels[type] ?? type}: Desvio de ${(drift * 100).toFixed(0)}% da meta`,
        description: `Alocação atual em ${typeLabels[type] ?? type}: ${(actual * 100).toFixed(1)}% vs meta ${(target * 100).toFixed(0)}%. Shiller recomenda rebalanceamento periódico (anual) para manter o perfil de risco-retorno original.`,
        methodology: 'Robert Shiller — Rebalanceamento e Valuation Relativo',
        confidence:  0.72,
        priority:    drift > 0.20 ? 'alta' : 'media',
        data:        { type, actual, target, drift },
      });
    }
  });

  // ─── FASE 4: AÇÕES ────────────────────────────────────────────────
  logs.push(createAgentLog('acting', 'Gerando plano de ação para a carteira…'));
  await sleep(200);

  const actions: AgentAction[] = [];

  if (topAssetPct > 0.20) {
    actions.push({
      id:          'rebalance-top',
      label:       `Reduzir ${assetValues[0]?.ticker} para 15% do portfólio`,
      description: `Vender parcialmente ${assetValues[0]?.ticker} para reduzir concentração. Alocar o capital em ativos de baixa correlação como renda fixa ou ativos internacionais.`,
      impact:      'alto',
      effort:      'medio',
      category:    'Rebalanceamento',
    });
  }

  if (intlAllocation < 0.15) {
    actions.push({
      id:          'add-international',
      label:       'Aumentar exposição internacional para 15%',
      description: 'Investir em BDRs (AAPL34, MSFT34) ou ETFs internacionais (IVVB11) para atingir exposição de 15% em ativos dolarizados. Proteção cambial e diversificação geográfica.',
      impact:      'alto',
      effort:      'baixo',
      category:    'Diversificação',
      potentialGain: totalValue * 0.05,
    });
  }

  if (rendaFixaAlloc < 0.20 && macro.selic > 8) {
    actions.push({
      id:          'increase-fixed',
      label:       `Alocar ${((0.30 - rendaFixaAlloc) * 100).toFixed(0)}% em Renda Fixa`,
      description: `Com SELIC a ${macro.selic}%, o Tesouro Selic (LFT) e CDBs de bancos médios (100-115% CDI) oferecem retorno real positivo com risco mínimo. Meta: 30% do portfólio.`,
      impact:      'alto',
      effort:      'baixo',
      category:    'Proteção',
      potentialGain: totalValue * (0.30 - rendaFixaAlloc) * (macro.selic / 100),
    });
  }

  if (dividendYield < 4 && (allocation['fii'] ?? 0) < 0.10) {
    actions.push({
      id:          'add-fii',
      label:       'Incluir FIIs de alta qualidade para renda passiva',
      description: `Dividend Yield atual de ${dividendYield.toFixed(1)}%. FIIs de logística e shoppings top tier (HGLG11, XPML11, KNRI11) oferecem DY de 7-9% com isenção de IR para PF. Meta: 15% em FIIs.`,
      impact:      'medio',
      effort:      'baixo',
      category:    'Renda Passiva',
      potentialGain: totalValue * 0.15 * 0.08,
    });
  }

  // ─── FASE 5: SCORE FINAL ──────────────────────────────────────────
  logs.push(createAgentLog('reasoning', 'Calculando score final do portfólio…'));

  const scoreDiversification = Math.max(100 - topAssetPct * 200, 0);
  const scoreSharpePts       = Math.min(Math.max(sharpe * 60, 0), 100);
  const scoreIntl            = Math.min(intlAllocation * 500, 100);
  const scoreVol             = Math.max(100 - portfolioVolatility * 2, 0);
  const scoreDividend        = Math.min(dividendYield * 10, 100);

  const score = Math.round(
    scoreDiversification * 0.30 +
    scoreSharpePts       * 0.25 +
    scoreIntl            * 0.20 +
    scoreVol             * 0.15 +
    scoreDividend        * 0.10
  );

  const level =
    score < 40 ? 'critica' :
    score < 60 ? 'atencao' :
    score < 80 ? 'boa'     : 'excelente';

  // ─── FASE 6: SALVAR ───────────────────────────────────────────────
  const report: AgentReport = {
    agentId:     AGENT_ID,
    userId,
    generatedAt: new Date().toISOString(),
    score,
    level,
    summary:     `Carteira com ${portfolio.length} ativos, valor total ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, retorno de ${returnPct.toFixed(1)}%, Sharpe ${sharpe.toFixed(2)}, volatilidade ${portfolioVolatility.toFixed(1)}% a.a. ${insights.filter(i => i.priority === 'critica' || i.priority === 'alta').length} pontos de atenção identificados.`,
    insights,
    actions,
    logs,
    nextRunAt:   new Date(Date.now() + 24 * 3_600_000).toISOString(),
  };

  await supabase.from('agent_reports').upsert(
    {
      user_id:      userId,
      agent_id:     AGENT_ID,
      report,
      score,
      level,
      generated_at: report.generatedAt,
      next_run_at:  report.nextRunAt,
    },
    { onConflict: 'user_id,agent_id' }
  );

  logs.push(
    createAgentLog('done', `Score final: ${score}/100 (${level}). ${insights.length} insights gerados.`)
  );
  return report;
}
