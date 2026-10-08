import React from 'react';
import { cn } from '../lib/utils';

export interface PageHeaderProps {
  /** Ícono pequeño junto al eyebrow, ej. <KeyRound className="w-4 h-4" /> */
  eyebrowIcon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Slot derecho, normalmente el botón de acción principal (crear/nuevo). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Encabezado estándar de página: eyebrow + ícono, título h1 y subtítulo.
 * Único layout de título permitido en private-modules — reemplaza los headers
 * que cada página reimplementaba a mano con tamaños y breakpoints distintos.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrowIcon,
  eyebrow,
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
          {eyebrowIcon}
          <span>{eyebrow}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
      </div>

      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';
