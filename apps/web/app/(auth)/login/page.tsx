'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return; }
    router.push('/dashboard');
  }

  return (
    <div className="lg-card animate-fade-up" style={{ width:'100%', maxWidth:420, padding:'40px 36px' }}>
      <div style={{ position:'absolute', top:-50, right:-30, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(10,132,255,0.16) 0%, transparent 70%)', filter:'blur(18px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-30, left:-20, width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle, rgba(191,90,242,0.10) 0%, transparent 70%)', filter:'blur(14px)', pointerEvents:'none' }} />

      <div style={{ textAlign:'center', marginBottom:34, position:'relative', zIndex:1 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg, rgba(10,132,255,1), rgba(191,90,242,1))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 6px 20px rgba(10,132,255,0.32)' }}>
          <TrendingUp size={24} color="white" />
        </div>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.02em', marginBottom:5 }}>FinanceOS</h1>
        <p style={{ color:'var(--text-tertiary)', fontSize:14 }}>Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit} style={{ position:'relative', zIndex:1 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>E-mail</label>
          <div style={{ position:'relative' }}>
            <Mail size={14} color="var(--text-tertiary)" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-glass" placeholder="seu@email.com" style={{ paddingLeft:38 }} />
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Senha</label>
          <div style={{ position:'relative' }}>
            <Lock size={14} color="var(--text-tertiary)" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type={show?'text':'password'} required value={password} onChange={e=>setPass(e.target.value)} className="input-glass" placeholder="••••••••" style={{ paddingLeft:38, paddingRight:44 }} />
            <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', padding:4 }}>
              {show ? <EyeOff size={14}/> : <Eye size={14}/>}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background:'rgba(255,69,58,0.10)', border:'1px solid rgba(255,69,58,0.24)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'rgba(255,69,58,1)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ width:'100%', padding:'13px 0' }}>
          {loading
            ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', animation:'spin 0.8s linear infinite' }} />
            : 'Entrar na Plataforma'
          }
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-tertiary)', position:'relative', zIndex:1 }}>
        Sem conta?{' '}
        <Link href="/register" style={{ color:'var(--accent-blue)', textDecoration:'none', fontWeight:600 }}>
          Criar gratuitamente
        </Link>
      </p>
    </div>
  );
}
