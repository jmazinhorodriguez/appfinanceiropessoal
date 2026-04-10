'use client';
import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const { collapsed, isMobile } = useSidebar();
  const marginLeft = isMobile ? 0 : collapsed ? 68 : 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div 
        style={{ 
          flex: 1, 
          marginLeft, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh', 
          transition: 'margin-left 0.28s var(--ease-smooth)',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}
      >
        <Header />
        <main style={{ flex: 1, paddingBottom: 60 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
