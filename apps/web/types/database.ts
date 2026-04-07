export type Plan = 'free' | 'pro' | 'premium';
export type AccountType = 'corrente' | 'poupanca' | 'salario' | 'internacional';
export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type AssetType = 'acao_br' | 'fii' | 'bdr' | 'etf_ouro' | 'renda_fixa' | 'acao_us' | 'reit' | 'bond';
export type Exchange = 'B3' | 'NYSE' | 'NASDAQ' | 'OTHER';
export type InvestmentTxType = 'compra' | 'venda' | 'bonificacao' | 'desdobramento' | 'grupamento';
export type DividendType = 'dividendo' | 'jcp' | 'rendimento' | 'amortizacao' | 'dividend_us' | 'interest';
export type UploadStatus = 'processing' | 'completed' | 'error';
export type TaxEventType = 'venda_at20k' | 'venda_ac20k' | 'swing_trade' | 'day_trade' | 'fii_rendimento' | 'dividendo_br' | 'jcp' | 'dividendo_us' | 'renda_fixa_ir' | 'salario' | 'outros_rendimentos';
export type DeclarationStatus = 'em_andamento' | 'concluida' | 'entregue';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: AccountType | null;
  agency: string | null;
  account_number: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  source: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface StatementUpload {
  id: string;
  user_id: string;
  account_id: string | null;
  file_name: string;
  file_type: string;
  file_url: string;
  period_start: string | null;
  period_end: string | null;
  status: UploadStatus;
  transactions_imported: number;
  error_message: string | null;
  created_at: string;
}

export interface PortfolioAsset {
  id: string;
  user_id: string;
  ticker: string;
  name: string | null;
  asset_type: AssetType;
  exchange: Exchange;
  quantity: number;
  avg_price: number;
  current_price: number | null;
  currency: string;
  sector: string | null;
  updated_at: string;
  created_at: string;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  asset_id: string | null;
  ticker: string;
  date: string;
  type: InvestmentTxType;
  quantity: number;
  price: number;
  fees: number;
  total: number | null;
  broker: string | null;
  source: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Dividend {
  id: string;
  user_id: string;
  asset_id: string | null;
  ticker: string;
  type: DividendType;
  ex_date: string;
  payment_date: string | null;
  amount_per_share: number | null;
  quantity_held: number | null;
  gross_amount: number | null;
  tax_withheld: number;
  net_amount: number | null;
  currency: string;
  created_at: string;
}

export interface TaxEvent {
  id: string;
  user_id: string;
  year: number;
  month: number | null;
  ticker: string | null;
  asset_type: string | null;
  event_type: TaxEventType;
  gross_amount: number | null;
  tax_rate: number | null;
  tax_due: number | null;
  tax_paid: number;
  darf_code: string | null;
  darf_due_date: string | null;
  is_exempt: boolean;
  notes: string | null;
  created_at: string;
}

export interface TaxDeclaration {
  id: string;
  user_id: string;
  year: number;
  status: DeclarationStatus;
  summary: Record<string, unknown> | null;
  total_assets: Record<string, unknown> | null;
  income_exempt: number;
  income_taxable: number;
  tax_withheld: number;
  tax_due: number;
  losses_to_offset: number;
  export_url: string | null;
  created_at: string;
}
