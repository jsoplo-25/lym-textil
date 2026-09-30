import React from 'react';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { Alert } from '../../../shared/ui/Alert';
import { useLogin } from '../hooks/useLogin';

export const LoginForm: React.FC = () => {
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

  return (
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
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded text-slate-900 dark:text-brand-lime focus:ring-0 cursor-pointer"
          />
          <span>Recordar sesión</span>
        </label>
        <a href="#forgot" className="text-slate-700 dark:text-slate-300 font-medium hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
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

      <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
        <span>Autenticación segura basada en JWT y Supabase</span>
      </div>
    </form>
  );
};
