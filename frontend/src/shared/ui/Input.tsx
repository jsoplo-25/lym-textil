import React, { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      className,
      id,
      placeholder,
      type,
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const effectiveType = isPasswordType && showPassword ? 'text' : type;

    const renderRightIcon = () => {
      if (rightIcon) return rightIcon;
      if (isPasswordType && showPasswordToggle) {
        return (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-0.5"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        );
      }
      return null;
    };

    const hasRightContent = Boolean(rightIcon || (isPasswordType && showPasswordToggle));

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 z-10 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            placeholder={placeholder}
            className={cn(
              'w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 transition-all duration-200 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-300 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500',
              leftIcon && 'pl-10',
              hasRightContent && 'pr-10',
              error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500 text-red-900 dark:text-red-200',
              className
            )}
            {...props}
          />

          {hasRightContent && (
            <div className="absolute right-3.5 z-10 text-slate-400 dark:text-slate-500 flex items-center justify-center">
              {renderRightIcon()}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium pl-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
