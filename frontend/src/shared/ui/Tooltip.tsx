import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const GAP = 8;

const translateStyles: Record<NonNullable<TooltipProps['position']>, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
  right: '-translate-y-1/2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const hasContent = Boolean(content && content.trim());

  // Se posiciona con `fixed` vía portal en <body> en vez de `absolute` dentro del
  // propio flujo: así no queda recortado por ancestros con overflow-hidden/auto
  // (p. ej. la tabla de UsersPage) ni limitado al stacking context de un padre.
  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    switch (position) {
      case 'top':
        setCoords({ top: rect.top - GAP, left: rect.left + rect.width / 2 });
        break;
      case 'bottom':
        setCoords({ top: rect.bottom + GAP, left: rect.left + rect.width / 2 });
        break;
      case 'left':
        setCoords({ top: rect.top + rect.height / 2, left: rect.left - GAP });
        break;
      case 'right':
        setCoords({ top: rect.top + rect.height / 2, left: rect.right + GAP });
        break;
    }
  }, [position]);

  const show = useCallback(() => {
    if (!hasContent) return;
    updatePosition();
    setIsVisible(true);
  }, [hasContent, updatePosition]);

  const hide = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    if (!isVisible) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  if (!hasContent) {
    return <>{children}</>;
  }

  return (
    <span
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onMouseDown={hide}
      onClick={hide}
    >
      {children}
      {isVisible &&
        createPortal(
          <span
            role="tooltip"
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
            className={cn(
              'z-9999 w-max max-w-[calc(100vw-1.5rem)] break-words rounded-xl bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xl pointer-events-none animate-fadeIn',
              translateStyles[position]
            )}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
};
