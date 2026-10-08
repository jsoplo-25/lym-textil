import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { productionService } from '../../../private-modules/production/services/production.service';
import type { BatchTrackingData, RollStatus } from '../../../private-modules/production/types/production.types';

export const PublicTrackingPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(urlCode || '');
  const [trackingData, setTrackingData] = useState<BatchTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (status: RollStatus) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs animate-pulse">
            <Bell className="w-3.5 h-3.5" />
            Listo para recojo
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregado
          </span>
        );
      case 'IN_PREPARATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      {/* 1. Header Público */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
              L&M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base sm:text-lg text-slate-900 dark:text-white">
                  TEXTIL L&M
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  Tracking
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Portal de Seguimiento de Producción en Planta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Acceso Interno</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero & Buscador */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Banner de búsqueda */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Consulta en vivo el avance de tus rollos</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Seguimiento de Producción
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ingresa tu <strong>Código de Seguimiento</strong> (ej. <code className="font-mono text-emerald-600 dark:text-emerald-400">TRK-8F3A2B</code>) o tu <strong>Número de Lote</strong> asignado por Textil L&M.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-2">
            <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
              <div className="pl-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ingresa código (ej. TRK-XXXXXX o LOTE-001)"
                className="w-full px-3.5 py-3.5 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="mr-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span>Consultando...</span>
                ) : (
                  <>
                    <span>Rastrear</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* 3. Mensaje de Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-semibold max-w-xl mx-auto text-center shadow-xs">
            {error}
          </div>
        )}

        {/* 4. Resultado del Seguimiento */}
        {trackingData && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4.1 Card Principal de Identificación del Lote */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      CÓDIGO: {trackingData.trackingCode}
                    </span>
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                      LOTE: {trackingData.batchNumber}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-slate-400" />
                    <span>{trackingData.supplierName}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                    title="Copiar enlace para compartir"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* Banner Destacado de Recojo */}
              {trackingData.hasRollsReadyForPickup && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                      <Bell className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-base font-black">
                        ¡Tienes {trackingData.counts.readyForPickup} {trackingData.counts.readyForPickup === 1 ? 'rollo listo' : 'rollos listos'} para recoger!
                      </h4>
                      <p className="text-xs text-emerald-100">
                        Los rollos ya se encuentran preparados en nuestra planta textil. Puedes enviar a tu chofer o coordinar el despacho.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-black shadow-sm self-start sm:self-auto shrink-0">
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
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                    {trackingData.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${Math.max(5, Math.min(100, trackingData.progressPercent))}%` }}
                  />
                </div>
              </div>

              {/* 4.2 Métricas de Estado de Rollos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    1. Registrados
                  </span>
                  <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                    {trackingData.counts.registered}
                  </p>
                  <p className="text-[10px] text-slate-400">Ingresados en sistema</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    2. En Preparación
                  </span>
                  <p className="text-2xl font-black font-mono text-amber-800 dark:text-amber-200">
                    {trackingData.counts.inPreparation}
                  </p>
                  <p className="text-[10px] text-amber-600/80">En proceso de tejido</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    3. Listos para Recojo
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {trackingData.counts.readyForPickup}
                  </p>
                  <p className="text-[10px] text-emerald-600/80">Disponibles en planta</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    4. Entregados
                  </span>
                  <p className="text-2xl font-black font-mono text-purple-800 dark:text-purple-200">
                    {trackingData.counts.delivered}
                  </p>
                  <p className="text-[10px] text-purple-600/80">Retirados por proveedor</p>
                </div>
              </div>

              {/* Datos de Peso y Lote */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Total Rollos: <strong className="text-slate-900 dark:text-white font-mono">{trackingData.totalRolls}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span>Total Kilos: <strong className="text-slate-900 dark:text-white font-mono">{trackingData.totalWeight.toFixed(2)} Kg</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Estado Lote: <strong className="text-slate-900 dark:text-white">{trackingData.status === 'COMPLETED' ? 'Terminado' : 'Solicitud registrada'}</strong></span>
                </div>
              </div>
            </div>

            {/* 4.3 Tabla de Detalle por Rollo */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Detalle de Rollos del Pedido
                  </h3>
                  <p className="text-xs text-slate-400">
                    Listado oficial de rollos con su peso y estado en tiempo real
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
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
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                        <th className="py-3 px-4">Rollo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Peso (Kg)</th>
                        <th className="py-3 px-4">Fecha Inicio</th>
                        <th className="py-3 px-4">Fecha Término</th>
                        <th className="py-3 px-4">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {trackingData.rolls.map((roll) => (
                        <tr
                          key={roll.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            roll.status === 'READY_FOR_PICKUP' ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
                              {roll.rollNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(roll.status)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {roll.weight !== null && roll.weight !== undefined ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                                {roll.weight.toFixed(2)} Kg
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
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

      {/* 5. Footer Público */}
      <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800 py-8 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-400">
          TEXTIL L&M • Sistema de Gestión y Control de Producción Textil
        </p>
        <p className="mt-1 text-[11px]">
          Para consultas sobre despachos y recogidas, comuníquese con el área de operaciones de la planta.
        </p>
      </footer>
    </div>
  );
};
