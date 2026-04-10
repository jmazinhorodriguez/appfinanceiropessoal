'use client';
import { useState } from 'react';
import { FileText, ChevronDown, Download, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatBRL } from '@/lib/utils/format';

export default function ImpostoRendaPage() {
  const [activeTab, setActiveTab] = useState('apuracao');
  const [year, setYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const taxData = [
    { month: 0, status: 'isento', value: 0 },
    { month: 1, status: 'devido', value: 345.50, darf: '6015', due: '2025-03-31' },
    { month: 2, status: 'prejuizo', value: 0, carryForward: 1200.00 },
    // Rest mock
    ...Array(9).fill({}).map((_, i) => ({ month: i+3, status: 'isento', value: 0 }))
  ];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 40px)', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-subtle)' }}>
          {['Apuração Mensal', 'Declaração Anual', 'Bens e Direitos'].map((tab) => {
            const tKey = tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ /g, "-");
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tKey)}
                style={{ 
                  background: 'none', border: 'none', padding: '0 0 16px', cursor: 'pointer',
                  fontSize: 15, fontWeight: 600, position: 'relative',
                  color: activeTab === tKey ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}
              >
                {tab}
                {activeTab === tKey && (
                  <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent-blue)', borderRadius: '2px 2px 0 0' }} />
                )}
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative' }}>
          <select 
            value={year} onChange={(e) => setYear(e.target.value)}
            className="input-glass" style={{ width: 120, paddingRight: 32, appearance: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <ChevronDown size={16} color="var(--text-tertiary)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {activeTab === 'apuracao-mensal' && (
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }} className="animate-fade-in">
          
          <div style={{ flex: 1 }} className="grid-cols-4">
            {months.map((m, i) => {
               const data = taxData.find(d => d.month === i) || { status: 'isento', value: 0 };
               const isActive = selectedMonth === i;
               
               let colors = { bg: 'rgba(255,255,255,0.02)', border: 'var(--border-subtle)', tag: 'var(--text-tertiary)', tagBg: 'rgba(255,255,255,0.05)' };
               if (data.status === 'devido') colors = { bg: 'var(--accent-red-g)', border: 'rgba(255,69,58,0.3)', tag: 'var(--accent-red)', tagBg: 'rgba(255,69,58,0.1)' };
               else if (data.status === 'isento') colors = { bg: 'var(--glass-regular)', border: 'var(--border-regular)', tag: 'var(--accent-green)', tagBg: 'var(--accent-green-g)' };
               else if (data.status === 'prejuizo') colors = { bg: 'var(--glass-regular)', border: 'var(--border-regular)', tag: 'var(--accent-amber)', tagBg: 'var(--accent-amber-g)' };

               if (isActive) {
                 colors.border = 'var(--accent-blue)';
                 colors.bg = 'rgba(10,132,255,0.05)';
               }

               return (
                 <div 
                    key={m} 
                    className="lg-card" 
                    onClick={() => setSelectedMonth(i)}
                    style={{ 
                      padding: 20, cursor: 'pointer', 
                      background: colors.bg, borderColor: colors.border,
                      transition: 'all 0.2s var(--ease-spring)'
                    }}
                 >
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, margin: 0 }}>{m}</h4>
                    <span className="badge" style={{ background: colors.tagBg, color: colors.tag, margin: '8px 0', border: 'none' }}>
                      {data.status.toUpperCase()}
                    </span>
                    <div style={{ marginTop: 12, fontSize: 16, fontWeight: 700, color: data.value > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {formatBRL(data.value)}
                    </div>
                 </div>
               )
            })}
          </div>

          {selectedMonth !== null && (
            <div className="lg-card animate-fade-in" style={{ width: 360, padding: 32, position: 'sticky', top: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{months[selectedMonth]} {year}</h3>
                <button className="btn-glass" style={{ padding: '6px 12px' }}><Download size={14} style={{ marginRight: 6 }}/> PDF</button>
              </div>

              {taxData[selectedMonth]?.status === 'devido' ? (
                <>
                  <div style={{ padding: '20px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>DARF Código</span>
                      <span style={{ fontWeight: 600 }}>{taxData[selectedMonth]?.darf}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)' }}>
                      <span style={{ fontSize: 14 }}>Valor a Pagar</span>
                      <span style={{ fontWeight: 700, fontSize: 18 }}>{formatBRL(taxData[selectedMonth]?.value || 0)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'rgba(255,214,10,0.1)', borderRadius: 12 }}>
                    <AlertCircle size={20} color="var(--accent-amber)" style={{ marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-amber)', margin: '0 0 4px' }}>Vencimento Próximo</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Pague até o último dia útil de {months[(selectedMonth+1)%12]}.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Tudo Certo</h4>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Nenhum imposto devido neste período. Vendas abaixo de R$ 20.000 ou sem lucro tributável.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'declaracao-anual' && (
        <div className="lg-card animate-fade-up" style={{ padding: 40, textAlign: 'center' }}>
          <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Módulo de declaração anual baseada em Warren Allen em desenvolvimento.</h3>
        </div>
      )}

      {activeTab === 'bens-e-direitos' && (
        <div className="lg-card animate-fade-up" style={{ padding: 40, textAlign: 'center' }}>
          <FileText size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Posição consolidada para Bens e Direitos estará disponível em breve.</h3>
        </div>
      )}
    </div>
  );
}
