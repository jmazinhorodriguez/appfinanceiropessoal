'use client';
import { useEffect, useState, useCallback } from 'react';
import { BarChart2, RefreshCw, CheckCircle, AlertTriangle, Shield, Zap, Clock, Activity, TrendingUp, TrendingDown, ChevronDown, ChevronUp, X } from 'lucide-react';

const levelConfig: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  critico:   { label: 'Crítico',   color: 'rgba(255,69,58,1)',  bg: 'rgba(255,69,58,0.10)',  glow: 'rgba(255,69,58,0.35)'  },
  atencao:   { label: 'Atenção',   color: 'rgba(255,214,10,1)', bg: 'rgba(255,214,10,0.10)', glow: 'rgba(255,214,10,0.28)' },
  bom:       { label: 'Bom',       color: 'rgba(90,200,250,1)', bg: 'rgba(90,200,250,0.10)', glow: 'rgba(90,200,250,0.28)' },
  excelente: { label: 'Excelente', color: 'rgba(48,209,88,1)',  bg: 'rgba(48,209,88,0.10)',  glow: 'rgba(48,209,88,0.35)'  },
  critica:   { label: 'Crítica',   color: 'rgba(255,69,58,1)',  bg: 'rgba(255,69,58,0.10)',  glow: 'rgba(255,69,58,0.35)'  },
  boa:       { label: 'Boa',       color: 'rgba(90,200,250,1)', bg: 'rgba(90,200,250,0.10)', glow: 'rgba(90,200,250,0.28)' },
};

const scientists: Record<string, { name: string; color: string; bg: string }> = {
  fink:    { name: 'Fink',    color: 'rgba(48,209,88,1)',   bg: 'rgba(48,209,88,0.12)'   },
  simons:  { name: 'Simons',  color: 'rgba(10,132,255,1)',  bg: 'rgba(10,132,255,0.12)'  },
  kahn:    { name: 'Kahn',    color: 'rgba(255,214,10,1)',  bg: 'rgba(255,214,10,0.12)'  },
  shiller: { name: 'Shiller', color: 'rgba(191,90,242,1)',  bg: 'rgba(191,90,242,0.12)'  },
  tobin:   { name: 'Tobin',   color: 'rgba(90,200,250,1)',  bg: 'rgba(90,200,250,0.12)'  },
};

const insightColors: Record<string, string> = {
  warning: 'rgba(255,214,10,1)', danger: 'rgba(255,69,58,1)',
  info:    'rgba(10,132,255,1)', success: 'rgba(48,209,88,1)',
};

const glass = {
  background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20, position: 'relative' as const, overflow: 'hidden' as const,
};

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const pct = (v: number) => `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;

const PHASES = [
  'Lendo carteira de investimentos…', 'Aplicando CAPE Ratio (Shiller)…',
  'Calculando Q de Tobin…', 'Detectando padrões quant (Simons)…',
  'Calculando alpha por fatores (Kahn)…', 'Analisando ESG e risco sistêmico (Fink)…',
  'Gerando análise macroeconômica…', 'Consolidando relatório de saúde…',
];

export default function SaudeAplicacoesPage() {
  const [report, setReport]      = useState<any>(null);
  const [loading, setLoading]    = useState(true);
  const [running, setRunning]    = useState(false);
  const [phase, setPhase]        = useState('');
  const [activeTab, setTab]      = useState<'visao'|'insights'|'macro'|'risco'|'rebalance'|'logs'>('visao');
  const [expanded, setExpanded]  = useState<string | null>(null);
  const [activeItem, setItem]    = useState<any>(null);

  const fetchReport = useCallback(async (force = false) => {
    force ? setRunning(true) : setLoading(true);
    let pi = 0;
    const iv = setInterval(() => { setPhase(PHASES[pi++ % PHASES.length]); }, 700);
    try {
      const res  = await fetch('/api/agents/portfolio-health/run', { method: force ? 'POST' : 'GET' });
      const data = await res.json();
      setReport(data);
    } finally { clearInterval(iv); setPhase(''); setLoading(false); setRunning(false); }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);
  useEffect(() => {
    if (!report?.nextRunAt) return;
    const delay = Math.max(new Date(report.nextRunAt).getTime() - Date.now(), 60_000);
    const t = setTimeout(() => fetchReport(), delay);
    return () => clearTimeout(t);
  }, [report, fetchReport]);

  const lc = levelConfig[report?.level ?? 'atencao'];

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:24 }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(191,90,242,0.12)', border:'2px solid rgba(191,90,242,0.30)', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 2s ease-in-out infinite' }}>
        <BarChart2 size={34} color="rgba(191,90,242,1)" />
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Agente Shiller · Simons · Fink · Kahn · Tobin</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', minHeight:20 }}>{phase}</div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'rgba(191,90,242,0.60)', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  );

  const insights  = report?.insights  ?? [];
  const actions   = report?.actions   ?? [];
  const logs      = report?.logs      ?? [];

  return (
    <div style={{ padding:'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 32px)', maxWidth:1280, margin:'0 auto' }}>

      {/* HEADER */}
      <div style={{ ...glass, padding:'28px 32px', marginBottom:24, background:'rgba(191,90,242,0.08)', border:'1px solid rgba(191,90,242,0.18)', boxShadow:`0 8px 48px ${lc.glow}` }}>
        <div className="lg-prismatic-line" />
        <div style={{ position:'absolute', top:-60, right:-40, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(191,90,242,0.15) 0%,transparent 70%)', filter:'blur(24px)', pointerEvents:'none' }} />

        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(191,90,242,0.15)', border:'1px solid rgba(191,90,242,0.30)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(191,90,242,0.25)' }}>
              <BarChart2 size={26} color="rgba(191,90,242,1)" />
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em' }}>Saúde das Aplicações</h1>
                <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:lc.bg, color:lc.color, border:`1px solid ${lc.color.replace('1)','0.40)')}` }}>
                  {lc.label}
                </span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.values(scientists).map(s => (
                  <span key={s.name} style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:10, background:s.bg, color:s.color }}>
                    {s.name.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {report?.generatedAt && (
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.40)' }}>
                <Clock size={13} /> {new Date(report.generatedAt).toLocaleString('pt-BR')}
              </div>
            )}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:28, fontWeight:900, color:lc.color }}>{report?.score??0}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.40)' }}>score /100</div>
            </div>
            <button id="btn-reanalisar-portfolio" onClick={() => fetchReport(true)} disabled={running} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:12, background:'rgba(191,90,242,0.15)', border:'1px solid rgba(191,90,242,0.30)', color:'rgba(191,90,242,1)', fontSize:12, fontWeight:600, cursor:'pointer', opacity:running?0.6:1 }}>
              <RefreshCw size={13} style={{ animation:running?'spin 1s linear infinite':'none' }} />
              {running ? 'Analisando...' : 'Nova Análise'}
            </button>
          </div>
        </div>
      </div>

      {/* RESUMO */}
      {report?.summary && (
        <div style={{ ...glass, padding:'14px 20px', marginBottom:20 }}>
          <div className="lg-prismatic-line" />
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.7 }}>{report.summary}</p>
        </div>
      )}

      {/* TABS */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { id:'visao',     label:'Visão Geral'   },
          { id:'insights',  label:'Insights'      },
          { id:'macro',     label:'Macro'         },
          { id:'risco',     label:'Risco'         },
          { id:'rebalance', label:'Rebalanceamento'},
          { id:'logs',      label:'Logs'          },
        ].map(t => (
          <button key={t.id} id={`tab-port-${t.id}`} onClick={() => setTab(t.id as any)} style={{ padding:'8px 16px', borderRadius:20, background:activeTab===t.id?'rgba(191,90,242,0.20)':'rgba(255,255,255,0.06)', border:`1px solid ${activeTab===t.id?'rgba(191,90,242,0.40)':'rgba(255,255,255,0.08)'}`, color:activeTab===t.id?'rgba(191,90,242,1)':'rgba(255,255,255,0.50)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB VISÃO GERAL */}
      {activeTab==='visao' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {/* Score Breakdown */}
          <div style={{ ...glass, padding:'22px' }}>
            <div className="lg-prismatic-line" />
            <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Score por Dimensão</div>
            {insights.slice(0,5).map((ins: any, i: number) => {
              const c = insightColors[ins.type]||insightColors.info;
              const scKey = Object.entries(scientists).find(([,v]) => ins.methodology?.toLowerCase().includes(v.name.toLowerCase()));
              const sc = scKey ? scientists[scKey[0]] : scientists.fink;
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.60)' }}>{ins.title?.slice(0,40)}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:sc.color, background:sc.bg, padding:'1px 6px', borderRadius:8 }}>{sc.name}</span>
                  </div>
                  <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
                    <div style={{ height:'100%', borderRadius:4, width:`${(ins.confidence??0.5)*100}%`, background:c, transition:'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ações rápidas */}
          <div style={{ ...glass, padding:'22px' }}>
            <div className="lg-prismatic-line" />
            <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>⚡ Ações Prioritárias</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {actions.slice(0,5).map((a: any, i: number) => {
                const ic = a.impact==='alto'?'rgba(255,69,58,1)':a.impact==='medio'?'rgba(255,214,10,1)':'rgba(48,209,88,1)';
                return (
                  <div key={i} style={{ padding:'12px 14px', borderRadius:12, background:`${ic}08`, border:`1px solid ${ic}20` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <Zap size={12} color={ic} />
                      <span style={{ fontSize:12, fontWeight:700 }}>{a.label}</span>
                      <span style={{ fontSize:9, color:ic, marginLeft:'auto', fontWeight:700 }}>IMPACTO {a.impact?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{a.description?.slice(0,100)}...</div>
                    {(a.potentialGain??0)>0 && (
                      <div style={{ fontSize:11, color:'rgba(48,209,88,1)', fontWeight:700, marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                        <TrendingUp size={11} /> {fmt(a.potentialGain)}/ano
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Críticos */}
          <div style={{ ...glass, padding:'22px' }}>
            <div className="lg-prismatic-line" />
            <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>🚨 Alertas Críticos</div>
            {insights.filter((i: any) => i.priority==='critica'||i.priority==='alta').length===0 ? (
              <div style={{ textAlign:'center', padding:24 }}>
                <CheckCircle size={28} color="rgba(48,209,88,1)" style={{ margin:'0 auto 10px' }} />
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>Nenhum alerta crítico no portfólio</div>
              </div>
            ) : insights.filter((i: any) => i.priority==='critica'||i.priority==='alta').map((ins: any, i: number) => {
              const c = ins.type==='danger'?'rgba(255,69,58,1)':'rgba(255,159,10,1)';
              return (
                <div key={i} onClick={() => setItem(ins)} style={{ padding:'12px 14px', borderRadius:12, background:`${c}08`, border:`1px solid ${c}22`, marginBottom:10, cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <AlertTriangle size={13} color={c} />
                    <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.88)' }}>{ins.title}</span>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{ins.description?.slice(0,80)}...</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB INSIGHTS */}
      {activeTab==='insights' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:16 }}>
          {insights.map((ins: any, i: number) => {
            const c   = insightColors[ins.type]||insightColors.info;
            const sk  = Object.entries(scientists).find(([,v]) => ins.methodology?.toLowerCase().includes(v.name.toLowerCase()));
            const sc  = sk ? scientists[sk[0]] : scientists.fink;
            const Icon = ins.type==='danger'?AlertTriangle:ins.type==='warning'?AlertTriangle:CheckCircle;
            return (
              <div key={i} onClick={() => setItem(ins)} style={{ ...glass, padding:'20px 22px', cursor:'pointer', border:`1px solid ${c}22`, transition:'all 0.2s' }}>
                <div className="lg-prismatic-line" />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:`${c}18`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={15} color={c} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', lineHeight:1.3 }}>{ins.title}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0, marginLeft:8 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:c, background:`${c}18`, padding:'2px 8px', borderRadius:10 }}>{ins.priority?.toUpperCase()}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:sc.color, background:sc.bg, padding:'2px 8px', borderRadius:10 }}>{sc.name}</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.50)', lineHeight:1.6, marginBottom:10 }}>{ins.description}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontStyle:'italic' }}>📚 {ins.methodology?.slice(0,50)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:40, height:4, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(ins.confidence??0.5)*100}%`, borderRadius:4, background:c }} />
                    </div>
                    <span style={{ fontSize:9, color:c, fontWeight:700 }}>{Math.round((ins.confidence??0.5)*100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB MACRO */}
      {activeTab==='macro' && (
        <div style={{ ...glass, padding:'24px', background:'rgba(191,90,242,0.06)', border:'1px solid rgba(191,90,242,0.18)' }}>
          <div className="lg-prismatic-line" />
          <div style={{ fontSize:13, fontWeight:700, marginBottom:20 }}>Análise Macroeconômica — Shiller & Tobin</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            {[
              { label:'SELIC',        value:'10,75%', ok:false },
              { label:'IPCA',         value:'4,83%',  ok:true  },
              { label:'USD/BRL',      value:'R$ 5,15',ok:true  },
              { label:'CAPE (S&P)',   value:'31,2x',  ok:false },
              { label:'Q de Tobin',   value:'1,42',   ok:false },
              { label:'Ibov P/L',     value:'9,8x',   ok:true  },
              { label:'PIB Crescim.', value:'+2,1%',  ok:true  },
            ].map((m,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.40)', marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:m.ok?'rgba(48,209,88,1)':'rgba(255,214,10,1)' }}>{m.value}</div>
                <div style={{ fontSize:9, marginTop:4, color:m.ok?'rgba(48,209,88,0.70)':'rgba(255,214,10,0.70)' }}>
                  {m.ok ? '✓ Favorável' : '⚠ Atenção'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:20, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>📊 Interpretação do Cenário</div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
              SELIC elevada (10,75%) favorece renda fixa. CAPE do S&P em 31,2x indica sobrevalorização histórica (média: 16x). Q de Tobin em 1,42 sugere que o mercado americano precifica acima do custo de reposição. Brasil com P/L de 9,8x e dólar estável apresenta melhor relação risco-retorno neste cenário para renda variável local. Shiller recomenda cautela com ativos americanos e posicionamento defensivo.
            </p>
          </div>
          <div style={{ marginTop:12, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>🎯 Impacto na Sua Carteira</div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
              Com SELIC a 10,75%, sua alocação em renda fixa deve ser elevada. O cenário macro favorece FIIs de logística e shoppings premium, ações de exportadoras brasileiras e proteção cambial via ativos internacionais. Evite concentração em crescimento americano enquanto o CAPE estiver acima de 25x.
            </p>
          </div>
        </div>
      )}

      {/* TAB RISCO */}
      {activeTab==='risco' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {[
            { label:'Sharpe Ratio',     value:'--',   scientist:'kahn',   desc:'Retorno por unidade de risco total. Meta: > 0.5',                ok: false },
            { label:'Sortino Ratio',    value:'--',   scientist:'kahn',   desc:'Retorno por unidade de risco de queda.',                         ok: false },
            { label:'Beta',             value:'--',   scientist:'simons', desc:'Sensibilidade ao mercado. Beta > 1: mais volátil que o índice.',  ok: true  },
            { label:'Momentum Score',   value:'--/100', scientist:'simons', desc:'Score quantitativo de momentum (Renaissance Technologies).',    ok: false },
            { label:'Max Drawdown',     value:'--',   scientist:'fink',   desc:'Maior queda histórica. Limite saudável: até -20%.',               ok: true  },
            { label:'VaR 95% (dia)',    value:'--',   scientist:'simons', desc:'Perda máxima esperada em 95% dos dias.',                         ok: true  },
            { label:'Concentração',     value:'--',   scientist:'fink',   desc:'Peso do maior ativo. Acima de 20% = risco de concentração.',      ok: false },
            { label:'Alpha (Kahn)',      value:'--',   scientist:'kahn',   desc:'Alpha puro ajustado por fatores de valor, qualidade e momentum.', ok: false },
          ].map((m, i) => {
            const s = scientists[m.scientist];
            return (
              <div key={i} style={{ ...glass, padding:'20px 22px', border:`1px solid ${m.ok?'rgba(48,209,88,0.18)':'rgba(255,214,10,0.18)'}` }}>
                <div className="lg-prismatic-line" />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.60)' }}>{m.label}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:s.color, background:s.bg, padding:'2px 8px', borderRadius:10 }}>{s.name}</span>
                </div>
                <div style={{ fontSize:26, fontWeight:800, color:m.ok?'rgba(48,209,88,1)':'rgba(255,214,10,1)', marginBottom:8 }}>
                  {report?.risk_metrics ? String(Object.values(report.risk_metrics)[i] ?? '--') : '--'}
                </div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.40)', lineHeight:1.6 }}>{m.desc}</p>
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6 }}>
                  {m.ok ? <CheckCircle size={12} color="rgba(48,209,88,1)" /> : <AlertTriangle size={12} color="rgba(255,214,10,1)" />}
                  <span style={{ fontSize:10, fontWeight:600, color:m.ok?'rgba(48,209,88,1)':'rgba(255,214,10,1)' }}>
                    {m.ok ? 'Dentro do limite' : 'Importar carteira para calcular'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB REBALANCEAMENTO */}
      {activeTab==='rebalance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ ...glass, padding:'16px 20px', background:'rgba(10,132,255,0.06)', border:'1px solid rgba(10,132,255,0.16)' }}>
            <div className="lg-prismatic-line" />
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Shield size={16} color="rgba(10,132,255,1)" />
              <span style={{ fontSize:13, fontWeight:700 }}>Rebalanceamento Sugerido — Larry Fink (BlackRock)</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:8, lineHeight:1.6 }}>
              Baseado na filosofia de alocação estratégica de longo prazo e ciclos de juros. Metas: Renda Fixa 30% · Ações BR 25% · FII 15% · Ações US 15% · BDR 5% · ETF/Ouro 5% · REIT 3% · Bond 2%.
            </p>
          </div>
          {actions.length === 0 ? (
            <div style={{ ...glass, padding:48, textAlign:'center' }}>
              <CheckCircle size={32} color="rgba(48,209,88,1)" style={{ margin:'0 auto 12px' }} />
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)' }}>Importe sua carteira para gerar sugestões de rebalanceamento personalizadas.</div>
            </div>
          ) : actions.map((a: any, i: number) => {
            const ic = a.impact==='alto'?'rgba(48,209,88,1)':a.impact==='medio'?'rgba(255,214,10,1)':'rgba(90,200,250,1)';
            return (
              <div key={i} style={{ ...glass, padding:'20px 22px' }}>
                <div className="lg-prismatic-line" />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Zap size={14} color={ic} />
                    <span style={{ fontSize:13, fontWeight:700 }}>{a.label}</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontSize:10, fontWeight:600, color:ic, background:`${ic}18`, padding:'2px 8px', borderRadius:10 }}>Impacto {a.impact}</span>
                    <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.40)', background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:10 }}>Esforço {a.effort}</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.50)', lineHeight:1.6, marginBottom:10 }}>{a.description}</p>
                {(a.potentialGain??0) > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'rgba(48,209,88,1)' }}>
                    <TrendingUp size={14} /> Ganho potencial: {fmt(a.potentialGain)}/ano
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB LOGS */}
      {activeTab==='logs' && (
        <div style={{ ...glass, padding:'20px 24px' }}>
          <div className="lg-prismatic-line" />
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Activity size={16} color="rgba(191,90,242,1)" />
            <span style={{ fontSize:14, fontWeight:700 }}>Logs da Última Execução — Agente de Portfólio</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, fontFamily:'monospace' }}>
            {logs.map((log: any, i: number) => {
              const pc: Record<string,string> = { observing:'rgba(90,200,250,1)', reasoning:'rgba(191,90,242,1)', acting:'rgba(255,214,10,1)', reporting:'rgba(48,209,88,1)', done:'rgba(48,209,88,1)', error:'rgba(255,69,58,1)' };
              const c = pc[log.phase]||'rgba(255,255,255,0.40)';
              return (
                <div key={i} style={{ display:'flex', gap:12, padding:'8px 12px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)', flexShrink:0 }}>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:c, flexShrink:0, minWidth:80 }}>[{log.phase?.toUpperCase()}]</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)', lineHeight:1.5 }}>{log.message}</span>
                </div>
              );
            })}
            {logs.length===0 && (
              <div style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.30)', fontSize:13 }}>
                Importe ativos para executar a análise de portfólio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALHE */}
      {activeItem && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.70)', backdropFilter:'blur(8px)' }} onClick={() => setItem(null)} />
          <div style={{ zIndex:1, width:'100%', maxWidth:580, ...glass, padding:'28px 32px', border:'1px solid rgba(255,255,255,0.16)' }}>
            <div className="lg-prismatic-line" />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <h2 style={{ fontSize:17, fontWeight:800, maxWidth:'80%' }}>{activeItem.title}</h2>
              <button onClick={() => setItem(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.40)', cursor:'pointer', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.60)', lineHeight:1.7, marginBottom:16 }}>{activeItem.detail||activeItem.description}</p>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, padding:'14px 16px', fontSize:12, color:'rgba(255,255,255,0.50)', fontStyle:'italic' }}>
              📚 {activeItem.methodology}
            </div>
            {activeItem.confidence && (
              <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Confiança:</span>
                <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                  <div style={{ width:`${activeItem.confidence*100}%`, height:'100%', borderRadius:3, background:'rgba(191,90,242,1)' }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(191,90,242,1)' }}>{Math.round(activeItem.confidence*100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
