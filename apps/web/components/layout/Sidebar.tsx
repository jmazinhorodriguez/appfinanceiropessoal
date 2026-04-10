'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSidebar } from './SidebarContext';
import {
  Sparkles, ChevronLeft, ChevronRight, LayoutDashboard,
  Wallet, Activity, TrendingUp, PieChart, Landmark,
  Settings, LogOut, X,
} from 'lucide-react';

const navGroups = [
  {
    title: 'Início',
    items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Contas',
    items: [
      { name: 'Gestão de Contas',  path: '/contas',           icon: Wallet   },
      { name: 'Saúde Financeira',  path: '/saude-financeira', icon: Activity },
    ],
  },
  {
    title: 'Investimentos',
    items: [
      { name: 'Carteira',          path: '/investimentos',    icon: TrendingUp },
      { name: 'Saúde das Aplicações', path: '/saude-aplicacoes', icon: PieChart },
    ],
  },
  {
    title: 'Fiscal',
    items: [{ name: 'Imposto de Renda', path: '/imposto-renda', icon: Landmark }],
  },
];

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ /g, '-');
}

export function Sidebar() {
  const { collapsed, mobileOpen, isMobile, toggle, closeMobile } = useSidebar();
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // No mobile, a sidebar é um overlay — só aparece quando mobileOpen === true
  const isVisible = isMobile ? mobileOpen : true;
  const width     = isMobile ? 260 : collapsed ? 68 : 240;

  return (
    <>
      {/* Overlay escuro no mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
          aria-hidden="true"
        />
      )}

      <aside
        className="lg-sidebar"
        aria-label="Menu de navegação"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width,
          transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'width 0.28s var(--ease-smooth), transform 0.28s var(--ease-smooth)',
          display: 'flex', flexDirection: 'column',
          zIndex: 50,
        }}
      >
        {/* Logo + colapsar */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', height: 80 }}>
          {(!collapsed || isMobile) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,rgba(10,132,255,1),rgba(191,90,242,1))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(10,132,255,0.32)', flexShrink: 0 }}>
                <Sparkles size={16} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'white' }}>FinanceOS</span>
            </div>
          )}
          {collapsed && !isMobile && (
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,rgba(10,132,255,1),rgba(191,90,242,1))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(10,132,255,0.32)' }}>
              <Sparkles size={16} color="white" />
            </div>
          )}

          {/* Botão fechar/colapsar */}
          <button
            id="btn-sidebar-toggle"
            onClick={isMobile ? closeMobile : toggle}
            aria-label={isMobile ? 'Fechar menu' : collapsed ? 'Expandir menu' : 'Recolher menu'}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
            }}
          >
            {isMobile ? <X size={14} /> : collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Botão expand quando totalmente colapsado no desktop */}
        {collapsed && !isMobile && (
          <button
            onClick={toggle}
            aria-label="Expandir menu"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', margin: '0 auto 20px' }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 12px' }} role="navigation">
          {navGroups.map((group, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              {(!collapsed || isMobile) && (
                <div style={{ padding: '0 12px', marginBottom: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                  {group.title}
                </div>
              )}

              {group.items.map(item => {
                const active  = pathname.startsWith(item.path);
                const isCollapsedDesktop = collapsed && !isMobile;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={isMobile ? closeMobile : undefined}
                    style={{ textDecoration: 'none' }}
                    aria-label={isCollapsedDesktop ? item.name : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
                      padding: isCollapsedDesktop ? '12px 0' : '10px 12px', borderRadius: 12, marginBottom: 4,
                      transition: 'all 0.2s var(--ease-smooth)',
                      background: active ? 'rgba(10,132,255,0.18)' : 'transparent',
                      border:     active ? '1px solid rgba(10,132,255,0.28)' : '1px solid transparent',
                      backdropFilter: active ? 'blur(8px)' : 'none',
                    }}>
                      <item.icon size={18} color={active ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
                      {!isCollapsedDesktop && (
                        <span style={{ marginLeft: 12, fontSize: 14, fontWeight: active ? 600 : 500, color: active ? 'white' : 'var(--text-secondary)' }}>
                          {item.name}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: settings + logout */}
        <div style={{ padding: '20px 12px', borderTop: '1px solid var(--border-subtle)' }}>
          <Link href="/configuracoes" onClick={isMobile ? closeMobile : undefined} style={{ textDecoration: 'none' }} aria-label="Configurações">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', padding: collapsed && !isMobile ? '12px 0' : '10px 12px', borderRadius: 12, marginBottom: 4, transition: 'all 0.2s var(--ease-smooth)', color: 'var(--text-secondary)', border: '1px solid transparent' }}>
              <Settings size={18} />
              {(!collapsed || isMobile) && <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 500 }}>Configurações</span>}
            </div>
          </Link>

          <button
            onClick={handleLogout}
            aria-label="Sair da conta"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              padding: collapsed && !isMobile ? '12px 0' : '10px 12px', borderRadius: 12, border: 'none',
              background: 'transparent', cursor: 'pointer', transition: 'all 0.2s var(--ease-smooth)', color: 'var(--accent-red)',
            }}
          >
            <LogOut size={18} />
            {(!collapsed || isMobile) && <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 500 }}>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
