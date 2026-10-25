import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import {
  Search,
  Layers,
  Clock,
  CheckCircle2,
  Bell,
  Scale,
  Share2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { productionService } from '../../../private-modules/production/services/production.service';
import type { BatchTrackingData, RollStatus } from '../../../private-modules/production/types/production.types';
import { Logo } from '../../../shared/ui/Logo';

export const WelcomePortalPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);
  const sessionUser = useSelector((state: RootState) => state.session.user);

  // Modo claro / oscuro propio e independiente del portal público
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('portal_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [searchInput, setSearchInput] = useState(urlCode || '');
  const [trackingData, setTrackingData] = useState<BatchTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sincronizar tema del portal sin afectar la configuración interna de la plataforma
  useEffect(() => {
    const root = document.documentElement;
    const previousPlatformTheme = localStorage.getItem('theme');

    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('portal_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('portal_theme', 'light');
    }

    return () => {
      // Restaurar el tema interno de la plataforma cuando el usuario navegue hacia módulos privados
      if (previousPlatformTheme === 'dark') {
        root.classList.add('dark');
      } else if (previousPlatformTheme === 'light') {
        root.classList.remove('dark');
      }
    };
  }, [isDark]);

  const togglePortalTheme = () => {
    setIsDark((prev) => !prev);
  };

  const fetchTracking = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await productionService.trackBatch(codeToSearch.trim());
      setTrackingData(data);
    } catch (err: unknown) {
      console.error('Error al rastrear lote:', err);
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `No encontramos información para el código "${codeToSearch}". Verifica los caracteres e intenta nuevamente.`;
      setError(msg);
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (urlCode) {
      setSearchInput(urlCode);
      fetchTracking(urlCode);
    }
  }, [urlCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/tracking/${encodeURIComponent(searchInput.trim())}`);
    fetchTracking(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setTrackingData(null);
    setError(null);
    navigate('/');
  };

  const handleCopyLink = () => {
    const code = trackingData?.trackingCode || searchInput;
    const url = `${window.location.origin}/tracking/${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (status: RollStatus) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary-500 text-white shadow-xs animate-pulse">
            <Bell className="w-3.5 h-3.5" />
            Listo para recojo
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregado
          </span>
        );
      case 'READY_FOR_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-100 dark:bg-accent-500/20 text-accent-800 dark:text-accent-300 border border-accent-300 dark:border-accent-500/40">
            <Clock className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
            En control de calidad
          </span>
        );
      case 'IN_PREPARATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            En preparación
          </span>
        );
      case 'REGISTERED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5" />
            Registrado
          </span>
        );
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? 'dark bg-slate-950 text-white'
          : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900'
      } flex flex-col justify-between selection:bg-primary-500 selection:text-white relative overflow-hidden transition-colors duration-300`}
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-primary-500/5 pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Header Superior con Selector de Tema y Acceso Interno */}
      <header className="border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/" onClick={handleClearSearch} className="flex items-center gap-3.5 group cursor-pointer">
            <Logo size="md" className="group-hover:scale-105 transition-transform shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-lg text-slate-900 dark:text-white">
                  TEXTIL L&amp;M
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 text-[10px] font-extrabold uppercase tracking-wider border border-primary-500/20 dark:border-primary-500/30">
                  Planta Textil
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Control de Producción y Tejeduría Circular
              </p>
            </div>
          </Link>

          {/* Acciones de la Cabecera: Toggle de Tema + Acceso Interno */}
          <div className="flex items-center gap-2.5">
            {/* Botón de Modo Claro / Oscuro para el portal */}
            <button
              type="button"
              onClick={togglePortalTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Cambiar tema de color"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-accent-400 animate-spin-once" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Botón Acceso Interno */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-md shadow-primary-600/20"
              >
                <span>Ir al Panel ({sessionUser?.name?.split(' ')[0] || 'Usuario'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all border border-slate-200 dark:border-white/15 flex items-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Acceso Interno</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 flex-1">
        {/* 2.1 Hero y Buscador Directo para Proveedores */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-bold backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>Portal de Seguimiento de Producción para Proveedores</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Bienvenido a <span className="text-primary-600 dark:text-primary-400">Textil L&amp;M</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Rastrea en vivo el avance de tus rollos, pesaje y confirma cuándo están listos para recojo en nuestra planta.
          </p>

          {/* Buscador Central Directo */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-3">
            <div className="relative flex items-center shadow-xl dark:shadow-2xl rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 backdrop-blur-md focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 transition-all">
              <div className="pl-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ingresa Código (ej. TRK-8F3A2B) o N° de Lote"
                className="w-full px-3.5 py-4 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none uppercase font-mono tracking-wider"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer mr-1"
                  title="Limpiar búsqueda"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="mr-1.5 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 active:scale-95 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-600/25 shrink-0"
              >
                {isLoading ? (
                  <span>Consultando...</span>
                ) : (
                  <>
                    <span>Rastrear Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* 2.2 Mensaje de Error si no se encuentra */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm font-semibold max-w-xl mx-auto text-center shadow-md animate-fadeIn">
            {error}
          </div>
        )}

        {/* 2.3 Si no ha buscado aún: 3 Tarjetas de Beneficios */}
        {!trackingData && !isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-none space-y-2.5 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Búsqueda Directa</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ingresa con tu código único o número de lote sin necesidad de crear cuenta ni clave.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-none space-y-2.5 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Avisos de Recojo</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Te notificamos en pantalla en cuanto tus rollos de tela estén listos para retirar de planta.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-none space-y-2.5 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pesaje Oficial</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Accede a la sábana oficial con los kilos exactos de cada rollo producido en planta textil.
              </p>
            </div>
          </div>
        )}

        {/* 2.4 Si hay datos de rastreo: Visualización Completa */}
        {trackingData && (
          <div className="space-y-6 animate-fadeIn">
            {/* Tarjeta Principal de Identificación */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-500/30">
                      CÓDIGO: {trackingData.trackingCode}
                    </span>
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                      LOTE: {trackingData.batchNumber}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
                    <Building2 className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    <span>{trackingData.supplierName}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                    title="Copiar enlace directo"
                  >
                    <Share2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* Banner Destacado de Recojo */}
              {trackingData.hasRollsReadyForPickup && (
                <div className="p-4 sm:p-5 rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                      <Bell className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-base font-black">
                        ¡Tienes {trackingData.counts.readyForPickup} {trackingData.counts.readyForPickup === 1 ? 'rollo listo' : 'rollos listos'} para recoger!
                      </h4>
                      <p className="text-xs text-primary-100">
                        Los rollos ya se encuentran preparados en nuestra planta textil. Puedes enviar a tu transporte o coordinar el despacho.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white text-primary-800 text-xs font-black shadow-sm self-start sm:self-auto shrink-0">
                    Listo en Planta
                  </span>
                </div>
              )}

              {/* Barra de Progreso General */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Avance de Preparación / Entrega
                  </span>
                  <span className="text-primary-600 dark:text-primary-400 font-mono font-black text-sm">
                    {trackingData.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-700"
                    style={{ width: `${Math.max(5, Math.min(100, trackingData.progressPercent))}%` }}
                  />
                </div>
              </div>

              {/* 4 Métricas de Estado de Rollos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    1. Registrados
                  </span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {trackingData.counts.registered}
                  </p>
                  <p className="text-[10px] text-slate-400">Ingresados en sistema</p>
                </div>

                <div className="p-4 rounded-2xl bg-accent-500/10 border border-accent-500/20 dark:border-accent-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-700 dark:text-accent-300">
                    2. En Preparación
                  </span>
                  <p className="text-2xl font-black font-mono text-accent-800 dark:text-accent-200">
                    {trackingData.counts.inPreparation}
                  </p>
                  <p className="text-[10px] text-accent-600 dark:text-accent-400/80">En proceso de tejido</p>
                </div>

                <div className="p-4 rounded-2xl bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/25 dark:border-primary-500/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    3. Listos para Recojo
                  </span>
                  <p className="text-2xl font-black font-mono text-primary-700 dark:text-primary-300">
                    {trackingData.counts.readyForPickup}
                  </p>
                  <p className="text-[10px] text-primary-600 dark:text-primary-400/80">Disponibles en planta</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    4. Entregados
                  </span>
                  <p className="text-2xl font-black font-mono text-purple-800 dark:text-purple-200">
                    {trackingData.counts.delivered}
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400/80">Retirados por proveedor</p>
                </div>
              </div>

              {/* Datos de Peso y Lote */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Total Rollos: <strong className="text-slate-900 dark:text-white font-mono">{trackingData.totalRolls}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Total Kilos: <strong className="text-slate-900 dark:text-white font-mono">{trackingData.totalWeight.toFixed(2)} Kg</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>Estado Lote: <strong className="text-slate-900 dark:text-white">{trackingData.status === 'COMPLETED' ? 'Terminado' : 'Solicitud registrada'}</strong></span>
                </div>
              </div>
            </div>

            {/* Tabla Oficial de Detalle de Rollos */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Detalle de Rollos del Pedido
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sábana de producción con pesaje oficial y avance semanal
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {trackingData.rolls.length} rollos
                </span>
              </div>

              {trackingData.rolls.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no se han registrado rollos en este lote.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                        <th className="py-3 px-4">Rollo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Peso (Kg)</th>
                        <th className="py-3 px-4">Fecha Inicio</th>
                        <th className="py-3 px-4">Fecha Término</th>
                        <th className="py-3 px-4">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                      {trackingData.rolls.map((roll) => (
                        <tr
                          key={roll.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            roll.status === 'READY_FOR_PICKUP' ? 'bg-primary-50/50 dark:bg-primary-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs">
                              {roll.rollNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(roll.status)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {roll.weight !== null && roll.weight !== undefined ? (
                              <span className="text-primary-600 dark:text-primary-400 font-extrabold">
                                {roll.weight.toFixed(2)} Kg
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {roll.startDate ? `${roll.startDate} ${roll.startTime || ''}`.trim() : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                            {roll.endDate ? `${roll.endDate} ${roll.endTime || ''}`.trim() : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {roll.observations || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/10 py-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">TEXTIL L&amp;M</span>
            <span>•</span>
            <span>Rastreo y Control de Planta</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Textil L&amp;M. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
