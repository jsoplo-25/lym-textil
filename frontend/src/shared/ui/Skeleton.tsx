import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/50', className)}
      {...props}
    />
  );
};
