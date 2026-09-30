import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '../../../app/store';
import { Card } from '../../../shared/ui/Card';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../../../shared/ui/ThemeToggle';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F3F4F8] dark:bg-[#0B0F17] relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="fixed top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/05 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/05 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl mb-2 transition-transform hover:scale-105">
            <Sparkles className="w-7 h-7 text-brand-lime animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Textil L&M
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Sistema de Gestión & Control de Producción Textil
          </p>
        </div>

        {/* Card Form */}
        <Card variant="glass" padding="lg" className="shadow-2xl backdrop-blur-md">
          <LoginForm />
        </Card>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>public-modules/login Architecture • JWT Encrypted</span>
        </div>
      </div>
    </div>
  );
};
