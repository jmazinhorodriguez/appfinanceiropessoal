import { getSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/ui/MetricCard';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { Wallet, TrendingUp, TrendingDown, PieChart, Upload, ArrowRightLeft, FileText, HeadphonesIcon } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils/format';
import Link from 'next/link';
import { Transaction, Profile } from '@/types/database';

export default async function DashboardPage() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Fetch initial profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  // Real data fetching
  const { data: accounts } = await supabase.from('contas').select('saldo').eq('user_id', user.id);
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.saldo || 0), 0) || 0;

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data: currentMonthTxs } = await supabase.from('transacoes')
    .select('valor, tipo')
    .eq('user_id', user.id)
    .gte('data', firstDayOfMonth);

  let moIncome = 0;
  let moExpense = 0;
  currentMonthTxs?.forEach(tx => {
    if (tx.tipo === 'receita') moIncome += Number(tx.valor);
    if (tx.tipo === 'despesa') moExpense += Math.abs(Number(tx.valor));
  });

  const { data: assets } = await supabase.from('ativos_carteira').select('quantidade, preco_atual, preco_medio').eq('user_id', user.id);
  const portfolioValue = assets?.reduce((sum, a) => sum + (Number(a.quantidade) * Number(a.preco_atual || a.preco_medio || 0)), 0) || 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom Dia';
    if (h < 18) return 'Boa Tarde';
    return 'Boa Noite';
  };

  const name = profile?.full_name?.split(' ')[0] || 'Investidor';
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const { data: last6moTxs } = await supabase.from('transacoes')
    .select('valor, tipo, data')
    .eq('user_id', user.id)
    .gte('data', sixMonthsAgo.toISOString());

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const flowMap: Record<string, { receitas: number, despesas: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    flowMap[mKey] = { receitas: 0, despesas: 0 };
  }

  last6moTxs?.forEach(tx => {
    // Correct string splitting for date if necessary, assuming tx.data is YYYY-MM-DD
    const d = new Date(tx.data + 'T00:00:00');
    const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    if (flowMap[mKey]) {
      if (tx.tipo === 'receita') flowMap[mKey].receitas += Number(tx.valor);
      if (tx.tipo === 'despesa') flowMap[mKey].despesas += Math.abs(Number(tx.valor));
    }
  });

  const cashFlowData = Object.keys(flowMap).map(k => ({
    month: k.split(' ')[0],
    receitas: flowMap[k].receitas,
    despesas: flowMap[k].despesas
  }));

  const { data: dbRecentTxs } = await supabase.from('transacoes')
    .select('id, valor, tipo, data, descricao, categorias(nome)')
    .eq('user_id', user.id)
    .order('data', { ascending: false })
    .limit(6);

  const recentTxs = dbRecentTxs || [];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 40px)', maxWidth: 1440, margin: '0 auto' }}>
      
      {/* HERO */}
      <div className="lg-card animate-fade-in hero-container" style={{ padding: 'clamp(20px, 4vw, 32px) clamp(20px, 5vw, 40px)', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -100, top: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="badge badge-blue">Mercado Aberto</span>
            <span className="badge badge-violet">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            {getGreeting()}, {name}.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
            Seu patrimônio cresceu <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>+1.2%</span> esta semana.
          </p>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid-cols-4" style={{ marginBottom: 32 }}>
        <MetricCard title="Saldo em Contas" value={totalBalance} color="blue" icon="wallet" delay={0} change={3.4} />
        <MetricCard title="Receitas do Mês" value={moIncome} color="green" icon="trending-up" delay={100} />
        <MetricCard title="Despesas do Mês" value={moExpense} color="red" icon="trending-down" delay={200} />
        <MetricCard title="Carteira B3/US" value={portfolioValue} color="violet" icon="pie-chart" delay={300} change={1.2} />
      </div>

      <div className="grid-layout-main" style={{ marginBottom: 32 }}>
        {/* CHART */}
        <div className="lg-card animate-fade-up" style={{ padding: '24px 32px', animationDelay: '400ms' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>Fluxo de Caixa (6 meses)</h3>
          <CashFlowChart data={cashFlowData} />
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg-card animate-fade-up" style={{ padding: '24px', animationDelay: '500ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Atividade Recente</h3>
            <Link href="/contas" style={{ fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Ver todas</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recentTxs.map((tx: any) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: tx.tipo === 'receita' ? 'var(--accent-green-g)' : 'var(--accent-red-g)',
                    color: tx.tipo === 'receita' ? 'var(--accent-green)' : 'var(--accent-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {tx.tipo === 'receita' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{tx.descricao}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>{tx.categorias?.nome || 'Outros'} • {formatDate(tx.data || '')}</p>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: tx.tipo === 'receita' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                  {tx.tipo === 'receita' ? '+' : ''}{formatBRL(tx.valor || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Ações Rápidas</h3>
      <div className="grid-cols-4" style={{ marginBottom: 32 }}>
        {[
          { title: 'Importar Extrato', icon: Upload, path: '/contas' },
          { title: 'Nova Transferência', icon: ArrowRightLeft, path: '#' },
          { title: 'Relatórios Fiscais', icon: FileText, path: '/imposto-renda' },
          { title: 'Falar com IA', icon: HeadphonesIcon, path: '/saude-financeira' },
        ].map((act, i) => (
          <Link key={i} href={act.path} style={{ textDecoration: 'none' }}>
            <div className="lg-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-blue-g)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <act.icon size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
