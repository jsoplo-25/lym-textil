import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  LogOut,
  User,
  Home,
  ChevronRight,
  X,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Cog,
  Truck,
  Factory,
  Bell,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { RootState } from '../../app/store';
import { logout } from '../../entities/session/sessionSlice';
import { loginService } from '../../public-modules/login/services/login.service';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { Avatar } from '../../shared/ui/Avatar';
import { Tooltip } from '../../shared/ui/Tooltip';
import { LogoutConfirmModal } from '../../shared/components/session/LogoutConfirmModal';
import { getRoleDisplayName, hasPermission } from '../../shared/lib/roles';
import { productionService } from '../../private-modules/production/services/production.service';
import type { PendingApprovalRoll } from '../../private-modules/production/types/production.types';
import { useToast } from '../../shared/hooks/useToast';
import { Badge } from '../../shared/ui/Badge';

// Rutas que comparten la pantalla de Inicio (usan el saludo completo como hero).
const HOME_PATHS = ['/dashboard', '/modules', '/activity', '/saved'];

interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Resuelve las migajas de pan alineadas exactamente con los títulos de los módulos
const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Manejo de detalle de lote de producción (/production/:id)
  if (pathname.startsWith('/production/') && pathname !== '/production') {
    return [
      { label: 'Gestión de Producción', path: '/production' },
      { label: 'Detalle de Lote' },
    ];
  }

  const baseLabels: Record<string, string> = {
    '/users': 'Gestión de Usuarios',
    '/roles': 'Gestión de Roles',
    '/machines': 'Gestión de Máquinas',
    '/suppliers': 'Gestión de Proveedores',
    '/production': 'Gestión de Producción',
    '/profile': 'Mi Perfil',
  };

  const label = baseLabels[pathname];
  if (label) {
    return [{ label }];
  }

  return [{ label: 'Módulo' }];
};

interface SearchableItem {
  title: string;
  path: string;
  description: string;
  icon: React.ElementType;
  permission?: string;
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
    title: 'Gestión de Producción',
    path: '/production',
    description: 'Control de lotes, pesaje de rollos y órdenes de producción',
    icon: Factory,
    permission: 'production:read',
  },
  {
    title: 'Gestión de Usuarios',
    path: '/users',
    description: 'Administración de personal, operarios y supervisores',
    icon: Users,
    permission: 'users:read',
  },
  {
    title: 'Gestión de Roles',
    path: '/roles',
    description: 'Configuración de perfiles y matriz de permisos RBAC',
    icon: ShieldCheck,
    permission: 'roles:read',
  },
  {
    title: 'Gestión de Máquinas',
    path: '/machines',
    description: 'Inventario de maquinaria, estado operativo y mantenimiento',
    icon: Cog,
    permission: 'machines:read',
  },
  {
    title: 'Gestión de Proveedores',
    path: '/suppliers',
    description: 'Administración de proveedores y clientes de hilado',
    icon: Truck,
    permission: 'suppliers:read',
  },
  {
    title: 'Mi Perfil',
    path: '/profile',
    description: 'Configuración personal de cuenta y credenciales',
    icon: User,
  },
];

const formatBatchDisplay = (raw?: string): string => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'Lote';
  if (/^lote\s+/i.test(trimmed)) {
    return trimmed.replace(/^lote\s+/i, 'Lote ');
  }
  if (/^lote\b/i.test(trimmed)) {
    return trimmed;
  }
  return `Lote ${trimmed}`;
};

export const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.session.user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const toast = useToast();
  const canApprove = hasPermission(user, 'production:approve');

  // Notifications State for Approvers (Administrador / Asistente Administrativo)
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingRolls, setPendingRolls] = useState<PendingApprovalRoll[]>([]);
  const [approvingRollId, setApprovingRollId] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isHome = HOME_PATHS.includes(location.pathname);
  const isAdmin =
    user?.role === 'ADMINISTRADOR' ||
    user?.roleName?.toUpperCase() === 'ADMINISTRADOR DEL SISTEMA';
  const isAssistant =
    user?.role === 'ASISTENTE_ADMINISTRATIVO' ||
    user?.roleName?.toUpperCase() === 'ASISTENTE ADMINISTRATIVO';

  // Cargar notificaciones de rollos pendientes de aprobación
  const knownPendingIdsRef = useRef<Set<string> | null>(null);

  const fetchPendingApprovals = async () => {
    if (!canApprove) return;
    try {
      const data = (await productionService.getPendingApprovals()) || [];
      // Avisar con un toast cuando llega un rollo nuevo por aprobar (no en la primera carga)
      const known = knownPendingIdsRef.current;
      if (known) {
        const fresh = data.filter((r) => !known.has(r.rollId));
        if (fresh.length === 1) {
          toast.info(`Nuevo rollo por aprobar: N° ${fresh[0].rollNumber} (Lote ${fresh[0].batchNumber}).`);
        } else if (fresh.length > 1) {
          toast.info(`Tienes ${fresh.length} rollos nuevos por aprobar.`);
        }
      }
      knownPendingIdsRef.current = new Set(data.map((r) => r.rollId));
      setPendingRolls(data);
    } catch (err) {
      console.error('Error al cargar notificaciones de aprobación:', err);
    }
  };

  useEffect(() => {
    if (!canApprove) return;
    fetchPendingApprovals();

    // Sincronización periódica cada 20 segundos
    const interval = setInterval(fetchPendingApprovals, 20000);

    // Escuchar cambios de rollos en tiempo real mediante evento personalizado
    const handleRollsUpdated = () => {
      fetchPendingApprovals();
    };
    window.addEventListener('production:rolls-updated', handleRollsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('production:rolls-updated', handleRollsUpdated);
    };
  }, [canApprove]);

  // Aprobar un rollo directamente desde la notificación
  const handleApproveFromNotif = async (roll: PendingApprovalRoll) => {
    try {
      setApprovingRollId(roll.rollId);
      const res = await productionService.approveRoll(roll.rollId);
      toast.success(res.message || `Rollo N° ${roll.rollNumber} aprobado y listo para recojo.`);
      setPendingRolls((prev) => prev.filter((r) => r.rollId !== roll.rollId));
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err: unknown) {
      console.error('Error al aprobar rollo desde notificación:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || 'Error al aprobar el rollo.');
    } finally {
      setApprovingRollId(null);
    }
  };

  const handleNavigateToBatch = (batchId: string) => {
    setIsNotifOpen(false);
    navigate(`/production/${batchId}`);
  };

  // Filter searchable items based on user role, permissions and query
  const filteredSearchItems = SEARCHABLE_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.permission && !hasPermission(user, item.permission)) return false;
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
        setIsNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown, notifications, and search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
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

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 md:py-4">
        {/* Left Side: Greeting (Inicio) or lightweight breadcrumb (otros módulos) */}
        <div className="min-w-0">
          {isHome ? (
            <>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                  Textil L&M • Sistema Integral
                </span>
                <Badge
                  variant={
                    isAdmin
                      ? 'emerald'
                      : isAssistant
                      ? 'blue'
                      : 'purple'
                  }
                  size="sm"
                >
                  {getRoleDisplayName(user)}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ¡Hola, {firstName}!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {isAdmin
                  ? 'Panel de control gerencial y estado global de la planta textil.'
                  : isAssistant
                  ? 'Coordinación de despacho, proveedores y mesa de aprobaciones.'
                  : 'Turno de producción textil y control de rollos en máquina.'}
              </p>
            </>
          ) : (
            <nav aria-label="Migaja de pan" className="flex items-center flex-wrap gap-1.5 text-xs font-semibold">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    {crumb.path && !isLast ? (
                      <button
                        onClick={() => navigate(crumb.path!)}
                        className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span aria-current="page" className="text-slate-700 dark:text-slate-200 font-bold">
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Controls & Profile */}
        <div className="fixed top-0 inset-x-0 z-30 h-[72px] pl-20 pr-4 justify-end bg-[#F6F8FB]/85 dark:bg-[#0F1522]/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 md:static md:z-auto md:h-auto md:p-0 md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:border-0 md:self-center flex items-center gap-2.5 sm:gap-3 md:gap-4">
          {/* Light/Dark Mode Switcher Pill */}
          <div className={isSearchOpen ? 'max-sm:hidden' : undefined}>
            <ThemeToggle />
          </div>

          {/* Interactive Expandable Search Bar */}
          <div className={`relative ${isSearchOpen ? 'max-sm:flex-1' : ''}`} ref={searchContainerRef}>
            {isSearchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center animate-fadeIn max-sm:w-full"
              >
                <div className="relative flex items-center max-sm:w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar módulos, usuarios..."
                    className="max-sm:w-full w-72 md:w-80 pl-10 pr-9 py-2 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-primary-500/40 dark:border-primary-500/40 text-slate-900 dark:text-white shadow-lg shadow-primary-500/5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
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
                <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:top-full sm:right-0 mt-2 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn">
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
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-500/10 text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {item.description}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
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
                  className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Notifications Bell for Approvers */}
          {canApprove && (
            <div className={`relative ${isSearchOpen ? 'max-sm:hidden' : ''}`} ref={notifRef}>
              <Tooltip content="Notificaciones de aprobación" position="bottom">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  aria-label="Notificaciones de aprobación"
                  className="relative p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {pendingRolls.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                      {pendingRolls.length > 9 ? '9+' : pendingRolls.length}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 mt-3 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-3 z-50 animate-fadeIn">
                  {/* Header */}
                  <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Notificaciones de Aprobación
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Rollos listos para visto bueno
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">
                        {pendingRolls.length} {pendingRolls.length === 1 ? 'pendiente' : 'pendientes'}
                      </span>
                    </div>
                  </div>

                  {/* Body List */}
                  <div className="max-h-80 overflow-y-auto px-2 py-2 space-y-2">
                    {pendingRolls.length > 0 ? (
                      pendingRolls.map((roll) => (
                        <div
                          key={roll.rollId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-accent-500/40 transition-all space-y-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 p-1 rounded-md bg-accent-500/15 text-accent-600 dark:text-accent-400 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                                El{' '}
                                <strong className="font-mono text-primary-600 dark:text-primary-400">
                                  {formatBatchDisplay(roll.batchNumber)}
                                </strong>{' '}
                                del proveedor <strong>{roll.supplierName}</strong> tiene el Rollo N°{' '}
                                <strong className="font-mono text-slate-900 dark:text-white">
                                  {roll.rollNumber}
                                </strong>{' '}
                                listo para aprobar.
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                                {roll.weight !== null && roll.weight !== undefined && (
                                  <span>Peso: <strong>{roll.weight} Kg</strong></span>
                                )}
                                {roll.machineName && <span>Máq: {roll.machineName}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/40">
                            <button
                              type="button"
                              onClick={() => handleNavigateToBatch(roll.batchId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                            >
                              Ver Lote
                            </button>
                            <button
                              type="button"
                              disabled={approvingRollId === roll.rollId}
                              onClick={() => handleApproveFromNotif(roll)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{approvingRollId === roll.rollId ? 'Aprobando...' : 'Aprobar'}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          No hay rollos pendientes
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                          Todos los rollos registrados cuentan con visto bueno.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Avatar with Dropdown */}
          <div className={`relative ${isSearchOpen ? 'max-sm:hidden' : ''}`} ref={dropdownRef}>
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
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>
            </Tooltip>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : user?.name || ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                  {user?.role && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
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
