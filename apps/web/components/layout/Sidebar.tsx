'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ChevronLeft, ChevronRight, LayoutDashboard, 
  Wallet, Activity, TrendingUp, PieChart, Landmark, 
  Settings, LogOut 
} from 'lucide-react';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navGroups = [
    {
      title: 'Início',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Contas',
      items: [
        { name: 'Gestão de Contas', path: '/contas', icon: Wallet },
        { name: 'Saúde Financeira', path: '/saude-financeira', icon: Activity }
      ]
    },
    {
      title: 'Investimentos',
      items: [
        { name: 'Carteira', path: '/investimentos', icon: TrendingUp },
        { name: 'Saúde das Aplicações', path: '/saude-aplicacoes', icon: PieChart }
      ]
    },
    {
      title: 'Fiscal',
      items: [
        { name: 'Imposto de Renda', path: '/imposto-renda', icon: Landmark }
      ]
    }
  ];

  const width = collapsed ? 68 : 240;

  return (
    <aside 
      className="lg-sidebar" 
      style={{ 
        position: 'fixed', left: 0, top: 0, bottom: 0, 
        width, transition: 'width 0.32s var(--ease-smooth)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50
      }}
    >
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', height: 80 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(10,132,255,1), rgba(191,90,242,1))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(10,132,255,0.32)' }}>
              <Sparkles size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'white' }}>FinanceOS</span>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(10,132,255,1), rgba(191,90,242,1))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(10,132,255,0.32)' }}>
            <Sparkles size={16} color="white" />
          </div>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          style={{ 
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
            width: 28, height: 28, display: collapsed ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {collapsed && (
        <button 
          onClick={() => setCollapsed(!collapsed)}
          style={{
             background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '50%',
             width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
             cursor: 'pointer', color: 'var(--text-secondary)', margin: '0 auto 20px'
          }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 12px' }}>
        {navGroups.map((group, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            {!collapsed && (
              <div style={{ padding: '0 12px', marginBottom: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                {group.title}
              </div>
            )}
            
            {group.items.map(item => {
              const active = pathname.startsWith(item.path);
              const activeStyle = active ? {
                background: 'rgba(10,132,255,0.18)',
                border: '1px solid rgba(10,132,255,0.28)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'white'
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-secondary)'
              };

              return (
                <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '12px 0' : '10px 12px', borderRadius: 12, marginBottom: 4,
                    transition: 'all 0.2s var(--ease-smooth)',
                    ...activeStyle
                  }}>
                    <item.icon size={18} color={active ? 'var(--accent-blue)' : 'var(--text-secondary)'} />
                    {!collapsed && <span style={{ marginLeft: 12, fontSize: 14, fontWeight: active ? 600 : 500 }}>{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '12px 0' : '10px 12px', borderRadius: 12, marginBottom: 4,
            transition: 'all 0.2s var(--ease-smooth)', color: 'var(--text-secondary)'
          }}>
            <Settings size={18} />
            {!collapsed && <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 500 }}>Configurações</span>}
          </div>
        </Link>
        <button onClick={handleLogout} style={{ 
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '12px 0' : '10px 12px', borderRadius: 12, border: 'none', background: 'transparent',
          cursor: 'pointer', transition: 'all 0.2s var(--ease-smooth)', color: 'var(--accent-red)'
        }}>
          <LogOut size={18} />
          {!collapsed && <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 500 }}>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
