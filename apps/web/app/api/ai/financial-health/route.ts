import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { analyzeFinancialHealth } from '@/lib/ai/financial-health-analyzer';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch last 90 days of txs
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateStr);

    if (txError) throw txError;

    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (accError) throw accError;

    const analysis = analyzeFinancialHealth(txs || [], accounts || []);

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
