
-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('corrente','poupanca','salario','internacional')),
  agency TEXT,
  account_number TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES bank_accounts(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT CHECK (type IN ('receita','despesa','transferencia')),
  category TEXT,
  subcategory TEXT,
  tags TEXT[],
  source TEXT CHECK (source IN ('manual','extrato_pdf','extrato_csv','extrato_ofx','extrato_xlsx','api')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STATEMENT UPLOADS
CREATE TABLE IF NOT EXISTS statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES bank_accounts(id),
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf','csv','ofx','xlsx')),
  file_url TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','completed','error')),
  transactions_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FINANCIAL GOALS
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  category TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIO ASSETS
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  asset_type TEXT CHECK (asset_type IN ('acao_br','fii','bdr','etf_ouro','renda_fixa','acao_us','reit','bond')),
  exchange TEXT CHECK (exchange IN ('B3','NYSE','NASDAQ','OTHER')),
  quantity DECIMAL(15,6) NOT NULL DEFAULT 0,
  avg_price DECIMAL(15,6) NOT NULL DEFAULT 0,
  current_price DECIMAL(15,6),
  currency TEXT DEFAULT 'BRL',
  sector TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVESTMENT TRANSACTIONS
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES portfolio_assets(id),
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('compra','venda','bonificacao','desdobramento','grupamento')),
  quantity DECIMAL(15,6) NOT NULL,
  price DECIMAL(15,6) NOT NULL,
  fees DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2),
  broker TEXT,
  source TEXT CHECK (source IN ('manual','b3_nota','csv','xlsx','pdf')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DIVIDENDS
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES portfolio_assets(id),
  ticker TEXT NOT NULL,
  type TEXT CHECK (type IN ('dividendo','jcp','rendimento','amortizacao','dividend_us','interest')),
  ex_date DATE NOT NULL,
  payment_date DATE,
  amount_per_share DECIMAL(15,6),
  quantity_held DECIMAL(15,6),
  gross_amount DECIMAL(15,2),
  tax_withheld DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIO SNAPSHOTS
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_value DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  total_profit DECIMAL(15,2),
  total_return_pct DECIMAL(8,4),
  by_asset_type JSONB,
  by_sector JSONB,
  by_exchange JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAX EVENTS
CREATE TABLE IF NOT EXISTS tax_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER,
  ticker TEXT,
  asset_type TEXT,
  event_type TEXT CHECK (event_type IN ('venda_at20k','venda_ac20k','swing_trade','day_trade','fii_rendimento','dividendo_br','jcp','dividendo_us','renda_fixa_ir','salario','outros_rendimentos')),
  gross_amount DECIMAL(15,2),
  tax_rate DECIMAL(5,4),
  tax_due DECIMAL(15,2),
  tax_paid DECIMAL(15,2) DEFAULT 0,
  darf_code TEXT,
  darf_due_date DATE,
  is_exempt BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TAX DECLARATIONS
CREATE TABLE IF NOT EXISTS tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','concluida','entregue')),
  summary JSONB,
  total_assets JSONB,
  income_exempt DECIMAL(15,2) DEFAULT 0,
  income_taxable DECIMAL(15,2) DEFAULT 0,
  tax_withheld DECIMAL(15,2) DEFAULT 0,
  tax_due DECIMAL(15,2) DEFAULT 0,
  losses_to_offset DECIMAL(15,2) DEFAULT 0,
  export_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_data" ON bank_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON statement_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON portfolio_assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON investment_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON dividends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON tax_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_data" ON tax_declarations FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_investment_tx_user ON investment_transactions(user_id, date DESC);
CREATE INDEX idx_dividends_user_date ON dividends(user_id, ex_date DESC);
CREATE INDEX idx_tax_events_user_year ON tax_events(user_id, year);
CREATE INDEX idx_portfolio_assets_user ON portfolio_assets(user_id);

-- Buckets (If manual execution required)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('statements','statements',false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('investments','investments',false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tax-exports','tax-exports',false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE FUNCTION handle_new_user();
