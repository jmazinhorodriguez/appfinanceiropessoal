import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { actionId, label, category, potentialGain } = body;

    // Simply log the execution for now, this could create real goals/rules in DB
    const { error } = await supabase.from('agent_reports').insert({
      user_id: user.id,
      agent_type: 'financial_health',
      report_data: { 
        event: 'nudge_executed', 
        actionId, 
        label, 
        category,
        potentialGain
      },
      generated_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Nudge "${label}" ativado com sucesso!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
