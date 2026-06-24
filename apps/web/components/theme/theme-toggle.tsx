'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';

const VARIANT_STYLES = {
  default:
    'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-soft',
  overlay: 'login-chrome-btn border-white/20 hover:border-white/30',
} as const;

export function ThemeToggle({
  variant = 'default',
  className = '',
}: {
  variant?: keyof typeof VARIANT_STYLES;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';
  const label = !mounted ? 'Alternar tema' : isDark ? 'Ativar modo claro' : 'Ativar modo escuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={mounted ? (isDark ? 'Modo claro' : 'Modo escuro') : 'Alternar tema'}
      suppressHydrationWarning
      className={`group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border transition-all duration-300 ${VARIANT_STYLES[variant]} ${className}`}
    >
      {variant === 'default' && (
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/10 group-hover:to-accent/10 group-hover:opacity-100" />
      )}
      {mounted ? (
        <>
          <Moon
            className={`absolute h-5 w-5 transition-all duration-500 ease-spring ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <Sun
            className={`absolute h-5 w-5 transition-all duration-500 ease-spring ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </>
      ) : isDark ? (
        <Sun className="h-5 w-5 opacity-90" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 opacity-90" aria-hidden="true" />
      )}
    </button>
  );
}
