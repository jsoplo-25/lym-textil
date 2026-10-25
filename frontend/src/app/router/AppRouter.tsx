import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Logo } from '../../shared/ui/Logo';
import { useInitSession } from '../../entities/session/useInitSession';
import { SessionSyncWatcher } from '../../entities/session/useSessionSync';
import { LoginPage } from '../../public-modules/login';
import { MainLayout } from '../../private-modules/layout/MainLayout';
import { DashboardPage } from '../../private-modules/dashboard';
import { ProfilePage } from '../../private-modules/profile';
import { UsersPage } from '../../private-modules/users';
import { RolesPage } from '../../private-modules/roles';
import { MachinesPage } from '../../private-modules/machines';
import { SuppliersPage } from '../../private-modules/suppliers/pages/SuppliersPage';
import { ProductionBatchesPage, ProductionDetailPage } from '../../private-modules/production';
import { WelcomePortalPage } from '../../public-modules/welcome/pages/WelcomePortalPage';

import { hasPermission } from '../../shared/lib/roles';

const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const PermissionRoute: React.FC<{ permission: string; children?: React.ReactNode }> = ({
  permission,
  children,
}) => {
  const user = useSelector((state: RootState) => state.session.user);

  if (!hasPermission(user, permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const AppRouter: React.FC = () => {
  const { isInitialized } = useInitSession();

  // Loading Screen while verifying session via httpOnly cookie on initial load/F5
  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F6F8FB] dark:bg-[#0B0F17] transition-colors relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-primary-500/10 dark:bg-primary-500/08 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-5 relative z-10 animate-fadeIn">
          <div className="relative">
            <Logo
              size="xl"
              badgeClassName="w-20 h-20 rounded-3xl shadow-2xl shadow-primary-600/20 dark:shadow-primary-500/15 border-2 border-white dark:border-slate-800"
            />
            <div className="absolute -inset-1.5 rounded-3xl bg-primary-500/20 blur-md -z-10 animate-pulse" />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Textil L&amp;M
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
              <span>Verificando sesión segura...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SessionSyncWatcher />
      <Routes>
        {/* Public Modules */}
        <Route path="/" element={<WelcomePortalPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tracking" element={<WelcomePortalPage />} />
        <Route path="/tracking/:code" element={<WelcomePortalPage />} />
        <Route path="/seguimiento" element={<WelcomePortalPage />} />
        <Route path="/seguimiento/:code" element={<WelcomePortalPage />} />

        {/* Private Protected Modules with MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Permission Protected Modules */}
          <Route element={<PermissionRoute permission="production:read" />}>
            <Route path="/production" element={<ProductionBatchesPage />} />
            <Route path="/production/:id" element={<ProductionDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permission="users:read" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<PermissionRoute permission="roles:read" />}>
            <Route path="/roles" element={<RolesPage />} />
          </Route>
          <Route element={<PermissionRoute permission="machines:read" />}>
            <Route path="/machines" element={<MachinesPage />} />
          </Route>
          <Route element={<PermissionRoute permission="suppliers:read" />}>
            <Route path="/suppliers" element={<SuppliersPage />} />
          </Route>

          <Route path="/modules" element={<DashboardPage />} />
          <Route path="/activity" element={<DashboardPage />} />
          <Route path="/saved" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
