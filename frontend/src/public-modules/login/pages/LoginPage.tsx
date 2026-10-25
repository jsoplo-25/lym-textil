import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import type { RootState } from '../../../app/store';
import { Card } from '../../../shared/ui/Card';
import { LoginForm } from '../components/LoginForm';
import { TextileCarousel } from '../components/TextileCarousel';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Logo } from '../../../shared/ui/Logo';

export const LoginPage: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  // Ping silencioso para despertar el backend inmediatamente al cargar la pantalla de login
  useEffect(() => {
    axiosInstance.get('/health').catch(() => {
      // Silencioso: si el backend está dormido, Render empezará a iniciarse de inmediato
    });
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Branding panel with dynamic Textile Carousel */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-slate-950 text-white">
        <TextileCarousel
          brandHeader={
            <Logo
              size="sm"
              showText
              subtitle="Plataforma de Control"
              textClassName="text-white drop-shadow-md"
              className="drop-shadow-lg"
            />
          }
        />
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-10 relative bg-[#F8F9FC] dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <Logo
            size="md"
            showText
            subtitle="Plataforma de Control"
            className="flex lg:hidden mb-8 justify-center"
          />

          <div className="mb-8 text-center lg:text-left">
            <div className="hidden lg:flex justify-start mb-4">
              <Logo size="md" />
            </div>
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
