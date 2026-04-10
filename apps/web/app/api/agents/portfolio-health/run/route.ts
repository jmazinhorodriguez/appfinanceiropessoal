import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { runPortfolioHealthAgent } from '@/lib/agents/portfolio-health-agent';

const AGENT_ID  = 'portfolio-health-agent-v1';
const MAX_AGE_MS = 23 * 60 * 60 * 1000; // 23 horas

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await runPortfolioHealthAgent(user.id);
  return NextResponse.json(report);
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('agent_reports')
    .select('*')
    .eq('user_id', user.id)
    .eq('agent_id', AGENT_ID)
    .single();

  if (!data) {
    const report = await runPortfolioHealthAgent(user.id);
    return NextResponse.json(report);
  }

  const age = Date.now() - new Date(data.generated_at).getTime();
  if (age > MAX_AGE_MS) {
    const fresh = await runPortfolioHealthAgent(user.id);
    return NextResponse.json(fresh);
  }

  return NextResponse.json(data.report);
}
