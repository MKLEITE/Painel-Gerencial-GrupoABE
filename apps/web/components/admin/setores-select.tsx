'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SETORES_ATUACAO } from '@/lib/admin-constants';

interface SetoresSelectProps {
  value: string[];
  onChange: (setores: string[]) => void;
}

export function SetoresSelect({ value, onChange }: SetoresSelectProps) {
  const [aberto, setAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => setMounted(true), []);

  const atualizarPosicao = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!aberto) return;

    atualizarPosicao();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setAberto(false);
    }

    function handleReposicionar() {
      atualizarPosicao();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposicionar);
    window.addEventListener('scroll', handleReposicionar, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposicionar);
      window.removeEventListener('scroll', handleReposicionar, true);
    };
  }, [aberto, atualizarPosicao]);

  function toggle(setor: string) {
    onChange(
      value.includes(setor) ? value.filter((s) => s !== setor) : [...value, setor],
    );
  }

  function remover(setor: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((s) => s !== setor));
  }

  const label =
    value.length === 0
      ? 'Selecione os setores de atuação'
      : value.length === 1
        ? value[0]
        : `${value.length} setores selecionados`;

  const painel =
    aberto && mounted
      ? createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Setores de atuação
            </p>
            {SETORES_ATUACAO.map((setor) => {
              const selecionado = value.includes(setor);
              return (
                <button
                  key={setor}
                  type="button"
                  role="option"
                  aria-selected={selecionado}
                  onClick={() => toggle(setor)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                    selecionado ? 'bg-primary/5 text-foreground' : 'text-foreground'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selecionado
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input'
                    }`}
                  >
                    {selecionado && <Check className="h-3 w-3" />}
                  </span>
                  {setor}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={aberto}
        aria-haspopup="listbox"
        onClick={() => {
          if (!aberto) atualizarPosicao();
          setAberto((v) => !v);
        }}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-background px-3 text-left text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 ${
          aberto ? 'border-primary ring-4 ring-primary/15' : 'border-input'
        } ${value.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((setor) => (
            <span
              key={setor}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {setor}
              <button
                type="button"
                onClick={(e) => remover(setor, e)}
                className="rounded-full hover:bg-primary/20"
                aria-label={`Remover ${setor}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {painel}
    </div>
  );
}
