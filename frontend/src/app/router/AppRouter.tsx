import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
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
