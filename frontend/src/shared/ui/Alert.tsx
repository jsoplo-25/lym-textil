import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertVariantConfig {
  container: string;
  icon: string;
  Icon: React.ElementType;
}

const VARIANTS: Record<AlertVariant, AlertVariantConfig> = {
  success: {
    container: 'bg-primary-500/10 border-primary-500/20 text-primary-700 dark:text-primary-300',
    icon: 'text-primary-500',
    Icon: CheckCircle2,
  },
  error: {
    container: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300',
    icon: 'text-red-500',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-accent-500/10 border-accent-500/20 text-accent-700 dark:text-accent-300',
    icon: 'text-accent-500',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300',
    icon: 'text-slate-500',
    Icon: Info,
  },
};

export interface AlertProps {
  variant?: AlertVariant;
  /** 'md' (por defecto): banner de página, p-4/text-sm. 'sm': banner compacto para
   *  formularios y modales, p-3/text-xs. */
  size?: 'sm' | 'md';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Banner de alerta inline reutilizable — reemplaza las 4 variantes de banner rojo/verde
 * que estaban duplicadas a mano (LoginForm, UserModal, RoleModal, ProfilePage).
 */
export const Alert: React.FC<AlertProps> = ({ variant = 'info', size = 'md', title, children, className }) => {
  const { container, icon, Icon } = VARIANTS[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-2xl border font-semibold flex items-start gap-2.5 animate-fadeIn',
        size === 'sm' ? 'p-3 text-xs' : 'p-4 text-sm',
        container,
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', 'shrink-0 mt-0.5', icon)} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-bold mb-0.5">{title}</p>}
        <span className="break-words">{children}</span>
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';
