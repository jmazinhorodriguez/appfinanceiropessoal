'use client';
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, XCircle, Loader2, File as FileIcon, Building2 } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils/format';

export default function ContasPage() {
  const [activeTab, setActiveTab] = useState('importar');
  const [status, setStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [uploadId, setUploadId] = useState('');

  const checkStatus = useCallback(async (id: string, attempts = 0) => {
    if (attempts > 30) {
      setStatus('error');
      setErrorMsg('Tempo limite excedido ao processar.');
      return;
    }
    
    try {
      const res = await fetch(`/api/contas/upload-status/${id}`);
      const data = await res.json();
      
      if (data.status === 'completed') {
        setStatus('done');
        setImportedCount(data.transactions_imported);
      } else if (data.status === 'error') {
        setStatus('error');
        setErrorMsg(data.error_message || 'Erro ao processar arquivo.');
      } else {
        setTimeout(() => checkStatus(id, attempts + 1), 2000);
      }
    } catch (e) {
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
      const res = await fetch('/api/contas/upload-statement', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus('processing');
      setUploadId(data.uploadId);
      checkStatus(data.uploadId);

    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message);
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
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
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
      
      {activeTab !== 'importar-extrato' && (
        <div className="lg-card animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Esta visão estaria preenchida na implementação completa.</p>
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
