import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { calculateMonthlyTax } from '@/lib/ai/tax-calculator';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { year, month } = body;

    if (!year || !month) return NextResponse.json({ error: 'Missing year/month' }, { status: 400 });

    // Mock fetching transactions
    const transactions: any[] = [];
    const investments: any[] = [];

    const taxResults = calculateMonthlyTax(year, month, transactions, investments);

    const enrichedDocs = taxResults.map(tr => ({
        ...tr,
        user_id: user.id,
        year,
        month
    }));

    if (enrichedDocs.length > 0) {
        await supabase.from('tax_events').insert(enrichedDocs);
    }

    return NextResponse.json({ success: true, eventsCount: enrichedDocs.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
