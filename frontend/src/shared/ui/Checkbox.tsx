import React, { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

/**
 * Checkbox reutilizable con estado visual propio (reemplaza el checkbox nativo
 * sin estilos que se usaba a mano en LoginForm).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer appearance-none w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/90 checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            {...props}
          />
          <Check
            className="pointer-events-none absolute w-3 h-3 text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity"
            strokeWidth={3}
          />
        </span>
        {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
