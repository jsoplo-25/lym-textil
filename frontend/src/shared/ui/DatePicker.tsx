import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface DatePickerProps {
  label?: string;
  value?: string; // Format: 'YYYY-MM-DD'
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  className?: string;
  id?: string;
  minDate?: string;
  maxDate?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value = '',
  onChange,
  placeholder = 'Selecciona una fecha',
  error,
  disabled = false,
  leftIcon,
  className,
  id,
  minDate,
  maxDate,
  align = 'left',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const initialDate = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Handle click outside
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

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    onChange(`${yearStr}-${monthStr}-${dayStr}`);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const isDateDisabled = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${monthStr}-${dayStr}`);
    setIsOpen(false);
  };

  // Build calendar matrix
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const isSelected = (day: number) => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  // Format display date for the trigger input
  const formatDisplay = (val: string): string => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
            {leftIcon || <CalendarIcon className="w-4 h-4 text-primary-500" />}
          </div>
          <span
            className={cn(
              'truncate font-medium text-xs sm:text-sm',
              !value && 'text-slate-400 dark:text-slate-500 font-normal'
            )}
          >
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Limpiar fecha"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1">{error}</p>}

      {/* Floating Calendar Popover */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 z-[110] w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in duration-150 select-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span className="text-primary-600 dark:text-primary-400 font-mono">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mt-3 mb-1 text-center">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Previous month days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const prevDay = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="py-2 text-slate-300 dark:text-slate-700 font-medium cursor-not-allowed"
                >
                  {prevDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const currentDay = isToday(day);
              const disabledDay = isDateDisabled(day);

              return (
                <button
                  type="button"
                  key={day}
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'py-2 rounded-xl font-semibold transition-all relative',
                    disabledDay
                      ? 'opacity-30 cursor-not-allowed pointer-events-none'
                      : 'cursor-pointer',
                    selected
                      ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/20 scale-105'
                      : !disabledDay && 'text-slate-700 dark:text-slate-300 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400',
                    currentDay && !selected && 'border border-primary-500/40 font-bold text-primary-600 dark:text-primary-400'
                  )}
                >
                  {day}
                  {currentDay && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-500/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoy ({today.getDate()} {MONTH_NAMES[today.getMonth()].slice(0, 3)})</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
