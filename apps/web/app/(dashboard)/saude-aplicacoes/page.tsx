'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Zap, Layers, BarChart3, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatBRL, formatPct } from '@/lib/utils/format';

export default function SaudeAplicacoesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching portfolio analysis
    setTimeout(() => {
      setData({
        score: 72,
        risk: 'Moderado',
        diversification: {
          assetTypes: [
            { name: 'Ações BR', value: 35 },
            { name: 'FIIs', value: 25 },
            { name: 'Internacional', value: 20 },
            { name: 'Ouro', value: 10 },
            { name: 'Renda Fixa', value: 10 },
          ],
          sectors: [
            { name: 'Financeiro', value: 30 },
            { name: 'Tecnologia', value: 20 },
            { name: 'Imobiliário', value: 25 },
            { name: 'Energia', value: 15 },
            { name: 'Varejo', value: 10 },
          ]
        },
        insights: [
          { type: 'risk', title: 'Exposição Setorial', desc: 'Sua carteira está 30% concentrada no setor Financeiro. Considere aumentar exposição em Materiais Básicos.' },
          { type: 'opportunity', title: 'Proteção Cambial', desc: 'Exposição internacional em 20% é saudável, mas GOLD11 pode ser aumentado para 15% como hedge.' },
          { type: 'efficiency', title: 'Custo de Oportunidade', desc: 'Seu caixa (10% Renda Fixa) está rendendo abaixo do CDI. Revise a alocação de liquidez.' }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Layers size={40} className="animate-pulse" color="var(--accent-blue)" />
          <p style={{ color: 'var(--text-secondary)' }}>Shinya Yamanaka reprogramando dados...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0a84ff', '#30d958', '#bf5afe', '#ffd60a', '#ff453a'];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginBottom: 32 }}>
        
        <div className="lg-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Zap size={24} color="var(--accent-amber)" />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Saúde da Carteira</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div>
               <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 20 }}>Distribuição por Classe</h3>
               <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.diversification.assetTypes} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.diversification.assetTypes.map((_: any, i: number) => (
                           <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--glass-heavy)', border: '1px solid var(--border-strong)', borderRadius: 12, backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {data.diversification.assetTypes.map((at: any, i: number) => (
                    <div key={at.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                       <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{at.name}</span>
                       <span style={{ fontSize: 12, fontWeight: 600 }}>{at.value}%</span>
                    </div>
                  ))}
               </div>
            </div>

            <div>
               <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 20 }}>Diversificação Setorial</h3>
               <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.diversification.sectors} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {data.diversification.sectors.map((_: any, i: number) => (
                           <Cell key={`cell-${i}`} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--glass-heavy)', border: '1px solid var(--border-strong)', borderRadius: 12, backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {data.diversification.sectors.map((s: any, i: number) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[(i + 2) % COLORS.length] }} />
                       <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                       <span style={{ fontSize: 12, fontWeight: 600 }}>{s.value}%</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        <div className="lg-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 24 }}>
             <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="62" stroke="var(--border-subtle)" strokeWidth="10" fill="none" />
                <circle cx="70" cy="70" r="62" stroke="var(--accent-blue)" strokeWidth="10" fill="none" 
                  strokeDasharray="390" strokeDashoffset={390 - (390 * data.score) / 100} strokeLinecap="round" 
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{data.score}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Consenso IA</span>
             </div>
          </div>
          <div className="badge badge-green" style={{ marginBottom: 24 }}>Risco {data.risk}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            Sua estratégia segue os modelos de Linus Torvalds: modular e escalável. Reprogramação Yamanaka sugere leve rebalanceamento.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {data.insights.map((insight: any) => (
          <div key={insight.title} className="lg-card animate-fade-up" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
               {insight.type === 'risk' ? <ShieldAlert size={18} color="var(--accent-red)" /> : 
                insight.type === 'opportunity' ? <TrendingUp size={18} color="var(--accent-green)" /> : 
                <Info size={18} color="var(--accent-blue)" />}
               <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{insight.title}</h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {insight.desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
