-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTAS BANCÁRIAS
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('corrente','poupanca','salario','internacional')),
  agency TEXT,
  account_number TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSAÇÕES
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES bank_accounts(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT CHECK (type IN ('receita','despesa','transferencia')) NOT NULL,
  category TEXT,
  subcategory TEXT,
  tags TEXT[],
  source TEXT CHECK (source IN ('manual','extrato_pdf','extrato_csv','extrato_ofx','extrato_xlsx','api')) DEFAULT 'manual',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPLOADS DE EXTRATOS
CREATE TABLE IF NOT EXISTS statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES bank_accounts(id),
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf','csv','ofx','xlsx')) NOT NULL,
  file_url TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','completed','error')),
  transactions_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- METAS FINANCEIRAS
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  category TEXT,
  color TEXT DEFAULT 'rgba(10,132,255,1)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATIVOS DA CARTEIRA
CREATE TABLE IF NOT EXISTS portfolio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT,
  asset_type TEXT CHECK (asset_type IN ('acao_br','fii','bdr','etf_ouro','renda_fixa','acao_us','reit','bond')) NOT NULL,
  exchange TEXT CHECK (exchange IN ('B3','NYSE','NASDAQ','OTHER')) NOT NULL,
  quantity DECIMAL(15,6) NOT NULL DEFAULT 0,
  avg_price DECIMAL(15,6) NOT NULL DEFAULT 0,
  current_price DECIMAL(15,6),
  currency TEXT DEFAULT 'BRL',
  sector TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSAÇÕES DE INVESTIMENTO
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES portfolio_assets(id),
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('compra','venda','bonificacao','desdobramento','grupamento')) NOT NULL,
  quantity DECIMAL(15,6) NOT NULL,
  price DECIMAL(15,6) NOT NULL,
  fees DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2),
  broker TEXT,
  source TEXT CHECK (source IN ('manual','b3_nota','csv','xlsx','pdf')) DEFAULT 'manual',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROVENTOS
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES portfolio_assets(id),
  ticker TEXT NOT NULL,
  type TEXT CHECK (type IN ('dividendo','jcp','rendimento','amortizacao','dividend_us','interest')) NOT NULL,
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

-- SNAPSHOTS DA CARTEIRA
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- EVENTOS FISCAIS
CREATE TABLE IF NOT EXISTS tax_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER,
  ticker TEXT,
  asset_type TEXT,
  event_type TEXT CHECK (event_type IN ('venda_at20k','venda_ac20k','swing_trade','day_trade','fii_rendimento','dividendo_br','jcp','dividendo_us','renda_fixa_ir','salario','outros_rendimentos')) NOT NULL,
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

-- DECLARAÇÕES IR
CREATE TABLE IF NOT EXISTS tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- RLS
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

-- POLÍTICAS
CREATE POLICY "own" ON profiles            FOR ALL USING (auth.uid() = id);
CREATE POLICY "own" ON bank_accounts       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON transactions        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON statement_uploads   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON financial_goals     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON portfolio_assets    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON investment_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON dividends           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON tax_events          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own" ON tax_declarations    FOR ALL USING (auth.uid() = user_id);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_tx_user_date     ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_user_date ON investment_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_div_user_date    ON dividends(user_id, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_tax_user_year    ON tax_events(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_portfolio_user   ON portfolio_assets(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_snapshots_user   ON portfolio_snapshots(user_id, snapshot_date DESC);

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('statements','statements',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('investments','investments',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tax-exports','tax-exports',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true) ON CONFLICT DO NOTHING;

-- TRIGGER: auto-criar profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- TRIGGER: updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
