'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Bell, Menu } from 'lucide-react';
import { AgentStatusBadge } from '@/components/ui/AgentStatusBadge';
import { useSidebar } from './SidebarContext';

const pageMap: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':        { title: 'Dashboard',                subtitle: 'Resumo das suas finanças'       },
  '/contas':           { title: 'Gestão de Contas',          subtitle: 'Controle de saldo e transações'  },
  '/saude-financeira': { title: 'Saúde Financeira',           subtitle: 'Análise comportamental e nudges' },
  '/investimentos':    { title: 'Carteira de Investimentos',  subtitle: 'Ativos e histórico'              },
  '/saude-aplicacoes': { title: 'Saúde das Aplicações',       subtitle: 'Risco e diversificação'          },
  '/imposto-renda':    { title: 'Imposto de Renda',           subtitle: 'Apuração e declaração'           },
  '/configuracoes':    { title: 'Configurações',              subtitle: 'Ajustes da conta'               },
};

export function Header() {
  const pathname               = usePathname();
  const [userId, setUserId]    = useState<string>('');
  const { isMobile, toggleMobile, collapsed } = useSidebar();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Encontra a página atual pelo path mais específico
  const info = Object.entries(pageMap).find(([key]) => pathname.startsWith(key))?.[1]
    ?? { title: 'FinanceOS', subtitle: 'Gestão Inteligente' };

  // Offset left da sidebar (desktop)
  const sidebarWidth = isMobile ? 0 : collapsed ? 68 : 240;

  return (
    <header
      id="main-header"
      className="lg-header"
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        marginLeft: 0,
        transition: 'margin-left 0.28s var(--ease-smooth)',
      }}
    >
      {/* Hamburger (mobile) */}
      {isMobile && (
        <button
          id="btn-menu-hamburger"
          onClick={toggleMobile}
          aria-label="Abrir menu de navegação"
          aria-expanded={false}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', marginRight: 12, flexShrink: 0,
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Título da página */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.title}
        </h1>
        {!isMobile && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{info.subtitle}</p>
        )}
      </div>

      {/* Direita: badges + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {userId && !isMobile && <AgentStatusBadge userId={userId} />}

        <button
          id="btn-header-search"
          className="btn-glass"
          aria-label="Buscar"
          style={{ width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Search size={18} />
        </button>

        <button
          id="btn-header-bell"
          className="btn-glass"
          aria-label="Notificações"
          style={{ width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
          <Bell size={18} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 8px var(--accent-blue)' }} />
        </button>
      </div>
    </header>
  );
}
