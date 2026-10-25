import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectBaseProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  id?: string;
}

export interface SingleSelectProps extends SelectBaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

export interface MultiSelectProps extends SelectBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

/**
 * Select reutilizable del sistema de diseño (misma línea visual que Input.tsx:
 * label, error, leftIcon, rounded-xl, focus ring). No es un <select> nativo —
 * es un listbox propio para poder soportar selección múltiple con checkboxes,
 * algo que un <select multiple> nativo no permite con buena UX.
 *
 * Modo simple:      <Select options={...} value={role} onChange={setRole} />
 * Modo multiselect:  <Select multiple options={...} value={roles} onChange={setRoles} />
 */
export const Select: React.FC<SelectProps> = (props) => {
  const {
    label,
    error,
    leftIcon,
    placeholder = 'Selecciona una opción',
    options,
    className,
    disabled,
    id,
  } = props;

  const generatedId = useId();
  const selectId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // El menú se renderiza en un portal a <body> (posición `fixed`) en vez de
  // `absolute` dentro del flujo normal: así no queda recortado por ancestros
  // con overflow-hidden/auto (p. ej. el contenedor de una tabla con scroll).
  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(Math.max(rect.width, 160), vw - 16);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));
    setCoords({ top: rect.bottom + 6, left, width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isSelected = (optionValue: string): boolean =>
    props.multiple ? props.value.includes(optionValue) : props.value === optionValue;

  const handleSelect = (optionValue: string) => {
    if (props.multiple) {
      const next = isSelected(optionValue)
        ? props.value.filter((v) => v !== optionValue)
        : [...props.value, optionValue];
      props.onChange(next);
    } else {
      (props as SingleSelectProps).onChange(optionValue);
      setIsOpen(false);
    }
  };

  const hasValue = props.multiple ? props.value.length > 0 : Boolean(props.value);

  const triggerLabel = (() => {
    if (props.multiple) {
      if (props.value.length === 0) return placeholder;
      if (props.value.length === 1) {
        return options.find((o) => o.value === props.value[0])?.label ?? placeholder;
      }
      return `${props.value.length} seleccionados`;
    }
    return options.find((o) => o.value === (props as SingleSelectProps).value)?.label ?? placeholder;
  })();

  return (
    <div className="w-full flex flex-col gap-1.5 relative" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <button
          type="button"
          id={selectId}
          ref={triggerRef}
          disabled={disabled}
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-sm rounded-xl px-4 py-2.5 transition-all duration-200 outline-none shadow-sm text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
            hasValue ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500',
            leftIcon && 'pl-10',
            'pr-9',
            isOpen
              ? 'ring-2 ring-slate-900/10 dark:ring-white/10 border-slate-900 dark:border-slate-300'
              : '',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 absolute right-3.5',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && !disabled && createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-multiselectable={props.multiple}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
            className="min-w-[160px] max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1 z-9999 animate-fadeIn"
          >
            {options.length === 0 ? (
              <p className="px-4 py-2.5 text-xs text-slate-400 text-center">Sin opciones disponibles.</p>
            ) : (
              options.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <button
                    type="button"
                    key={option.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-left transition-colors cursor-pointer',
                      selected
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {props.multiple && (
                      <span
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          selected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-slate-300 dark:border-slate-600'
                        )}
                      >
                        {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </span>
                    )}
                    <span className="truncate flex-1">{option.label}</span>
                    {!props.multiple && selected && (
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1">{error}</p>
      )}
    </div>
  );
};

Select.displayName = 'Select';
