import { redirect } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/server';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <SidebarProvider>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </SidebarProvider>
  );
}
