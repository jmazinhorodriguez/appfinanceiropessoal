import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedRoutes = [
    '/dashboard',
    '/contas',
    '/investimentos',
    '/saude-financeira',
    '/saude-aplicacoes',
    '/imposto-renda',
    '/analise-mercado',
    '/nova-ordem',
    '/configuracoes'
  ];

  const url = req.nextUrl.clone();
  
  if (!session && protectedRoutes.some(route => url.pathname.startsWith(route))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (session && (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/')) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
