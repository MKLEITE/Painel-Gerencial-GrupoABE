import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Repassa o pathname ao layout raiz (tema padrão por rota). */
export function middleware(request: NextRequest) {
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

  // Cookie para o layout SSR identificar /login mesmo sem header customizado.
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
