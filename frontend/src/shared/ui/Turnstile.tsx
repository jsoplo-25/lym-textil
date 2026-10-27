import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          action?: string;
          cData?: string;
          callback?: (token: string) => void;
          'error-callback'?: (error: unknown) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          language?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export interface TurnstileRef {
  reset: () => void;
  getResponse: () => string | undefined;
}

export interface TurnstileProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
  action?: string;
  className?: string;
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  (
    {
      siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
      onVerify,
      onExpire,
      onError,
      theme = 'auto',
      size = 'normal',
      action = 'login',
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Mantenemos los callbacks en refs para no recrear el widget ni disparar re-renders al escribir
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (e) {
            console.error('[Turnstile] Error al reiniciar widget:', e);
          }
        }
      },
      getResponse: () => {
        if (widgetIdRef.current && window.turnstile) {
          return window.turnstile.getResponse(widgetIdRef.current);
        }
        return undefined;
      },
    }));

    useEffect(() => {
      if (!siteKey) {
        return;
      }

      let isMounted = true;

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !isMounted) return;

        // Si ya hay un widget activo, no volver a renderizarlo
        if (widgetIdRef.current) return;

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme,
            size,
            callback: (token: string) => {
              if (isMounted) onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (isMounted) onExpireRef.current?.();
            },
            'error-callback': (err: unknown) => {
              if (isMounted) onErrorRef.current?.(err);
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('[Turnstile] Error al renderizar widget:', err);
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = TURNSTILE_SCRIPT_ID;
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 80);

        return () => {
          clearInterval(checkInterval);
        };
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch { }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, theme, size, action]);

    if (!siteKey) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        className={`min-h-[65px] flex items-center justify-center ${className}`}
      />
    );
  }
);

Turnstile.displayName = 'Turnstile';
