'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      registerSchema.parse(formData);

      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err.message || 'Erro ao registrar usuário');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#0a0b0f',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Orbs */}
      <div style={{ 
        position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', 
        background: 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)', 
        borderRadius: '50%', pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', 
        background: 'radial-gradient(circle, rgba(191,90,242,0.05) 0%, transparent 70%)', 
        borderRadius: '50%', pointerEvents: 'none' 
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="lg-card" 
        style={{ 
          padding: '48px 40px', 
          width: '100%', 
          maxWidth: 420, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 32,
          position: 'relative'
        }}
      >
        {/* Prismatic Highlight */}
        <div style={{ 
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, 
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)' 
        }} />

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            letterSpacing: '-0.02em', 
            margin: '0 0 8px',
            color: 'rgba(255,255,255,0.92)'
          }}>Criar Conta</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)', margin: 0 }}>
            Junte-se ao FinanceOS e alcance a liberdade.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <CheckCircle2 color="var(--accent-green)" size={48} style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Registro realizado!</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verifique seu e-mail para confirmar a conta.</p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleRegister} 
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div style={{ position: 'relative' }}>
                <User size={18} color="rgba(255,255,255,0.36)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  className="input-glass" 
                  style={{ paddingLeft: 44 }}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Mail size={18} color="rgba(255,255,255,0.36)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  placeholder="E-mail" 
                  className="input-glass" 
                  style={{ paddingLeft: 44 }}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} color="rgba(255,255,255,0.36)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  className="input-glass" 
                  style={{ paddingLeft: 44 }}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    padding: '12px 16px', 
                    background: 'rgba(255,69,58,0.1)', 
                    border: '1px solid rgba(255,69,58,0.2)', 
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: 'var(--accent-red)'
                  }}
                >
                  <AlertCircle size={14} /> {error}
                </motion.div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ 
                  marginTop: 8, 
                  height: 48,
                  fontSize: 15,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Registrar'}
              </button>

              <p style={{ textAlign: 'center', margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Já tem uma conta? <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
