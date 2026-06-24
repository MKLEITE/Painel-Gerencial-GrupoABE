import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/** Renova sessão Supabase e repassa pathname ao layout raiz (tema por rota). */
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  if (isLoginRoute) {
    requestHeaders.set('x-login-route', '1');
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  if (isLoginRoute) {
    response.cookies.set('login-route', '1', { path: '/', sameSite: 'lax' });
  } else {
    response.cookies.delete('login-route');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)',
  ],
};
