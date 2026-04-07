'use client';
import { useEffect, useState } from 'react';
import { Loader2, BrainCircuit, Activity, BarChart3, AlertCircle } from 'lucide-react';
import type { HealthAnalysis } from '@/lib/ai/financial-health-analyzer';

export default function SaudeFinanceiraPage() {
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/financial-health')
      .then(res => res.json())
      .then(data => {
        setAnalysis(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 20 }}>
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--accent-blue-g)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--accent-blue)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={24} color="var(--accent-blue)" />
          </div>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Geoffrey Hinton processando padrões...</h3>
        <p style={{ color: 'var(--text-tertiary)' }}>Extraindo insights comportamentais</p>
      </div>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-blue)';
    if (score >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const scColor = getScoreColor(analysis.score);
  const offset = 408 - (408 * analysis.score) / 100;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 32, marginBottom: 32 }}>
        
        {/* SCORE BOARD */}
        <div className="lg-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 32, width: '100%', textAlign: 'center' }}>Score Financeiro</h2>
          
          <div style={{ position: 'relative', width: 150, height: 150, marginBottom: 20 }}>
            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="75" cy="75" r="65" stroke="var(--border-strong)" strokeWidth="12" fill="none" />
              <circle cx="75" cy="75" r="65" stroke={scColor} strokeWidth="12" fill="none" 
                strokeDasharray="408" strokeDashoffset={offset} strokeLinecap="round" 
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} 
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: scColor }}>{analysis.score}</span>
            </div>
          </div>
          
          <div className={`badge badge-${analysis.score >= 80 ? 'green' : analysis.score >= 40 ? 'amber' : 'red'}`} style={{ fontSize: 14, padding: '6px 16px', marginBottom: 32 }}>
            Nível: {analysis.level}
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(analysis.scoreBreakdown).map(([key, val]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontWeight: 600 }}>{val} pts</span>
                </div>
                <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(val / 30) * 100}%`, background: 'var(--text-tertiary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BIASES PANEL */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <BrainCircuit size={24} color="var(--accent-violet)" />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Vieses Comportamentais (Kahneman & Thaler)</h2>
          </div>
          
          <div style={{ display: 'grid', gap: 16 }}>
             {analysis.biases.map((bias, i) => (
                <div key={bias.id} className="lg-card animate-fade-up" style={{ padding: 24, animationDelay: `${i * 100}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                         <span className={`badge badge-${bias.type === 'Kahneman' ? 'violet' : 'cyan'}`}>{bias.type}</span>
                         <span className={`badge badge-${bias.severity === 'high' ? 'red' : bias.severity === 'medium' ? 'amber' : 'blue'}`}>
                           Impacto {bias.severity === 'high' ? 'Alto' : bias.severity === 'medium' ? 'Médio' : 'Baixo'}
                         </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{bias.name}</h3>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{bias.description}</p>
                  
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <BarChart3 size={16} color="var(--text-tertiary)" />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong>Evidência:</strong> {bias.evidence}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--accent-green-g)', borderRadius: 100 }}>
                    <Activity size={14} color="var(--accent-green)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>Ação Recomendada: {bias.action}</span>
                  </div>
                </div>
             ))}
             {analysis.biases.length === 0 && (
               <div className="lg-card" style={{ padding: 40, textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-secondary)' }}>Nenhum viés comportamental grave detectado recentemente.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* NUDGES ROW */}
      {analysis.nudges.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '40px 0 24px' }}>
            <AlertCircle size={24} color="var(--accent-amber)" />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Nudges</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {analysis.nudges.map((nudge, i) => (
              <div key={nudge.id} className="lg-card animate-fade-up" style={{ padding: 20, animationDelay: `${(i+4)*100}ms`, borderLeft: `3px solid var(--accent-${nudge.priority === 'high' ? 'red' : 'amber'})` }}>
                <span className="badge badge-blue" style={{ marginBottom: 12 }}>{nudge.type}</span>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{nudge.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{nudge.description}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
