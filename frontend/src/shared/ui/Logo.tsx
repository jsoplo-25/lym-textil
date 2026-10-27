import React from 'react';
import { cn } from '../lib/utils';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  className?: string;
  badgeClassName?: string;
}

const SIZES = {
  xs: 'w-8 h-8 rounded-xl p-1',
  sm: 'w-10 h-10 rounded-xl p-1',
  md: 'w-12 h-12 rounded-2xl p-1.5',
  lg: 'w-14 h-14 rounded-2xl p-2',
  xl: 'w-16 h-16 rounded-3xl p-2.5',
};

/**
 * Componente oficial de logotipo Textil L&M con el monograma bordado de hilo y aguja.
 * Diseñado con alto contraste y contenedor pulido para modo claro y modo oscuro.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  textClassName,
  subtitle = 'Plataforma de Control',
  className,
  badgeClassName,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        className={cn(
          'bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-md shadow-slate-900/10 dark:shadow-primary-500/10 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 overflow-hidden',
          SIZES[size],
          badgeClassName
        )}
      >
        <img
          src="/images/logo/Logo-lym.webp"
          alt="Textil L&M"
          className="w-full h-full object-contain select-none"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-black text-slate-900 dark:text-white tracking-tight leading-tight text-base sm:text-lg',
              textClassName
            )}
          >
            Textil L&amp;M
          </span>
          {subtitle && (
            <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 tracking-wide mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
