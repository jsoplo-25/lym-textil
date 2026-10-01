import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sparkles } from 'lucide-react';
import type { RootState } from '../store';
import { useInitSession } from '../../entities/session/useInitSession';
import { LoginPage } from '../../public-modules/login';
import { MainLayout } from '../../private-modules/layout/MainLayout';
import { DashboardPage } from '../../private-modules/dashboard';
import { ProfilePage } from '../../private-modules/profile';
import { UsersPage } from '../../private-modules/users';
import { RolesPage } from '../../private-modules/roles';

const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.session.user);

  if (user?.role !== 'ADMINISTRADOR') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const AppRouter: React.FC = () => {
  const { isInitialized } = useInitSession();

  // Loading Screen while verifying session via httpOnly cookie on initial load/F5
  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F3F4F8] dark:bg-[#0B0F17] transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl shadow-emerald-500/10 animate-pulse">
            <Sparkles className="w-7 h-7 text-emerald-400 dark:text-emerald-500" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Textil L&amp;M</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verificando sesión segura...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Modules */}
        <Route path="/login" element={<LoginPage />} />

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

          {/* Admin Only Modules */}
          <Route element={<AdminRoute />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
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
