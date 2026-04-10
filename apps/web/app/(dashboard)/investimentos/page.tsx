'use client';
import { useState, useCallback, useEffect } from 'react';
import { formatBRL, formatUSD, formatPct, formatDate } from '@/lib/utils/format';
import { PlusCircle, Search, TrendingUp, TrendingDown, Clock, Building2, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Dividend, PortfolioAsset } from '@/types/database';
import { useDropzone } from 'react-dropzone';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function InvestimentosPage() {
  const [activeTab, setActiveTab] = useState('importar-notas');
  const [status, setStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [historico, setHistorico] = useState<any[]>([]);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('ordens').select('*').order('data', { ascending: false }).limit(50);
      if (data) setHistorico(data);
    }
    loadData();
  }, [supabase, status]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', ext || '');

    try {
      const res = await fetch('/api/investimentos/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus('done');
      setImportedCount(data.count);

    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });
  const assets: (Partial<PortfolioAsset> & { qty: number; avg: number; current: number; profit: number; return: number; curr?: string })[] = [
    { id: '1', ticker: 'BBDC4', name: 'Bradesco PN', asset_type: 'acao_br', qty: 500, avg: 14.50, current: 15.20, profit: 350, return: 4.82 },
    { id: '2', ticker: 'ITUB4', name: 'Itaú Unibanco', asset_type: 'acao_br', qty: 300, avg: 26.80, current: 25.10, profit: -510, return: -6.34 },
    { id: '3', ticker: 'KNRI11', name: 'Kinea Renda', asset_type: 'fii', qty: 150, avg: 155.00, current: 162.30, profit: 1095, return: 4.70 },
    { id: '4', ticker: 'GOLD11', name: 'Trend Ouro', asset_type: 'etf_ouro' as any, qty: 80, avg: 10.20, current: 11.45, profit: 100, return: 12.25 },
    { id: '5', ticker: 'AAPL', name: 'Apple Inc', asset_type: 'acao_us', qty: 10, avg: 170.00, current: 185.00, profit: 150, return: 8.82, curr: 'USD' },
  ];

  const dividends: (Partial<Dividend> & { val: number; qty: number; net: number })[] = [
    { id: '1', ticker: 'BBDC4', type: 'JCP', ex_date: '2025-03-01', payment_date: '2025-03-15', val: 0.15, qty: 500, gross_amount: 75, tax_withheld: 11.25, net: 63.75 },
    { id: '2', ticker: 'KNRI11', type: 'Rendimento' as any, ex_date: '2025-03-14', payment_date: '2025-03-30', val: 0.95, qty: 150, gross_amount: 142.50, tax_withheld: 0, net: 142.50 },
  ];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 40px)', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-subtle)', marginBottom: 32 }}>
        {['Carteira', 'Nova Ordem', 'Proventos', 'Histórico', 'Importar Notas'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(" ", "-"))}
            style={{ 
              background: 'none', border: 'none', padding: '0 0 16px', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, position: 'relative',
              color: activeTab === tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(" ", "-") ? 'var(--accent-blue)' : 'var(--text-secondary)'
            }}
          >
            {tab}
            {activeTab === tab.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(" ", "-") && (
              <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent-blue)', borderRadius: '2px 2px 0 0' }} />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'carteira' && (
        <div className="lg-card animate-fade-in" style={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Buscar ativo..." className="input-glass" style={{ paddingLeft: 36, minHeight: 40 }} />
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('nova-ordem')}>
              <PlusCircle size={16} /> Nova Ordem
            </button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Preço Médio</th>
                <th style={{ textAlign: 'right' }}>Preço Atual</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.ticker}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{a.name}</div>
                  </td>
                  <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{(a.asset_type || '').replace('_', ' ')}</span></td>
                  <td style={{ textAlign: 'right' }}>{a.qty}</td>
                  <td style={{ textAlign: 'right' }}>{a.curr === 'USD' ? formatUSD(a.avg) : formatBRL(a.avg)}</td>
                  <td style={{ textAlign: 'right' }}>{a.curr === 'USD' ? formatUSD(a.current) : formatBRL(a.current)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{a.curr === 'USD' ? formatUSD(a.qty * a.current) : formatBRL(a.qty * a.current)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ color: a.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      {a.profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {a.curr === 'USD' ? formatUSD(Math.abs(a.profit)) : formatBRL(Math.abs(a.profit))}
                    </div>
                    <div style={{ fontSize: 11, color: a.return >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {formatPct(a.return)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 4px', textAlign: 'right' }}>Total Investido</p>
              <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>R$ 77.290,00</p>
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 4px', textAlign: 'right' }}>Saldo Atual</p>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>R$ 79.160,00</p>
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 4px', textAlign: 'right' }}>Rentabilidade</p>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--accent-green)' }}>+R$ 1.870,00 (2.41%)</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nova-ordem' && (
        <div className="grid-cols-2 animate-fade-in" style={{ gap: 32 }}>
          <div className="lg-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Registrar Operação</h3>
            
            <div className="grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Ticker</label>
                <input type="text" className="input-glass" placeholder="Ex: BBDC4" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Data</label>
                <input type="date" className="input-glass" />
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Operação</label>
                <select className="input-glass" style={{ appearance: 'none' }}>
                  <option value="compra">Compra</option>
                  <option value="venda">Venda</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Corretora</label>
                <select className="input-glass" style={{ appearance: 'none' }}>
                  <option value="inter">Inter</option>
                  <option value="outra">Outra</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Quantidade</label>
                <input type="number" className="input-glass" placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Preço Unit. (R$)</label>
                <input type="number" step="0.01" className="input-glass" placeholder="0,00" />
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%' }}>Lançar Ordem</button>
          </div>

          <div className="lg-card" style={{ padding: 32, background: 'rgba(10,132,255,0.05)', borderColor: 'rgba(10,132,255,0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} /> Preview do Impacto
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Novo Preço Médio</span>
                <span style={{ fontWeight: 600 }}>R$ 0,00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nova Posição (Val.)</span>
                <span style={{ fontWeight: 600 }}>R$ 0,00</span>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-blue)' }}>
                <span style={{ fontWeight: 600 }}>Custo Total da Ordem</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>R$ 0,00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proventos' && (
        <div className="lg-card animate-fade-in" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Data Ex</th>
                <th>Pagamento</th>
                <th>Ativo</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Qtd Base</th>
                <th style={{ textAlign: 'right' }}>Val/Cota</th>
                <th style={{ textAlign: 'right' }}>Total (Bruto)</th>
                <th style={{ textAlign: 'right' }}>IRRF</th>
                <th style={{ textAlign: 'right' }}>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {dividends.map(d => (
                <tr key={d.id}>
                  <td>{formatDate(d.ex_date || '')}</td>
                  <td>{formatDate(d.payment_date || '')}</td>
                  <td style={{ fontWeight: 600 }}>{d.ticker}</td>
                  <td><span className={`badge badge-${d.type === 'jcp' ? 'amber' : 'green'}`}>{d.type}</span></td>
                  <td style={{ textAlign: 'right' }}>{d.qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatBRL(d.val)}</td>
                  <td style={{ textAlign: 'right' }}>{formatBRL(d.gross_amount || 0)}</td>
                  <td style={{ textAlign: 'right', color: (d.tax_withheld || 0) > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                    {(d.tax_withheld || 0) > 0 ? `-${formatBRL(d.tax_withheld || 0)}` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>{formatBRL(d.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="lg-card animate-fade-in" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Histórico de Ordens (Sincronizado)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {historico.length === 0 ? (
               <div style={{ textAlign: 'center', padding: 24 }}>
                 <p style={{ color: 'var(--text-secondary)' }}>Nenhuma ordem encontrada. Importe suas notas de corretagem (PDF).</p>
               </div>
            ) : historico.map((ord: any) => (
              <div key={ord.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: ord.tipo === 'compra' ? 'var(--accent-blue-g)' : 'var(--accent-amber-g)',
                    color: ord.tipo === 'compra' ? 'var(--accent-blue)' : 'var(--accent-amber)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {ord.tipo === 'compra' ? <PlusCircle size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{ord.ticker}</p>
                      <span style={{ fontSize: 11, background: 'var(--glass-thick)', padding: '2px 8px', borderRadius: 10 }}>{ord.mercado}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
                      {ord.quantidade} ativos ({ord.tipo}) a {formatBRL(ord.preco)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatBRL(ord.total || 0)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(ord.data || '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'importar-notas' && (
        <div className="animate-fade-in">
          <div className="lg-card" style={{ padding: 40, textAlign: 'center', marginBottom: 32 }}>
            <div 
              {...getRootProps()} 
              style={{ 
                border: `2px dashed ${isDragActive ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                background: isDragActive ? 'rgba(10,132,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 20, padding: 60, cursor: status === 'idle' || status === 'error' ? 'pointer' : 'default',
                transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
              }}
            >
              <input {...getInputProps()} disabled={status === 'uploading' || status === 'processing'} />
              
              {status === 'idle' && (
                <div className="animate-fade-up">
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--glass-thick)', border: '1px solid var(--border-regular)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Upload size={32} color="var(--accent-blue)" />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Arraste sua Nota de Corretagem (B3)</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Suporte autônomo para PDFs da XP, Rico, BTG, Nu Invest e Clear.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                    <span className="badge badge-blue">PDF</span>
                  </div>
                </div>
              )}

              {status === 'uploading' && (
                <div className="animate-fade-in">
                  <Loader2 size={40} color="var(--accent-blue)" className="animate-spin" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>Extraindo as ordens da prancheta...</h3>
                </div>
              )}

              {status === 'done' && (
                <div className="animate-fade-in">
                  <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 8 }}>Sucesso!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    {importedCount} negócios decodificados e cruzados via B3.
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); setStatus('idle'); }} className="btn-glass" style={{ marginTop: 24 }}>Importar mais notas</button>
                </div>
              )}

              {status === 'error' && (
                <div className="animate-fade-in">
                  <XCircle size={48} color="var(--accent-red)" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 8 }}>Erro de Extração</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{errorMsg}</p>
                  <button onClick={(e) => { e.stopPropagation(); setStatus('idle'); }} className="btn-glass" style={{ marginTop: 24 }}>Tentar Novamente</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
