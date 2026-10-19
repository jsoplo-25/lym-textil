import React, { useState } from 'react';
import { Mail, Lock, LogIn, ShieldCheck, Cookie } from 'lucide-react';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { Alert } from '../../../shared/ui/Alert';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { useLogin } from '../hooks/useLogin';
import { CookiesInfoModal } from './CookiesInfoModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginForm: React.FC = () => {
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const {
    email,
    password,
    rememberMe,
    isLoading,
    error,
    setEmail,
    setPassword,
    setRememberMe,
    handleSubmit,
  } = useLogin();

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timer = setTimeout(() => setSlowNotice(true), 4000);
    } else {
      setSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="error" size="sm">
            {error}
          </Alert>
        )}

        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between pt-1">
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label="Recordar sesión"
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="h-auto px-0 py-0 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-transparent hover:underline hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          className="w-full font-semibold group mt-2 shadow-lg"
          isLoading={isLoading}
        >
          <span>Iniciar Sesión</span>
          <LogIn className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>

        {slowNotice && isLoading && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs text-center animate-pulse">
            El servidor se está reactivando tras un periodo de inactividad. Esto puede tomar unos segundos...
          </div>
        )}

        <div className="pt-2 flex flex-col items-center justify-center gap-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Acceso seguro y protegido para personal autorizado</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCookiesModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
          >
            <Cookie className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span>
              Esta plataforma utiliza cookies seguras.{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
                Ver detalle
              </span>
            </span>
          </button>
        </div>
      </form>

      <CookiesInfoModal
        isOpen={isCookiesModalOpen}
        onClose={() => setIsCookiesModalOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={email}
        onPasswordResetSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
        }}
      />
    </>
  );
};


