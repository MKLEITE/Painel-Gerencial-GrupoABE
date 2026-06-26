'use client';

import { useEffect, useState } from 'react';
import { BRAND_LOGO_CYCLE_MS, BRAND_MOUSE_LOGOS } from '@/lib/brand-logos';
import { BrandLogoStack } from '@/components/ui/brand-logo-stack';

interface BrandLogoCarouselProps {
  /** Área quadrada do container (px) */
  size?: number;
  className?: string;
}

/** Alterna logos da marca com crossfade suave (loading). */
export function BrandLogoCarousel({ size = 64, className = '' }: BrandLogoCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % BRAND_MOUSE_LOGOS.length);
    }, BRAND_LOGO_CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);

  return <BrandLogoStack size={size} activeIndex={index} className={className} />;
}
