import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'subtle' | 'solid';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  ...props
}) => {
  const variantStyles = {
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/80 shadow-soft-glass shadow-slate-200/50 dark:shadow-none',
    subtle: 'bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800',
    solid: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-3xl transition-all duration-300',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
