'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Bell } from 'lucide-react';
import { AgentStatusBadge } from '@/components/ui/AgentStatusBadge';

export function Header() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const getPageInfo = () => {
    if (pathname.startsWith('/dashboard'))         return { title: 'Dashboard',                subtitle: 'Resumo das suas finanças'       };
    if (pathname.startsWith('/contas'))            return { title: 'Gestão de Contas',          subtitle: 'Controle de saldo e transações'  };
    if (pathname.startsWith('/saude-financeira'))  return { title: 'Saúde Financeira',           subtitle: 'Análise comportamental e nudges' };
    if (pathname.startsWith('/investimentos'))     return { title: 'Carteira de Investimentos', subtitle: 'Ativos e histórico'              };
    if (pathname.startsWith('/saude-aplicacoes'))  return { title: 'Saúde das Aplicações',       subtitle: 'Risco e diversificação'          };
    if (pathname.startsWith('/imposto-renda'))     return { title: 'Imposto de Renda',           subtitle: 'Apuração e declaração'           };
    if (pathname.startsWith('/configuracoes'))     return { title: 'Configurações',              subtitle: 'Ajustes da conta'               };
    return { title: 'FinanceOS', subtitle: 'Gestão Inteligente' };
  };

  const info = getPageInfo();

  return (
    <header
      className="lg-header"
      style={{ position: 'sticky', top: 0, zIndex: 40, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}
    >
      {/* Título da página */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{info.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{info.subtitle}</p>
      </div>

      {/* Direita: badges dos agentes + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {userId && <AgentStatusBadge userId={userId} />}

        <button id="btn-header-search" className="btn-glass" style={{ width: 44, padding: 0 }}>
          <Search size={18} />
        </button>

        <button id="btn-header-bell" className="btn-glass" style={{ width: 44, padding: 0, position: 'relative' }}>
          <Bell size={18} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 8px var(--accent-blue)' }} />
        </button>
      </div>
    </header>
  );
}
