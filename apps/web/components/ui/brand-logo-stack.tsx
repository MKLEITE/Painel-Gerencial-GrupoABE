'use client';

import { BRAND_LOGO_DRAW_RATIO, BRAND_LOGO_FADE_MS, BRAND_MOUSE_LOGOS } from '@/lib/brand-logos';

interface BrandLogoStackProps {
  /** Área quadrada do container (px) */
  size: number;
  /** Índice da logo visível */
  activeIndex: number;
  /** Duração do crossfade (ms) */
  fadeMs?: number;
  className?: string;
}

/**
 * Empilha logos no mesmo centro visual — corrige SVGs com viewBox/padding diferentes.
 */
export function BrandLogoStack({
  size,
  activeIndex,
  fadeMs = BRAND_LOGO_FADE_MS,
  className = '',
}: BrandLogoStackProps) {
  const baseDraw = size * BRAND_LOGO_DRAW_RATIO;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden>
      {BRAND_MOUSE_LOGOS.map((logo, i) => {
        const draw = Math.round(baseDraw * logo.scale);

        return (
          <img
            key={logo.src}
            src={logo.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute object-contain object-center"
            style={{
              left: '50%',
              top: '50%',
              width: draw,
              height: draw,
              transform: 'translate(-50%, -50%)',
              opacity: i === activeIndex ? 1 : 0,
              transition: `opacity ${fadeMs}ms ease-out`,
            }}
          />
        );
      })}
    </div>
  );
}
