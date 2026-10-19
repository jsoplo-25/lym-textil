import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  X,
  Home,
  Users,
  ShieldCheck,
  Settings2,
  ChevronDown,
  User,
  LogOut,
  Cog,
  Factory,
  Truck,
} from 'lucide-react';
import { logout } from '../../entities/session/sessionSlice';
import type { RootState } from '../../app/store';
import { LogoutConfirmModal } from '../../shared/components/session/LogoutConfirmModal';
import { getUserInitials } from '../../shared/lib/utils';
import { loginService } from '../../public-modules/login/services/login.service';
import { hasPermission } from '../../shared/lib/roles';
import { Logo } from '../../shared/ui/Logo';

export const SidebarNavigation: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.session.user);
  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Permisos dinámicos
  const canViewProduction = hasPermission(user, 'production:read');
  const canViewUsers = hasPermission(user, 'users:read');
  const canViewRoles = hasPermission(user, 'roles:read');
  const canViewMachines = hasPermission(user, 'machines:read');
  const canViewSuppliers = hasPermission(user, 'suppliers:read');
  const canViewMaintainers = canViewUsers || canViewRoles || canViewMachines || canViewSuppliers;

  const visibleMaintainerItems = [
    ...(canViewUsers ? [{ icon: Users, label: 'Usuarios', path: '/users' }] : []),
    ...(canViewRoles ? [{ icon: ShieldCheck, label: 'Roles', path: '/roles' }] : []),
    ...(canViewMachines ? [{ icon: Cog, label: 'Máquinas', path: '/machines' }] : []),
    ...(canViewSuppliers ? [{ icon: Truck, label: 'Proveedores', path: '/suppliers' }] : []),
  ];

  const isMaintainerActive = visibleMaintainerItems.some((item) => location.pathname.startsWith(item.path));

  // Desktop flyout for "Mantenedores"
  const [isMaintainersOpen, setIsMaintainersOpen] = useState(false);
  const maintainersRef = useRef<HTMLDivElement>(null);

  // Mobile accordion for "Mantenedores"
  const [isMobileMaintainersOpen, setIsMobileMaintainersOpen] = useState(isMaintainerActive);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (maintainersRef.current && !maintainersRef.current.contains(e.target as Node)) {
        setIsMaintainersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenLogoutModal = () => {
    setIsMobileOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await loginService.logout();
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <>
      {/* 1. Desktop Fixed Completely Transparent Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-20 flex-col items-center justify-between py-6 bg-transparent border-none shadow-none transition-all duration-300">
        {/* Top Brand Logo - NO HAMBURGER ICON IN DESKTOP */}
        <div className="flex flex-col items-center">
          <NavLink
            to="/dashboard"
            className="group cursor-pointer focus:outline-none"
            title="Textil L&M • Inicio"
          >
            <Logo size="md" className="group-hover:scale-105 transition-transform" />
          </NavLink>
        </div>

        {/* Navigation Items (Icons with tooltip on hover) */}
        <nav className="flex flex-col items-center gap-4 my-auto">
          {/* Inicio */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${isActive
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 translate-x-1 group-hover:translate-x-0">
              Inicio
            </span>
          </NavLink>

          {/* Producción */}
          {canViewProduction && (
            <NavLink
              to="/production"
              className={({ isActive }) =>
                `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${isActive || location.pathname.startsWith('/production')
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Factory className="w-5 h-5" />
              <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 translate-x-1 group-hover:translate-x-0">
                Producción
              </span>
            </NavLink>
          )}

          {/* Mantenedores (Usuarios / Roles) - Visible según matriz de permisos */}
          {canViewMaintainers && (
            <div className="relative" ref={maintainersRef}>
              <button
                onClick={() => setIsMaintainersOpen((v) => !v)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative cursor-pointer ${isMaintainerActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                aria-label="Mantenedores"
                aria-expanded={isMaintainersOpen}
              >
                <Settings2 className="w-5 h-5" />
                {!isMaintainersOpen && (
                  <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 translate-x-1 group-hover:translate-x-0">
                    Mantenedores
                  </span>
                )}
              </button>

              {/* Flyout Panel */}
              {isMaintainersOpen && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                  <p className="px-4 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mantenedores
                  </p>
                  <div className="px-1 space-y-0.5">
                    {visibleMaintainerItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMaintainersOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mi Perfil */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${isActive
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 translate-x-1 group-hover:translate-x-0">
              Mi Perfil
            </span>
          </NavLink>
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
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <Logo size="sm" showText subtitle="Plataforma de Control" />

                <button
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links with ICON + TEXT */}
              <nav className="mt-6 space-y-2">
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Home className="w-5 h-5" />
                  <span>Inicio</span>
                </NavLink>

                {/* Producción */}
                {canViewProduction && (
                  <NavLink
                    to="/production"
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${isActive || location.pathname.startsWith('/production')
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Factory className="w-5 h-5" />
                    <span>Producción</span>
                  </NavLink>
                )}

                {/* Mantenedores accordion - Visible según matriz de permisos */}
                {canViewMaintainers && (
                  <div>
                    <button
                      onClick={() => setIsMobileMaintainersOpen((v) => !v)}
                      className={`w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${isMaintainerActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      aria-expanded={isMobileMaintainersOpen}
                    >
                      <span className="flex items-center gap-3.5">
                        <Settings2 className="w-5 h-5" />
                        <span>Mantenedores</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isMobileMaintainersOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isMobileMaintainersOpen && (
                      <div className="mt-1 ml-5 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-1 animate-fadeIn">
                        {visibleMaintainerItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsMobileOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${isActive
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                              }
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <NavLink
                  to="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <User className="w-5 h-5" />
                  <span>Mi Perfil</span>
                </NavLink>
              </nav>
            </div>

            {/* Footer User Profile & Logout */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
                  {getUserInitials(displayName) || <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {displayName || 'Usuario'}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {user?.email || ''}
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
