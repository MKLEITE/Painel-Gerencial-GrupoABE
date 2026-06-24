'use client';

import { useEffect, useState } from 'react';

/**
 * Data formatada no cliente — evita hydration mismatch entre Node (SSR) e browser.
 */
export function FormattedDate({
  className,
  locale = 'pt-BR',
  weekday = 'long',
  day = '2-digit',
  month = 'long',
}: {
  className?: string;
  locale?: string;
  weekday?: Intl.DateTimeFormatOptions['weekday'];
  day?: Intl.DateTimeFormatOptions['day'];
  month?: Intl.DateTimeFormatOptions['month'];
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(new Date().toLocaleDateString(locale, { weekday, day, month }));
  }, [locale, weekday, day, month]);

  return <span className={className}>{label ?? '…'}</span>;
}
