'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandLogoStack } from '@/components/ui/brand-logo-stack';
import { BRAND_CURSOR_IDLE_MS, BRAND_LOGO_CYCLE_MS, BRAND_MOUSE_LOGOS } from '@/lib/brand-logos';

/** Área de posicionamento do ponteiro (centro do mouse) */
const CURSOR_SIZE = 30;

function setNativeCursorHidden(hidden: boolean) {
  document.documentElement.classList.toggle('brand-custom-cursor', hidden);
}

/** Logos no ponteiro — só após 1s parado; ao mover, volta o cursor do sistema. */
export function BrandCursor() {
  const [idleActive, setIdleActive] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const lastMoveRef = useRef(performance.now());
  const lastCycleRef = useRef(0);
  const idleActiveRef = useRef(false);
  const inViewportRef = useRef(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || coarsePointer) return;

    const deactivateIdle = () => {
      if (!idleActiveRef.current) return;
      idleActiveRef.current = false;
      setIdleActive(false);
      setNativeCursorHidden(false);
    };

    const onMove = (event: MouseEvent) => {
      posRef.current = { x: event.clientX, y: event.clientY };
      lastMoveRef.current = performance.now();
      inViewportRef.current = true;
      deactivateIdle();
    };

    const onLeave = () => {
      inViewportRef.current = false;
      deactivateIdle();
    };

    const onEnter = () => {
      inViewportRef.current = true;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    const tick = (now: number) => {
      const stoppedFor = now - lastMoveRef.current;
      const isIdle = stoppedFor >= BRAND_CURSOR_IDLE_MS;

      if (isIdle && !idleActiveRef.current && inViewportRef.current) {
        idleActiveRef.current = true;
        lastCycleRef.current = now;
        setIdleActive(true);
        setNativeCursorHidden(true);
      }

      if (idleActiveRef.current && now - lastCycleRef.current >= BRAND_LOGO_CYCLE_MS) {
        lastCycleRef.current = now;
        setLogoIndex((i) => (i + 1) % BRAND_MOUSE_LOGOS.length);
      }

      const el = rootRef.current;
      if (el && idleActiveRef.current) {
        const x = posRef.current.x - CURSOR_SIZE / 2;
        const y = posRef.current.y - CURSOR_SIZE / 2;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      setNativeCursorHidden(false);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!idleActive) return null;

  return (
    <div
      ref={rootRef}
      className="brand-cursor pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
      style={{ width: CURSOR_SIZE, height: CURSOR_SIZE }}
      aria-hidden
    >
      <BrandLogoStack size={CURSOR_SIZE} activeIndex={logoIndex} />
    </div>
  );
}
