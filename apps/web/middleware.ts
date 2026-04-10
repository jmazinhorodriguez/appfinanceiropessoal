import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/contas',
  '/investimentos',
  '/saude-financeira',
  '/saude-aplicacoes',
  '/imposto-renda',
  '/analise-mercado',
  '/nova-ordem',
  '/configuracoes',
];

const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // ── Rota do cron: validar CRON_SECRET —————————————————————————
  if (pathname === '/api/agents/schedule') {
    const auth   = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return res;
  }

  // ── API routes de agentes: exigir apenas sessão válida ————————
  if (pathname.startsWith('/api/agents/')) {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return res;
  }

  // ── Rotas do dashboard: exigir sessão, redirecionar se ausente ─
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (session && (AUTH_ROUTES.includes(pathname) || pathname === '/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
