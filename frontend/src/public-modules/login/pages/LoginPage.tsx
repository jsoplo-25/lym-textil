import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import type { RootState } from '../../../app/store';
import { Sparkles } from 'lucide-react';
import { Card } from '../../../shared/ui/Card';
import { LoginForm } from '../components/LoginForm';
import { TextileCarousel } from '../components/TextileCarousel';

const BrandMark: React.FC<{ className?: string; badgeClassName?: string; iconClassName?: string }> = ({
  className,
  badgeClassName,
  iconClassName,
}) => (
  <div className={className ?? 'flex items-center gap-3'}>
    <div
      className={
        badgeClassName ??
        'w-11 h-11 rounded-full bg-slate-900/90 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg border border-white/20 shrink-0'
      }
    >
      <Sparkles className={iconClassName ?? 'w-5 h-5 text-emerald-400 dark:text-emerald-500'} />
    </div>
    <div>
      <h2 className="font-extrabold text-base leading-tight">Textil L&amp;M</h2>
      <p className="text-[11px] opacity-75 font-medium text-emerald-300">Plataforma de Control</p>
    </div>
  </div>
);

export const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Branding panel with dynamic Textile Carousel */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-slate-950 text-white">
        <TextileCarousel
          brandHeader={
            <BrandMark
              className="flex items-center gap-3 drop-shadow-lg"
              badgeClassName="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm shrink-0"
              iconClassName="w-5 h-5 text-emerald-400"
            />
          }
        />
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-[#F8F9FC] dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <BrandMark className="flex lg:hidden items-center gap-3 mb-10 justify-center text-slate-900 dark:text-white" />

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>

          <Card variant="solid" padding="lg" className="shadow-xl shadow-slate-200/50 dark:shadow-none">
            <LoginForm />
          </Card>

          {/* Enlaces de pie de login */}
          <div className="mt-6 text-center space-y-2 text-xs">
            <p>
              <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                &larr; Volver a la portada principal
              </Link>
            </p>
          </div>

          <p className="lg:hidden mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Textil L&amp;M
          </p>
        </div>
      </main>
    </div>
  );
};
