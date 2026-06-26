'use client';

import { usePathname } from 'next/navigation';
import { BrandCursor } from '@/components/ui/brand-cursor';

/** Cursor de marca — desativado na tela de login. */
export function BrandExperience() {
  const pathname = usePathname();
  const isLogin = pathname === '/login' || pathname.startsWith('/login/');

  if (isLogin) return null;
  return <BrandCursor />;
}
