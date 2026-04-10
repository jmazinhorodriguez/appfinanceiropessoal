'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, XCircle, Loader2, File as FileIcon, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils/format';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ContasPage() {
  const [activeTab, setActiveTab] = useState('importar');
  const [status, setStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [uploadId, setUploadId] = useState('');
  const [transacoes, setTransacoes] = useState<any[]>([]);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('transacoes')
        .select('*, categorias(nome)')
        .order('data', { ascending: false })
        .limit(30);
      if (data) setTransacoes(data);
    }
    loadData();
  }, [supabase, status]);

  const checkStatus = useCallback(async (id: string, attempts = 0) => {
    if (attempts > 30) {
      setStatus('error');
      setErrorMsg('Tempo limite excedido ao processar.');
      return;
    }
    
    try {
      const res = await fetch(`/api/contas/upload-status/${id}`);
      const data = await res.json();
      
      if (data.status === 'concluido') {
        setStatus('done');
        setImportedCount(data.count);
      } else if (data.status === 'erro') {
        setStatus('error');
        setErrorMsg(data.error || 'Erro ao processar arquivo.');
      } else {
        setTimeout(() => checkStatus(id, attempts + 1), 2000);
      }
    } catch {
      setTimeout(() => checkStatus(id, attempts + 1), 2000);
    }
  }, []);

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
      const res = await fetch('/api/import-statement', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao importar Extrato');

      setStatus('processing');
      setUploadId(data.uploadId);
      checkStatus(data.uploadId);

    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [checkStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.intu.qfx': ['.ofx'],
      'application/x-ofx': ['.ofx']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const bancos = ['Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil', 'Inter', 'C6', 'BTG', 'XP', 'Avenue', 'Wise'];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 40px)', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-subtle)', marginBottom: 32 }}>
        {['Visão Geral', 'Transações', 'Importar Extrato'].map((tab) => (
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

      {activeTab === 'importar-extrato' && (
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
                  <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Arraste seu extrato bancário</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>ou clique para selecionar do seu computador</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                    {['PDF', 'CSV', 'OFX', 'XLSX'].map(ext => (
                      <span key={ext} className="badge badge-blue">{ext}</span>
                    ))}
                  </div>
                </div>
              )}

              {status === 'uploading' && (
                <div className="animate-fade-in">
                  <Loader2 size={40} color="var(--accent-blue)" className="animate-spin" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>Enviando arquivo...</h3>
                </div>
              )}

              {status === 'processing' && (
                <div className="animate-fade-in">
                  <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--accent-violet-g)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--accent-violet)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite' }} />
                    <SparklesIcon />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>IA Analisando e Categorizando...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Mapeando transações (pode levar alguns segundos)</p>
                </div>
              )}

              {status === 'done' && (
                <div className="animate-fade-in">
                  <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 8 }}>Sucesso!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    {importedCount} transações importadas e categorizadas.
                  </p>
                  <button onClick={() => setStatus('idle')} className="btn-glass" style={{ marginTop: 24 }}>Importar outro arquivo</button>
                </div>
              )}

              {status === 'error' && (
                <div className="animate-fade-in">
                  <XCircle size={48} color="var(--accent-red)" style={{ margin: '0 auto 20px', display: 'block' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 8 }}>Erro na Importação</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{errorMsg}</p>
                  <button onClick={() => setStatus('idle')} className="btn-glass" style={{ marginTop: 24 }}>Tentar Novamente</button>
                </div>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Bancos e Corretoras Suportados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {bancos.map(banco => (
              <div key={banco} className="lg-card" style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={16} color="var(--text-tertiary)" />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{banco}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'visao-geral' && (
        <div className="lg-card animate-fade-in" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Saldos Recentes (Transações Importadas)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Este é o balanço rápido das últimas 30 movimentações espelhadas no banco.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
               <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Balanço Estimado (Últimos Registros)</span>
               <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>
                  {formatBRL(transacoes.reduce((acc, tx) => tx.tipo === 'receita' ? acc + Number(tx.valor) : acc - Number(tx.valor), 0))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transacoes' && (
        <div className="lg-card animate-fade-in" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Últimas Movimentações</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {transacoes.length === 0 ? (
               <p style={{ color: 'var(--text-secondary)' }}>Nenhuma transação encontrada no momento.</p>
            ) : transacoes.map((tx: any) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 12, 
                    background: tx.tipo === 'receita' ? 'var(--accent-green-g)' : 'var(--accent-red-g)',
                    color: tx.tipo === 'receita' ? 'var(--accent-green)' : 'var(--accent-red)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {tx.tipo === 'receita' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{tx.descricao}</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>{tx.categorias?.nome || 'Outros'} • Origem: {tx.origem || 'importacao'}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: tx.tipo === 'receita' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {tx.tipo === 'receita' ? '+' : ''}{formatBRL(tx.valor || 0)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{formatDate(tx.data || '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Upload size={24} color="var(--accent-violet)" />
    </div>
  );
}
