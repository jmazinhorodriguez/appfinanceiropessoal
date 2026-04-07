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

  // Basic stats fallback
  const totalBalance = 25430.50;
  const moIncome = 12400;
  const moExpense = 4320;
  const portfolioValue = 84500;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom Dia';
    if (h < 18) return 'Boa Tarde';
    return 'Boa Noite';
  };

  const name = profile?.full_name?.split(' ')[0] || 'Investidor';
  
  // Dummy data for cash flow
  const cashFlowData = [
    { month: 'Out', receitas: 11000, despesas: 5200 },
    { month: 'Nov', receitas: 11500, despesas: 4800 },
    { month: 'Dez', receitas: 18000, despesas: 8500 },
    { month: 'Jan', receitas: 12000, despesas: 4100 },
    { month: 'Fev', receitas: 12200, despesas: 3900 },
    { month: 'Mar', receitas: 12400, despesas: 4320 },
  ];

  // Dummy recent history
  const recentTxs: Partial<Transaction>[] = [
    { id: '1', description: 'Salário', category: 'Renda', amount: 12400, type: 'receita', date: '2025-03-05' },
    { id: '2', description: 'Aluguel', category: 'Moradia', amount: -2500, type: 'despesa', date: '2025-03-10' },
    { id: '3', description: 'Supermercado', category: 'Alimentação', amount: -850, type: 'despesa', date: '2025-03-12' },
    { id: '4', description: 'Dividendos US', category: 'Proventos', amount: 340, type: 'receita', date: '2025-03-15' },
    { id: '5', description: 'Energia', category: 'Moradia', amount: -180, type: 'despesa', date: '2025-03-18' },
    { id: '6', description: 'Restaurante', category: 'Alimentação', amount: -220, type: 'despesa', date: '2025-03-20' },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1440, margin: '0 auto' }}>
      
      {/* HERO */}
      <div className="lg-card animate-fade-in" style={{ padding: '32px 40px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <MetricCard title="Saldo em Contas" value={totalBalance} color="blue" icon="wallet" delay={0} change={3.4} />
        <MetricCard title="Receitas do Mês" value={moIncome} color="green" icon="trending-up" delay={100} />
        <MetricCard title="Despesas do Mês" value={moExpense} color="red" icon="trending-down" delay={200} />
        <MetricCard title="Carteira B3/US" value={portfolioValue} color="violet" icon="pie-chart" delay={300} change={1.2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 24, marginBottom: 32 }}>
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
            {recentTxs.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, 
                    background: tx.type === 'receita' ? 'var(--accent-green-g)' : 'var(--accent-red-g)',
                    color: tx.type === 'receita' ? 'var(--accent-green)' : 'var(--accent-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {tx.type === 'receita' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>{tx.category} • {formatDate(tx.date || '')}</p>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'receita' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                  {tx.type === 'receita' ? '+' : ''}{formatBRL(tx.amount || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Ações Rápidas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
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
