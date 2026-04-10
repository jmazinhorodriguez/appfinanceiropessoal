'use client';
import { useEffect, useState, useCallback } from 'react';
import { Brain, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info, Zap, Clock, Activity, TrendingUp, ChevronRight, X } from 'lucide-react';

const levelConfig: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  critica:   { label: 'Crítica',   color: 'rgba(255,69,58,1)',  bg: 'rgba(255,69,58,0.10)',  glow: 'rgba(255,69,58,0.35)'  },
  atencao:   { label: 'Atenção',   color: 'rgba(255,214,10,1)', bg: 'rgba(255,214,10,0.10)', glow: 'rgba(255,214,10,0.28)' },
  boa:       { label: 'Boa',       color: 'rgba(90,200,250,1)', bg: 'rgba(90,200,250,0.10)', glow: 'rgba(90,200,250,0.28)' },
  excelente: { label: 'Excelente', color: 'rgba(48,209,88,1)',  bg: 'rgba(48,209,88,0.10)',  glow: 'rgba(48,209,88,0.35)'  },
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
const prismLine = {
  position: 'absolute' as const, top: 0, left: 0, right: 0, height: 1,
  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)',
  pointerEvents: 'none' as const,
};

const PHASES = [
  'Observando contas bancárias…', 'Calculando métricas financeiras…',
  'Aplicando Teoria dos Prospectos (Kahneman)…', 'Detectando vieses cognitivos…',
  'Aplicando Nudge Theory (Thaler)…', 'Gerando plano de ação…', 'Consolidando relatório…',
];

export default function SaudeFinanceiraPage() {
  const [report, setReport]        = useState<any>(null);
  const [loading, setLoading]      = useState(true);
  const [running, setRunning]      = useState(false);
  const [phase, setPhase]          = useState('');
  const [activeInsight, setActive] = useState<any>(null);
  const [activeTab, setTab]        = useState<'visao'|'vieses'|'nudges'|'logs'>('visao');

  const fetchReport = useCallback(async (force = false) => {
    force ? setRunning(true) : setLoading(true);
    let pi = 0;
    const iv = setInterval(() => { setPhase(PHASES[pi++ % PHASES.length]); }, 650);
    try {
      const res  = await fetch('/api/agents/financial-health/run', { method: force ? 'POST' : 'GET' });
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

  const lc          = levelConfig[report?.level ?? 'atencao'];
  const allInsights = report?.insights ?? [];
  const biases      = allInsights.filter((i: any) => i.category === 'behavioral');
  const nudges      = report?.actions ?? [];
  const logs        = report?.logs ?? [];

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:24 }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(10,132,255,0.12)', border:'2px solid rgba(10,132,255,0.30)', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 2s ease-in-out infinite' }}>
        <Brain size={34} color="rgba(10,132,255,1)" />
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Agente Kahneman &amp; Thaler</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', minHeight:20 }}>{phase}</div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'rgba(10,132,255,0.60)', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      {/* HEADER */}
      <div style={{ ...glass, padding:'28px 32px', marginBottom:24, background:'rgba(10,132,255,0.08)', border:'1px solid rgba(10,132,255,0.18)', boxShadow:`0 8px 40px ${lc.glow}` }}>
        <div style={prismLine} />
        <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(10,132,255,0.14) 0%,transparent 70%)', filter:'blur(24px)', pointerEvents:'none' }} />
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(10,132,255,0.15)', border:'1px solid rgba(10,132,255,0.30)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={26} color="rgba(10,132,255,1)" />
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em' }}>Saúde Financeira</h1>
                <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(10,132,255,0.15)', border:'1px solid rgba(10,132,255,0.30)', color:'rgba(10,132,255,1)' }}>AGENTE AUTÔNOMO</span>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Daniel Kahneman (Nobel 2002) + Richard Thaler (Nobel 2017)</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {report?.generatedAt && (
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.40)' }}>
                <Clock size={13} /> {new Date(report.generatedAt).toLocaleString('pt-BR')}
              </div>
            )}
            <button id="btn-reanalisar-financeiro" onClick={() => fetchReport(true)} disabled={running} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:12, background:'rgba(10,132,255,0.15)', border:'1px solid rgba(10,132,255,0.30)', color:'rgba(10,132,255,1)', fontSize:13, fontWeight:600, cursor:'pointer', opacity:running?0.6:1 }}>
              <RefreshCw size={14} style={{ animation:running?'spin 1s linear infinite':'none' }} />
              {running ? (phase||'Analisando...') : 'Reanalisar'}
            </button>
          </div>
        </div>
        {/* SCORE */}
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'auto 1fr', gap:32, marginTop:28, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:110, height:110, borderRadius:'50%', background:`conic-gradient(${lc.color} ${(report?.score??0)*3.6}deg, rgba(255,255,255,0.08) 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 30px ${lc.glow}` }}>
              <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(15,16,22,0.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:26, fontWeight:800, color:lc.color, lineHeight:1 }}>{report?.score??0}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.40)', fontWeight:600 }}>/ 100</span>
              </div>
            </div>
            <div style={{ marginTop:10, fontSize:13, fontWeight:700, color:lc.color }}>{lc.label}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
            {Object.entries(report?.score_breakdown??{}).map(([key, val]: any, idx) => {
              const labels: Record<string,string> = { savings_rate:'Taxa de Poupança', expense_control:'Controle Gastos', emergency_fund:'Reserva Emergência', income_stability:'Estabilidade Renda', budget_adherence:'Aderência Orçamento' };
              const colors = ['rgba(10,132,255,1)','rgba(48,209,88,1)','rgba(191,90,242,1)','rgba(90,200,250,1)','rgba(255,214,10,1)'];
              const c = colors[idx%colors.length];
              return (
                <div key={key} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.40)', marginBottom:6 }}>{labels[key]??key}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                      <div style={{ width:`${val}%`, height:'100%', borderRadius:3, background:c, transition:'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:c, minWidth:28 }}>{val}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {report?.summary && (
        <div style={{ ...glass, padding:'14px 20px', marginBottom:20, background:lc.bg, border:`1px solid ${lc.color.replace('1)','0.25)')}` }}>
          <div style={prismLine} />
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.7 }}>{report.summary}</p>
        </div>
      )}

      {/* TABS */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:4, border:'1px solid rgba(255,255,255,0.08)', width:'fit-content' }}>
        {(['visao','vieses','nudges','logs'] as const).map(t => (
          <button key={t} id={`tab-fin-${t}`} onClick={() => setTab(t)} style={{ padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:600, background:activeTab===t?'rgba(255,255,255,0.10)':'transparent', border:activeTab===t?'1px solid rgba(255,255,255,0.16)':'1px solid transparent', color:activeTab===t?'rgba(255,255,255,0.90)':'rgba(255,255,255,0.45)', cursor:'pointer' }}>
            {t==='visao'?'Visão Geral':t==='vieses'?'Vieses Cognitivos':t==='nudges'?'Plano de Ação':'Logs do Agente'}
          </button>
        ))}
      </div>

      {/* TAB VISÃO */}
      {activeTab==='visao' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16 }}>
          {allInsights.map((ins: any, idx: number) => {
            const Icon = ins.type==='success'?CheckCircle:ins.type==='warning'?AlertTriangle:ins.type==='danger'?AlertCircle:Info;
            const c = insightColors[ins.type]||insightColors.info;
            return (
              <div key={idx} onClick={() => setActive(ins)} style={{ ...glass, padding:'18px 20px', cursor:'pointer', border:`1px solid ${c}22` }}>
                <div style={prismLine} />
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${c}18`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} color={c} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <h3 style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.88)', lineHeight:1.3 }}>{ins.title}</h3>
                      <span style={{ fontSize:10, fontWeight:700, color:c, background:`${c}18`, padding:'2px 8px', borderRadius:10, flexShrink:0, marginLeft:8 }}>{ins.priority?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.50)', lineHeight:1.6, marginBottom:8 }}>{ins.description}</p>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontStyle:'italic' }}>📚 {ins.methodology}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {allInsights.length===0 && (
            <div style={{ ...glass, padding:48, textAlign:'center', gridColumn:'1/-1' }}>
              <CheckCircle size={36} color="rgba(48,209,88,1)" style={{ margin:'0 auto 16px' }} />
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Nenhum alerta detectado</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Seu comportamento financeiro está excelente!</div>
            </div>
          )}
        </div>
      )}

      {/* TAB VIESES */}
      {activeTab==='vieses' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:16 }}>
          {biases.length===0 && (
            <div style={{ ...glass, padding:48, textAlign:'center', gridColumn:'1/-1' }}>
              <CheckCircle size={32} color="rgba(48,209,88,1)" style={{ margin:'0 auto 12px' }} />
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Nenhum viés crítico detectado</div>
            </div>
          )}
          {biases.map((b: any, i: number) => {
            const sc = b.priority==='critica'?'rgba(255,69,58,1)':b.priority==='alta'?'rgba(255,159,10,1)':b.priority==='media'?'rgba(255,214,10,1)':'rgba(48,209,88,1)';
            return (
              <div key={i} style={{ ...glass, padding:'20px 22px', border:`1px solid ${sc}22` }}>
                <div style={prismLine} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Brain size={15} color="rgba(191,90,242,1)" />
                    <span style={{ fontSize:14, fontWeight:700 }}>{b.title}</span>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:sc, background:`${sc}18`, padding:'3px 10px', borderRadius:12 }}>{b.priority?.toUpperCase()}</span>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.6, marginBottom:10 }}>{b.description}</p>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontStyle:'italic', marginBottom:10 }}>📚 {b.methodology}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, height:4, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(b.confidence??0.5)*100}%`, borderRadius:4, background:sc }} />
                  </div>
                  <span style={{ fontSize:10, color:sc, fontWeight:700 }}>{Math.round((b.confidence??0.5)*100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB NUDGES */}
      {activeTab==='nudges' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
          {nudges.map((n: any, i: number) => {
            const ic = n.impact==='alto'?'rgba(48,209,88,1)':n.impact==='medio'?'rgba(255,214,10,1)':'rgba(90,200,250,1)';
            return (
              <div key={i} style={{ ...glass, padding:'20px 22px' }}>
                <div style={prismLine} />
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Zap size={15} color={ic} />
                    <span style={{ fontSize:13, fontWeight:700 }}>{n.label}</span>
                  </div>
                  <span style={{ fontSize:10, color:ic, background:`${ic}18`, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>Impacto {n.impact}</span>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.50)', lineHeight:1.6, marginBottom:12 }}>{n.description}</p>
                {(n.potentialGain??0)>0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'rgba(48,209,88,1)', marginBottom:10 }}>
                    <TrendingUp size={14} /> {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n.potentialGain)}/mês
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.35)' }}>
                  <ChevronRight size={12} /> {n.category}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB LOGS */}
      {activeTab==='logs' && (
        <div style={{ ...glass, padding:'20px 24px' }}>
          <div style={prismLine} />
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Activity size={16} color="rgba(10,132,255,1)" />
            <span style={{ fontSize:14, fontWeight:700 }}>Logs da Última Execução</span>
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
          </div>
        </div>
      )}

      {/* MODAL */}
      {activeInsight && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.70)', backdropFilter:'blur(8px)' }} onClick={() => setActive(null)} />
          <div style={{ ...glass, padding:'28px 32px', border:'1px solid rgba(255,255,255,0.16)', zIndex:1, width:'100%', maxWidth:560 }}>
            <div style={prismLine} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <h2 style={{ fontSize:17, fontWeight:800, maxWidth:'80%' }}>{activeInsight.title}</h2>
              <button onClick={() => setActive(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.40)', cursor:'pointer', minWidth:44, minHeight:44, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.60)', lineHeight:1.7, marginBottom:16 }}>{activeInsight.detail||activeInsight.description}</p>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, padding:'14px 16px', fontSize:12, color:'rgba(255,255,255,0.50)', fontStyle:'italic' }}>
              📚 Metodologia: {activeInsight.methodology}
            </div>
            {activeInsight.confidence && (
              <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Confiança do agente:</span>
                <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                  <div style={{ width:`${activeInsight.confidence*100}%`, height:'100%', borderRadius:3, background:'rgba(10,132,255,1)' }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(10,132,255,1)' }}>{Math.round(activeInsight.confidence*100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
