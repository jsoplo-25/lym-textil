import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, LogOut } from 'lucide-react';
import type { RootState } from '../../app/store';
import { logout } from '../../entities/session/sessionSlice';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { Avatar } from '../../shared/ui/Avatar';
import { LogoutConfirmModal } from '../../shared/components/session/LogoutConfirmModal';

export const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.session.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    dispatch(logout());
    window.location.href = '/login';
  };

  const firstName = user?.firstName
    ? user.firstName.trim().split(' ')[0]
    : user?.name
      ? user.name.trim().split(' ')[0]
      : 'Administrador';

  return (
    <>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        {/* Left Side: Greeting & Textil L&M Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Textil L&M • Sistema Integral
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ¡Hola, {firstName}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Control de producción, hilos, corte y confección en tiempo real.
          </p>
        </div>

        {/* Right Side: Controls & Profile */}
        <div className="flex items-center gap-3 md:gap-4 self-end md:self-center">
          {/* Light/Dark Mode Switcher Pill */}
          <ThemeToggle />

          {/* Search Icon Button */}
          <button
            aria-label="Buscar"
            className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative cursor-pointer focus:outline-none flex items-center"
              aria-label="Abrir menú de usuario"
            >
              <Avatar
                src={user?.avatarUrl}
                fallback={firstName.charAt(0)}
                size="md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || 'admin@textil-lym.com'}
                  </p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {user?.role || 'ADMIN'}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nueva Orden Button */}
          <button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Orden</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};
