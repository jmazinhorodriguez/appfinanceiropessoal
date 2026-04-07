import { redirect } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minHeight:'100vh', transition:'margin-left 0.32s var(--ease-smooth)' }}>
        <Header />
        <main style={{ flex:1, paddingBottom:60 }}>{children}</main>
      </div>
    </div>
  );
}
