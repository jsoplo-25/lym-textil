import React, { useState } from 'react';
import { Sparkles, Scissors, Layers, CheckCircle2, TrendingUp, Plus, PackageCheck } from 'lucide-react';


export const TextileHeroBanner: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-800">
        {/* Decorative Background Elements */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-72 h-72 rounded-full bg-brand-lime/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Subtle Textile Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Main Info & Title */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-xs font-semibold text-emerald-400 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>TEXTIL L&M — Sistema de Gestión y Control de Producción</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">Textil L&M</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Control integral en tiempo real de hilandería, telado, corte automatizado, tintorería, control de calidad y despachos.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nueva Orden de Producción</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span>Lotes de Corte</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm">
                <Layers className="w-4 h-4 text-teal-300" />
                <span>Inventario de Telas</span>
              </button>
            </div>
          </div>

          {/* Metric Badges Grid (Textile KPIs) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-80">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Metros Producidos</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-white">18,450 m</p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">+14.2% hoy</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Lotes en Teñido</span>
                <Layers className="w-4 h-4 text-teal-300" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-white">12 Lotes</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">En proceso</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Eficiencia Telares</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-white">99.1%</p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Estado Óptimo</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Despachos Hoy</span>
                <PackageCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-extrabold text-white">48 Envíos</p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Programados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
