import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('statement_uploads')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
