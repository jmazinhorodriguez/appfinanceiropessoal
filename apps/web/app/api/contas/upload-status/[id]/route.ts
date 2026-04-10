import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: upload, error } = await supabase
      .from('statement_uploads')
      .select('status, error_message')
      .eq('id', params.id)
      .single();

    if (error || !upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Se concluiu, pegar o total de transações importadas
    let count = 0;
    if (upload.status === 'completed') {
      const { count: txCount } = await supabase
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('statement_upload_id', params.id);
      
      const { count: ordCount } = await supabase
        .from('ordens')
        .select('*', { count: 'exact', head: true })
        .eq('statement_upload_id', params.id);

      const { count: provCount } = await supabase
        .from('proventos')
        .select('*', { count: 'exact', head: true })
        .eq('statement_upload_id', params.id);

      count = (txCount || 0) + (ordCount || 0) + (provCount || 0);
    }

    return NextResponse.json({ 
      status: upload.status === 'completed' ? 'concluido' : upload.status === 'failed' ? 'erro' : 'processando', 
      error: upload.error_message, 
      count: count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
