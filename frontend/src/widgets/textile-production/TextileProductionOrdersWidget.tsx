import React, { useState } from 'react';
import { Scissors, CheckCircle2, Clock, AlertTriangle, ChevronRight, Layers } from 'lucide-react';

interface ProductionOrder {
  id: string;
  code: string;
  fabricType: string;
  composition: string;
  targetMeters: number;
  completedMeters: number;
  status: 'en_corte' | 'en_tenido' | 'completado' | 'pendiente';
  operator: string;
}

const mockOrders: ProductionOrder[] = [
  {
    id: '1',
    code: 'ORD-2026-089',
    fabricType: 'Algodón Pima 100%',
    composition: 'Peinado 30/1 - Blanco Nieve',
    targetMeters: 5000,
    completedMeters: 4250,
    status: 'en_corte',
    operator: 'Carlos Mendoza',
  },
  {
    id: '2',
    code: 'ORD-2026-090',
    fabricType: 'Dril Textil Heavy',
    composition: 'Algodón 98% / Spandex 2% - Azul Marino',
    targetMeters: 3500,
    completedMeters: 3500,
    status: 'completado',
    operator: 'Ana Gutiérrez',
  },
  {
    id: '3',
    code: 'ORD-2026-091',
    fabricType: 'Rib Jacquard Texturizado',
    composition: 'Poliéster Premium - Verde Oliva',
    targetMeters: 4000,
    completedMeters: 1800,
    status: 'en_tenido',
    operator: 'Roberto Silva',
  },
  {
    id: '4',
    code: 'ORD-2026-092',
    fabricType: 'Lino Francés Lavado',
    composition: 'Lino 100% - Beige Natural',
    targetMeters: 2500,
    completedMeters: 0,
    status: 'pendiente',
    operator: 'Lucía Torres',
  },
];

export const TextileProductionOrdersWidget: React.FC = () => {
  const [orders] = useState<ProductionOrder[]>(mockOrders);

  const getStatusBadge = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'en_corte':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Scissors className="w-3.5 h-3.5" /> En Corte
          </span>
        );
      case 'en_tenido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" /> En Teñido
          </span>
        );
      case 'completado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-emerald-500" />
              Órdenes de Producción & Corte Textil
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estado de avance de rollos de tela y lotes en taller
            </p>
          </div>
          <button className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Orders List */}
        <div className="mt-4 space-y-3.5">
          {orders.map((order) => {
            const percentage = Math.round((order.completedMeters / order.targetMeters) * 100);
            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      {order.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {order.fabricType}
                    </h4>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {order.composition} • <span className="font-medium text-slate-700 dark:text-slate-300">Op: {order.operator}</span>
                </p>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {order.completedMeters.toLocaleString()} m / {order.targetMeters.toLocaleString()} m
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage === 100
                          ? 'bg-emerald-500'
                          : percentage > 50
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
