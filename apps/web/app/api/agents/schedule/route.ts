/**
 * Cron Job — Roda diariamente às 09h UTC via Vercel Cron
 * Configurado em vercel.json:
 * { "crons": [{ "path": "/api/agents/schedule", "schedule": "0 9 * * *" }] }
 *
 * Rota protegida por CRON_SECRET no header Authorization.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { runFinancialHealthAgent } from '@/lib/agents/financial-health-agent';
import { runPortfolioHealthAgent } from '@/lib/agents/portfolio-health-agent';

export async function GET(req: NextRequest) {
  // Verificar autorização do cron job
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Buscar todos os usuários ativos
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true);

  if (error || !users) {
    return NextResponse.json({ ran: 0, error: error?.message }, { status: 500 });
  }

  let ran = 0;
  const errors: string[] = [];

  // Rodar ambos os agentes em paralelo para cada usuário
  await Promise.allSettled(
    users.map(async (user) => {
      try {
        await Promise.all([
          runFinancialHealthAgent(user.id),
          runPortfolioHealthAgent(user.id),
        ]);
        ran++;
      } catch (e) {
        const msg = `Agente falhou para user ${user.id}: ${e instanceof Error ? e.message : String(e)}`;
        console.error(msg);
        errors.push(msg);
      }
    })
  );

  return NextResponse.json({
    ran,
    total:     users.length,
    errors:    errors.length,
    timestamp: new Date().toISOString(),
  });
}
