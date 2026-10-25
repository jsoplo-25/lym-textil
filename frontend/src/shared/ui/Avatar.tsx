import React from 'react';
import { cn, getUserInitials } from '../lib/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  initials?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showPhoto?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  initials,
  firstName,
  lastName,
  name,
  size = 'md',
  className,
  showPhoto = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-[11px] font-bold tracking-tight',
    md: 'w-10 h-10 text-xs font-bold tracking-tight',
    lg: 'w-12 h-12 text-sm font-bold tracking-tight',
    xl: 'w-16 h-16 text-lg font-black tracking-wider',
  };

  // Determine initials to display (e.g. "Jhon Anderson Soplopuco Lavado" -> "JS")
  const computedInitials =
    initials ||
    (firstName || lastName || name
      ? getUserInitials(firstName, lastName, name)
      : fallback
      ? (fallback.length <= 3 ? fallback.toUpperCase() : getUserInitials(undefined, undefined, fallback))
      : getUserInitials(undefined, undefined, alt !== 'Avatar' ? alt : undefined));

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0 shadow-sm ring-2 ring-white/80 dark:ring-slate-800/80',
        showPhoto && src
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold'
          : 'bg-primary-600 text-white font-black',
        sizes[size],
        className
      )}
    >
      {showPhoto && src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="leading-none">{computedInitials || 'JS'}</span>
      )}
    </div>
  );
};


