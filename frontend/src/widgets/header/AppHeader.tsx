import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, User, Home, ChevronRight, X, Users, ShieldCheck, LayoutDashboard } from 'lucide-react';
import type { RootState } from '../../app/store';
import { logout } from '../../entities/session/sessionSlice';
import { loginService } from '../../public-modules/login/services/login.service';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { Avatar } from '../../shared/ui/Avatar';
import { Tooltip } from '../../shared/ui/Tooltip';
import { LogoutConfirmModal } from '../../shared/components/session/LogoutConfirmModal';
import { getRoleDisplayName } from '../../shared/lib/roles';

// Rutas que comparten la pantalla de Inicio (usan el saludo completo como hero).
const HOME_PATHS = ['/dashboard', '/modules', '/activity', '/saved'];

// Rótulo breve para la migaja de pan en el resto de módulos, que ya traen su propio
// título de página — evita repetir el mismo bloque "hero" dos veces en la pantalla.
const PAGE_LABELS: Record<string, string> = {
  '/users': 'Gestión de Usuarios',
  '/roles': 'Roles y Permisos',
  '/profile': 'Mi Perfil',
};

interface SearchableItem {
  title: string;
  path: string;
  description: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const SEARCHABLE_ITEMS: SearchableItem[] = [
  {
    title: 'Dashboard / Inicio',
    path: '/dashboard',
    description: 'Resumen de métricas de producción y órdenes activas',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestión de Usuarios',
    path: '/users',
    description: 'Administración de personal, operarios y supervisores',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Roles y Permisos',
    path: '/roles',
    description: 'Configuración de roles y niveles de acceso RBAC',
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    title: 'Mi Perfil',
    path: '/profile',
    description: 'Configuración personal de cuenta y cambio de contraseña',
    icon: User,
  },
];

export const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.session.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isHome = HOME_PATHS.includes(location.pathname);
  const isAdmin = user?.role === 'ADMINISTRADOR';

  // Filter searchable items based on user role and query
  const filteredSearchItems = SEARCHABLE_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard shortcut: Cmd+K / Ctrl+K to toggle search, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown and search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSearchItems.length > 0) {
      handleSelectSearchResult(filteredSearchItems[0].path);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await loginService.logout();
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
        {/* Left Side: Greeting (Inicio) or lightweight breadcrumb (otros módulos) */}
        <div>
          {isHome ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Textil L&M • Sistema Integral
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ¡Hola, {firstName}!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Control de producción, hilos, corte y confección en tiempo real.
              </p>
            </>
          ) : (
            <nav aria-label="Migaja de pan" className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span aria-current="page" className="text-slate-600 dark:text-slate-300">
                {PAGE_LABELS[location.pathname] ?? 'Módulo'}
              </span>
            </nav>
          )}
        </div>

        {/* Right Side: Controls & Profile */}
        <div className="flex items-center gap-3 md:gap-4 self-end md:self-center">
          {/* Light/Dark Mode Switcher Pill */}
          <ThemeToggle />

          {/* Interactive Expandable Search Bar */}
          <div className="relative" ref={searchContainerRef}>
            {isSearchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center animate-fadeIn"
              >
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar módulos, usuarios..."
                    className="w-56 sm:w-72 md:w-80 pl-10 pr-9 py-2 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-emerald-500/40 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Live Suggestions Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span>Navegación Rápida</span>
                    <span className="text-[9px] font-normal lowercase">Esc para cerrar</span>
                  </div>

                  {filteredSearchItems.length > 0 ? (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredSearchItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => handleSelectSearchResult(item.path)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {item.description}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No se encontraron resultados para "{searchQuery}"
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <Tooltip content="Buscar (Ctrl+K)" position="bottom">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Buscar"
                  className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Tooltip content="Menú de usuario" position="bottom">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative cursor-pointer focus:outline-none flex items-center"
                aria-label="Abrir menú de usuario"
              >
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  name={user?.name}
                  size="md"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>
            </Tooltip>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : user?.name || ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                  {user?.role && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {getRoleDisplayName(user)}
                    </div>
                  )}
                </div>

                <div className="p-1 space-y-0.5">
                  {/* Mi Perfil */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </button>

                  {/* Los mantenedores de Usuarios y Roles viven en el sidebar (menú "Mantenedores")
                      para no duplicar el mismo acceso en dos lugares distintos. */}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Cerrar Sesión */}
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
