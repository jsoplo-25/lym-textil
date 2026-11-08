import React, { useState, useEffect, useRef, useId } from 'react';
import { Clock, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface TimePickerProps {
  label?: string;
  value?: string; // Format: 'HH:MM' or 'H:MM'
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
  id?: string;
  align?: 'left' | 'right';
}

const QUICK_TIMES = [
  { label: 'Turno 1', hint: '08:00 AM', value: '08:00' },
  { label: 'Turno 2', hint: '06:00 PM', value: '18:00' },
];

const pad = (n: number) => String(n).padStart(2, '0');

type Period = 'AM' | 'PM';

/** 24h → 12h. 0 → 12 AM, 12 → 12 PM, 15 → 3 PM. */
const to12 = (h24: number): { h: number; period: Period } => ({
  h: h24 % 12 === 0 ? 12 : h24 % 12,
  period: h24 >= 12 ? 'PM' : 'AM',
});

/** 12h → 24h. 12 AM → 0, 12 PM → 12. */
const to24 = (h12: number, period: Period): number => (h12 % 12) + (period === 'PM' ? 12 : 0);

const parse = (value: string): { h: number; m: number } | null => {
  const match = value.trim().match(/^(\d{1,2}):(\d{1,2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return { h, m };
};

interface SpinnerProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
}

/** Campo numérico con flechas arriba/abajo. Se puede escribir o usar flechas/teclado. */
const Spinner: React.FC<SpinnerProps> = ({ label, value, min = 0, max, onChange }) => {
  const [text, setText] = useState(pad(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(pad(value));
  }, [value, editing]);

  const range = max - min + 1;
  const step = (d: number) => onChange(((((value - min + d) % range) + range) % range) + min);

  const arrow =
    'w-full h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer';

  return (
    <div className="flex flex-col items-center w-16">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      <button type="button" onClick={() => step(1)} className={arrow} aria-label={`Subir ${label}`}>
        <ChevronUp className="w-5 h-5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        maxLength={2}
        onFocus={(e) => {
          setEditing(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
          setText(digits);
          if (digits !== '' && Number(digits) >= min && Number(digits) <= max) onChange(Number(digits));
        }}
        onBlur={() => {
          setEditing(false);
          setText(pad(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            step(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            step(-1);
          }
        }}
        aria-label={label}
        className="w-full h-12 text-center text-3xl font-mono font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
      />
      <button type="button" onClick={() => step(-1)} className={arrow} aria-label={`Bajar ${label}`}>
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
};

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value = '',
  onChange,
  placeholder = 'Seleccionar hora',
  error,
  disabled = false,
  leftIcon,
  className,
  id,
  align = 'left',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const parsed = parse(value);
  const h24 = parsed?.h ?? 8;
  const minute = parsed?.m ?? 0;
  const { h: hour12, period } = to12(h24);
  const display = parsed ? `${pad(hour12)}:${pad(parsed.m)} ${period}` : '';
  const value24 = parsed ? `${pad(parsed.h)}:${pad(parsed.m)}` : '';

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const set = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);
  const setPeriod = (p: Period) => set(to24(hour12, p), minute);

  const setNow = () => {
    const now = new Date();
    set(now.getHours(), now.getMinutes());
  };

  // Alineación efectiva: si el popover (320px) no cabe hacia la derecha dentro del
  // contenedor recortante más cercano (p. ej. un modal), se ancla al borde derecho.
  const [autoAlign, setAutoAlign] = useState<'left' | 'right' | null>(null);

  const computeAlign = () => {
    const el = containerRef.current;
    if (!el) return;
    const POPOVER_W = 320;
    let limitLeft = 0;
    let limitRight = window.innerWidth;
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const o = getComputedStyle(node);
      if (/(auto|scroll|hidden|clip)/.test(o.overflowX + o.overflow)) {
        const r = node.getBoundingClientRect();
        limitLeft = Math.max(limitLeft, r.left);
        limitRight = Math.min(limitRight, r.right);
        break;
      }
      node = node.parentElement;
    }
    const r = el.getBoundingClientRect();
    const fitsRight = r.left + POPOVER_W <= limitRight - 8;
    const fitsLeft = r.right - POPOVER_W >= limitLeft + 8;
    if (fitsRight) setAutoAlign('left');
    else if (fitsLeft) setAutoAlign('right');
    else setAutoAlign(align);
  };

  const toggle = () => {
    if (disabled) return;
    if (!isOpen) computeAlign();
    // Al abrir sin valor, deja una hora inicial ya elegida para que el campo no quede vacío
    if (!isOpen && !parsed) set(h24, minute);
    setIsOpen((p) => !p);
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5 relative', className)} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          {label}
        </label>
      )}

      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 flex items-center justify-between gap-2 outline-none cursor-pointer shadow-xs text-left',
          isOpen && 'ring-2 ring-primary-500/20 border-primary-500 dark:border-primary-500',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800',
          error && 'border-red-500'
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="text-slate-400 dark:text-slate-500 shrink-0">
            {leftIcon || <Clock className="w-4 h-4 text-primary-500" />}
          </span>
          <span
            className={cn(
              'truncate',
              display
                ? 'font-mono font-medium text-slate-900 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            {display || placeholder}
          </span>
        </span>
        {display && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsOpen(false);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            title="Quitar hora"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1">{error}</p>}

      {isOpen && (
        <div
          className={cn(
            'fixed inset-x-4 mx-auto max-w-80 sm:absolute sm:inset-x-auto sm:mx-0 sm:top-full mt-2 z-[110] sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 select-none',
            (autoAlign ?? align) === 'right' ? 'sm:right-0' : 'sm:left-0'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Spinner
              label="Hora"
              value={hour12}
              min={1}
              max={12}
              onChange={(h) => set(to24(h, period), minute)}
            />
            <span className="text-3xl font-mono font-semibold text-slate-400 mt-5">:</span>
            <Spinner label="Minutos" value={minute} max={59} onChange={(m) => set(h24, m)} />
            <div className="flex flex-col gap-1.5 ml-2 mt-5">
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'w-12 h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                    period === p
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3">
            {QUICK_TIMES.map((q) => (
              <button
                type="button"
                key={q.value}
                onClick={() => onChange(q.value)}
                className={cn(
                  'py-1.5 rounded-lg border text-center cursor-pointer transition-colors',
                  value24 === q.value
                    ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className="block text-[11px] font-semibold leading-tight">{q.label}</span>
                <span className="block text-[10px] font-mono text-slate-400 leading-tight">{q.hint}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={setNow}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Usar hora actual
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
