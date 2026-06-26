'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

const controlClass =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60';

export function FormField({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex min-h-[1.25rem] items-end">
        <label className="text-sm font-medium leading-5 text-foreground">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      </div>
      <div className="mt-1.5">{children}</div>
      <p className="mt-1.5 min-h-4 text-xs leading-4 text-muted-foreground">{hint ?? '\u00A0'}</p>
    </div>
  );
}

export function FormInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: 'numeric' | 'text' | 'email';
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      className={controlClass}
    />
  );
}

export function FormSelect({
  value,
  onChange,
  required,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={controlClass}
    >
      {children}
    </select>
  );
}

export function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
    />
  );
}

export type SaveFeedbackState = {
  variant: 'success' | 'error';
  message: string;
} | null;

export function SaveFeedback({
  feedback,
  onDismiss,
}: {
  feedback: NonNullable<SaveFeedbackState>;
  onDismiss?: () => void;
}) {
  useEffect(() => {
    if (feedback.variant !== 'success' || !onDismiss) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  const isSuccess = feedback.variant === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      aria-live="polite"
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm animate-fade-in ${
        isSuccess
          ? 'border-success/50 bg-success/15 text-success'
          : 'border-danger/50 bg-danger/15 text-danger'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 leading-snug">{feedback.message}</span>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-6 py-4 sm:px-8">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
      {footer}
    </section>
  );
}

export function FormActions({
  onCancel,
  submitLabel,
  salvando,
  onSave,
  hideCancel,
  feedback,
  onFeedbackDismiss,
}: {
  onCancel?: () => void;
  submitLabel: string;
  salvando: boolean;
  onSave?: () => void;
  hideCancel?: boolean;
  feedback?: SaveFeedbackState;
  onFeedbackDismiss?: () => void;
}) {
  return (
    <div className="border-t border-border px-6 py-4 sm:px-8">
      <div
        className={`flex flex-col gap-3 ${feedback ? 'sm:flex-row sm:items-center sm:justify-between' : 'sm:flex-row sm:justify-end'}`}
      >
        {feedback && (
          <div className="min-w-0 flex-1">
            <SaveFeedback feedback={feedback} onDismiss={onFeedbackDismiss} />
          </div>
        )}
        <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {!hideCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-xl border border-border px-5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
          )}
          <button
            type={onSave ? 'button' : 'submit'}
            onClick={onSave}
            disabled={salvando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
