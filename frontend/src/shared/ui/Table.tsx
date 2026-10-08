import React from 'react';
import { cn } from '../lib/utils';

interface WithChildren {
  children?: React.ReactNode;
  className?: string;
}

interface TableContainerProps extends WithChildren {
  /** Alto máximo del cuerpo de la tabla (ej. "900px"); al superarlo aparece scroll
   *  vertical con el encabezado fijo. Si se omite, la tabla crece libremente. */
  maxBodyHeight?: string;
  /** Contenido fijo debajo del área scrolleable (ej. una fila de totales) — no se
   *  desplaza junto con las filas cuando `maxBodyHeight` activa el scroll. */
  footer?: React.ReactNode;
}

/** Tarjeta contenedora de la tabla: borde, sombra y scroll horizontal. */
export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className,
  maxBodyHeight,
  footer,
}) => (
  <div
    className={cn(
      'rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden',
      className
    )}
  >
    <div
      className="overflow-x-auto"
      style={maxBodyHeight ? { maxHeight: maxBodyHeight, overflowY: 'auto' } : undefined}
    >
      {children}
    </div>
    {footer}
  </div>
);

export const Table: React.FC<WithChildren> = ({ children, className }) => (
  <table className={cn('w-full text-left border-collapse', className)}>{children}</table>
);

/** Fila de encabezado única con el estilo estándar — pasar los <Th> como hijos.
 *  `sticky top-0` no hace nada si la tabla no está dentro de un contenedor con
 *  scroll (ver `maxBodyHeight` de TableContainer); con scroll, queda fijo arriba. */
export const TableHead: React.FC<WithChildren> = ({ children, className }) => (
  <thead className="sticky top-0 z-10">
    <tr
      className={cn(
        'border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800',
        className
      )}
    >
      {children}
    </tr>
  </thead>
);

interface CellProps extends WithChildren {
  align?: 'left' | 'right';
  colSpan?: number;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
}

export const Th: React.FC<CellProps> = ({ children, align = 'left', className }) => (
  <th className={cn('py-4 px-6', align === 'right' && 'text-right', className)}>{children}</th>
);

export const TableBody: React.FC<WithChildren> = ({ children, className }) => (
  <tbody className={cn('divide-y divide-slate-100 dark:divide-slate-800/60 text-xs', className)}>
    {children}
  </tbody>
);

interface TrProps extends WithChildren {
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
}

export const Tr: React.FC<TrProps> = ({ children, className, onClick }) => (
  <tr
    onClick={onClick}
    className={cn('hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors', className)}
  >
    {children}
  </tr>
);

export const Td: React.FC<CellProps> = ({ children, align = 'left', className, colSpan, onClick }) => (
  <td
    colSpan={colSpan}
    onClick={onClick}
    className={cn('py-4 px-6', align === 'right' && 'text-right', className)}
  >
    {children}
  </td>
);

/** Fila única para el estado "sin resultados", ya centrada y con colSpan. */
export const TableEmptyRow: React.FC<{ colSpan: number; children: React.ReactNode }> = ({
  colSpan,
  children,
}) => (
  <tr>
    <td colSpan={colSpan} className="py-12 text-center text-slate-400 font-medium">
      {children}
    </td>
  </tr>
);
