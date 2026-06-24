'use client';

import { useEffect } from 'react';

/** Garante tema escuro e fundo transparente no login (fallback cross-browser). */
export function LoginPageShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-login', '');
    html.classList.add('dark');

    return () => {
      html.removeAttribute('data-login');
      const saved = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/)?.[1];
      if (saved === 'light') html.classList.remove('dark');
      else if (saved === 'dark') html.classList.add('dark');
    };
  }, []);

  return children;
}
