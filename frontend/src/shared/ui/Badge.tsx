import React from 'react';
import { cn } from '../lib/utils';

export type BadgeVariant = 'emerald' | 'slate' | 'rose' | 'amber' | 'blue' | 'purple';

const VARIANTS: Record<BadgeVariant, string> = {
  emerald: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  amber: 'bg-accent-500/10 text-accent-600 dark:text-accent-400 border-accent-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

const SIZES = {
  sm: 'gap-1.5 px-2.5 py-1 text-xs',
  md: 'gap-2 px-3 py-1.5 text-sm',
} as const;

export interface BadgeProps {
  variant?: BadgeVariant;
  /** 'sm' (por defecto): chip estándar de tabla/card. 'md': indicador de estado
   *  más grande para encabezados de página (ej. estado principal de un detalle). */
  size?: keyof typeof SIZES;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Chip de estado reutilizable (rol, estado de máquina/lote, activo/inactivo, etc).
 * Único componente de "badge" del sistema — reemplaza los ~4 tamaños de chip
 * distintos que cada página armaba a mano.
 */
export const Badge: React.FC<BadgeProps> = ({ variant = 'slate', size = 'sm', icon, children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold border',
        SIZES[size],
        VARIANTS[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
