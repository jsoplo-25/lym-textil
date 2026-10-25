import React, { useState, useEffect, useRef, useId } from 'react';
import { Clock, X, Check, RotateCcw } from 'lucide-react';
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const QUICK_TIMES = [
  { label: '06:00 (T1)', value: '06:00' },
  { label: '14:00 (T2)', value: '14:00' },
  { label: '22:00 (T3)', value: '22:00' },
];

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value = '',
  onChange,
  placeholder = 'HH:MM',
  error,
  disabled = false,
  leftIcon,
  className,
  id,
  align = 'left',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current hour and minute from value
  const [selectedHour, setSelectedHour] = useState<string>('08');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        const h = parts[0].trim().padStart(2, '0');
        const m = parts[1].trim().slice(0, 2).padStart(2, '0');
        setSelectedHour(h);
        setSelectedMinute(m);
      }
    }
  }, [value]);

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectHour = (h: string) => {
    setSelectedHour(h);
    onChange(`${h}:${selectedMinute}`);
  };

  const handleSelectMinute = (m: string) => {
    setSelectedMinute(m);
    onChange(`${selectedHour}:${m}`);
    setIsOpen(false);
  };

  const handleSetNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(`${h}:${m}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleQuickPreset = (presetValue: string) => {
    const [h, m] = presetValue.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(presetValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5 relative', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors block"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          'w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 flex items-center justify-between outline-none cursor-pointer select-none shadow-xs',
          isOpen && 'ring-2 ring-primary-500/20 border-primary-500 dark:border-primary-500',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800',
          error && 'border-red-500 focus:border-red-500 text-red-900 dark:text-red-200'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
            {leftIcon || <Clock className="w-4 h-4 text-primary-500" />}
          </div>
          <span
            className={cn(
              'truncate font-mono font-medium text-xs sm:text-sm',
              !value && 'text-slate-400 dark:text-slate-500 font-sans font-normal'
            )}
          >
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Limpiar hora"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1">{error}</p>}

      {/* Floating Time Popover */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 z-[110] w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 animate-in fade-in duration-150 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Header Display */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Seleccionar Hora
            </span>
            <span className="text-base font-black font-mono text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-lg bg-primary-500/10">
              {selectedHour}:{selectedMinute}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto">
            {QUICK_TIMES.map((q) => (
              <button
                type="button"
                key={q.value}
                onClick={() => handleQuickPreset(q.value)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shrink-0 cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Hours & Minutes Columns */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* Hours Column */}
            <div>
              <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-wider mb-1.5">
                Hora
              </p>
              <div className="h-44 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/60 p-1 space-y-1">
                {HOURS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => handleSelectHour(h)}
                    className={cn(
                      'w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer',
                      selectedHour === h
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-wider mb-1.5">
                Minuto
              </p>
              <div className="h-44 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/60 p-1 space-y-1">
                {MINUTES.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => handleSelectMinute(m)}
                    className={cn(
                      'w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer',
                      selectedMinute === m
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSetNow}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-500/10 transition-colors cursor-pointer text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hora Actual</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-500 transition-colors cursor-pointer text-[11px] shadow-xs"
            >
              <Check className="w-3 h-3" />
              <span>Listo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
