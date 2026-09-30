import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  X,
  Home,
  LayoutGrid,
  Zap,
  Bookmark,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react';
import { logout } from '../../entities/session/sessionSlice';
import type { RootState } from '../../app/store';
import { LogoutConfirmModal } from '../../shared/components/session/LogoutConfirmModal';

export const SidebarNavigation: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.session.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleOpenLogoutModal = () => {
    setIsMobileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    dispatch(logout());
    window.location.href = '/login';
  };

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: LayoutGrid, label: 'Módulos', path: '/modules' },
    { icon: Zap, label: 'Actividad', path: '/activity' },
    { icon: Bookmark, label: 'Guardados', path: '/saved' },
  ];

  return (
    <>
      {/* 1. Desktop Fixed Completely Transparent Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-20 flex-col items-center justify-between py-6 bg-transparent border-none shadow-none transition-all duration-300">
        {/* Top Brand Logo - NO HAMBURGER ICON IN DESKTOP */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform cursor-pointer">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Navigation Items (Icons with tooltip on hover) */}
        <nav className="flex flex-col items-center gap-4 my-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {/* Floating Tooltip */}
                <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 translate-x-1 group-hover:translate-x-0">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Exit Button */}
        <button
          onClick={handleOpenLogoutModal}
          className="w-11 h-11 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 shadow-xs group relative cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-16 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
            Cerrar Sesión
          </span>
        </button>
      </aside>

      {/* 2. Mobile Floating Hamburger Button (ONLY visible on mobile screen) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white active:scale-95 transition-transform"
        aria-label="Abrir Menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 3. Mobile Slide-Over Drawer (Icon + Text Label style) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Drawer Container */}
          <div className="relative z-50 w-72 max-w-[80vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header: Logo & Close Button */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                      Textil L&M
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Plataforma de Control</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links with ICON + TEXT */}
              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Footer User Profile & Logout */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
                  {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Usuario'}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {user?.email || 'mike@intellecta.io'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleOpenLogoutModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};
