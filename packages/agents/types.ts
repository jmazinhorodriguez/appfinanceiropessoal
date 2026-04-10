export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';
export type AgentTrigger = 'cron' | 'event' | 'manual';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';
export type InsightCategory =
  | 'behavioral'
  | 'cashflow'
  | 'savings'
  | 'spending'
  | 'budget'
  | 'emergency_fund'
  | 'portfolio_health'
  | 'asset_fundamental'
  | 'macro'
  | 'micro'
  | 'rebalance'
  | 'risk'
  | 'dividend'
  | 'tax_optimization';

export interface AgentRun {
  id: string;
  agent_type: 'financial_health' | 'portfolio_health';
  user_id: string;
  trigger: AgentTrigger;
  status: AgentStatus;
  started_at: string;
  completed_at?: string;
  insights_generated: number;
  error_message?: string;
  metadata: Record<string, unknown>;
}

export interface AgentInsight {
  id: string;
  user_id: string;
  agent_type: 'financial_health' | 'portfolio_health';
  run_id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  summary: string;
  detail: string;
  methodology: string;
  scientist: string;
  action_label: string;
  action_href: string;
  data: Record<string, unknown>;
  read: boolean;
  dismissed: boolean;
  created_at: string;
  expires_at?: string;
}

export interface FinancialHealthReport {
  score: number;
  level: 'critica' | 'atencao' | 'boa' | 'excelente';
  score_breakdown: {
    savings_rate: number;
    expense_control: number;
    emergency_fund: number;
    income_stability: number;
    budget_adherence: number;
  };
  biases: BehavioralBias[];
  spending_patterns: SpendingPattern[];
  nudges: Nudge[];
  monthly_summary: MonthlySummary;
}

export interface BehavioralBias {
  id: string;
  name: string;
  scientist: 'kahneman' | 'thaler' | 'both';
  theory: string;
  description: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
  action: string;
}

export interface SpendingPattern {
  category: string;
  amount: number;
  pct_of_income: number;
  benchmark_pct: number;
  trend: 'up' | 'down' | 'stable';
  status: 'ok' | 'warning' | 'danger';
}

export interface Nudge {
  id: string;
  type: 'save' | 'cut' | 'invest' | 'alert' | 'congratulate';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potential_saving: number;
  action: string;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
  top_categories: Array<{ category: string; amount: number; pct: number }>;
  vs_previous_month: { income: number; expenses: number; savings: number };
}

export interface PortfolioHealthReport {
  score: number;
  level: 'critico' | 'atencao' | 'bom' | 'excelente';
  total_value: number;
  total_cost: number;
  total_return_pct: number;
  total_return_brl: number;
  asset_analysis: AssetAnalysis[];
  macro_analysis: MacroAnalysis;
  micro_analysis: MicroAnalysis[];
  rebalance_suggestions: RebalanceSuggestion[];
  risk_metrics: RiskMetrics;
  dividend_summary: DividendSummary;
  tax_optimization: TaxOptimization[];
}

export interface AssetAnalysis {
  ticker: string;
  name: string;
  asset_type: string;
  current_price: number;
  target_price: number;
  upside_pct: number;
  rating: 'compra_forte' | 'compra' | 'neutro' | 'venda' | 'venda_forte';
  fundamentals: Record<string, number | string>;
  methodology: string;
  scientist: string;
  thesis: string;
  risks: string[];
}

export interface MacroAnalysis {
  selic_rate: number;
  ipca: number;
  gdp_growth: number;
  usd_brl: number;
  ibovespa_pe: number;
  market_phase: 'bull' | 'bear' | 'sideways' | 'recovery';
  shiller_cape: number;
  tobin_q: number;
  summary: string;
  impact_on_portfolio: string;
}

export interface MicroAnalysis {
  ticker: string;
  pe_ratio: number;
  pb_ratio: number;
  dividend_yield: number;
  roe: number;
  debt_ebitda: number;
  revenue_growth: number;
  fair_value: number;
  current_price: number;
  margin_of_safety: number;
  fink_esg_score: number;
}

export interface RebalanceSuggestion {
  ticker: string;
  current_pct: number;
  target_pct: number;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  estimated_value: number;
  reason: string;
}

export interface RiskMetrics {
  portfolio_beta: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  var_95: number;
  concentration_risk: number;
  simons_momentum_score: number;
  kahn_alpha_factor: number;
}

export interface DividendSummary {
  total_received_12m: number;
  projected_annual: number;
  yield_on_cost: number;
  next_payments: Array<{
    ticker: string;
    ex_date: string;
    payment_date: string;
    estimated_value: number;
  }>;
}

export interface TaxOptimization {
  ticker: string;
  opportunity: string;
  potential_saving: number;
  deadline: string;
  action: string;
}
