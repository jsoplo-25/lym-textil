import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'purple' | 'slate' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'lime',
  className,
}) => {
  const variants = {
    lime: 'bg-brand-lime text-slate-900 font-semibold',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium',
    outline: 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
