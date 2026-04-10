import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: upload, error } = await supabase
      .from('extratos_importados')
      .select('status, erro_mensagem, total_importadas')
      .eq('id', params.id)
      .single();

    if (error || !upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ 
      status: upload.status, 
      error: upload.erro_mensagem, 
      count: upload.total_importadas 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
