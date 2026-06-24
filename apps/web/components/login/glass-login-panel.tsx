'use client';

import type { ReactNode } from 'react';

/**
 * Vidro estilo Apple — camadas em DOM real (Firefox não aplica bem
 * backdrop-filter / mask em ::before/::after).
 */
export function GlassLoginPanel({ children }: { children: ReactNode }) {
  return (
    <div className="glass-login w-full max-w-md animate-fade-in-up rounded-[28px]">
      <div className="glass-login__blur" aria-hidden />
      <div className="glass-login__edge" aria-hidden />
      <div className="glass-login__content p-8 sm:p-10">{children}</div>
    </div>
  );
}
