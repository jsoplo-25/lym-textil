import React from 'react';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { BadgeVariant } from '../../../shared/ui/Badge';

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  isLoading?: boolean;
  onClick?: () => void;
}

/**
 * Tarjeta de métrica sobria: fondo sólido, borde fino, ícono pequeño en gris
 * y el número como protagonista. Sin burbujas de color ni badges decorativos.
 * `iconBg`, `iconColor` y `badge` se mantienen por compatibilidad pero no se renderizan.
 */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  isLoading = false,
  onClick,
}) => {
  return (
    <Card
      variant="solid"
      padding="md"
      onClick={onClick}
      className={`rounded-xl shadow-none flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <span className="text-slate-400 dark:text-slate-500 shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-8 w-24 mt-2" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight whitespace-nowrap">
          {value}
        </p>
      )}

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
      )}
    </Card>
  );
};
