-- Execuções dos agentes
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('financial_health','portfolio_health')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL CHECK (trigger IN ('cron','event','manual')),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle','running','completed','error')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  insights_generated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Insights gerados pelos agentes
CREATE TABLE agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical','positive')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT NOT NULL,
  methodology TEXT NOT NULL,
  scientist TEXT NOT NULL,
  action_label TEXT,
  action_href TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Configurações dos agentes por usuário
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  financial_health_enabled BOOLEAN DEFAULT TRUE,
  financial_health_schedule TEXT DEFAULT '0 8 * * *',
  portfolio_health_enabled BOOLEAN DEFAULT TRUE,
  portfolio_health_schedule TEXT DEFAULT '0 9 * * 1-5',
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  min_severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots financeiros para histórico
CREATE TABLE financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report JSONB NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- Snapshots de portfólio para histórico
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  total_return_pct DECIMAL(8,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- RLS
ALTER TABLE agent_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_insights  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own agent_runs"      ON agent_runs      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own agent_insights"  ON agent_insights  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own agent_configs"   ON agent_configs   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own fin_snapshots"   ON financial_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own port_snapshots"  ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id);

-- pg_cron para rodar os agentes automaticamente
SELECT cron.schedule('financial-health-agent', '0 8 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/financial-health-agent',
    headers := jsonb_build_object('Authorization','Bearer ' || current_setting('app.service_key')),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule('portfolio-health-agent', '0 9 * * 1-5',
  $$SELECT net.http_post(
    url := current_setting('app.edge_function_url') || '/portfolio-health-agent',
    headers := jsonb_build_object('Authorization','Bearer ' || current_setting('app.service_key')),
    body := '{}'::jsonb
  )$$
);
