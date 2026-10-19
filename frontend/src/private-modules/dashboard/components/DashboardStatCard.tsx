import React from 'react';
import { Card } from '../../../shared/ui/Card';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { Badge, type BadgeVariant } from '../../../shared/ui/Badge';

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

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-emerald-500/15',
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  badge,
  isLoading = false,
  onClick,
}) => {
  return (
    <Card
      variant="glass"
      padding="lg"
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30 flex flex-col justify-between ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div>
        {/* Fila superior: Icono a la izquierda y Badge a la derecha con espacio generoso */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-xs`}
          >
            {icon}
          </div>
          {badge && (
            <Badge variant={badge.variant} size="sm" className="shrink-0 font-bold">
              {badge.text}
            </Badge>
          )}
        </div>

        {/* Título y Métrica numérica con ancho completo y sin cortes */}
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="h-9 w-28 mb-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight font-mono tracking-tight whitespace-nowrap">
              {value}
            </p>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 flex items-center gap-1.5 truncate">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
