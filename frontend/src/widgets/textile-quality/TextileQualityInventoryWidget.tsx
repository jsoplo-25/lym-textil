import React from 'react';
import { ShieldCheck, Package, Droplet, Sparkles, TrendingUp, Check } from 'lucide-react';

export const TextileQualityInventoryWidget: React.FC = () => {
  const qualityChecks = [
    { title: 'Prueba de Solidez al Lavado (Tinte)', status: 'Aprobado', score: '99.4%', type: 'Laboratorio L&M' },
    { title: 'Control de Tensión y Encogimiento', status: 'Aprobado', score: '0.8%', type: 'Inspección Tejido' },
    { title: 'Resistencia a la Tracción Hilos', status: 'Aprobado', score: '48 N', type: 'Prueba Mecánica' },
    { title: 'Gramaje y Densidad (g/m²)', status: 'En Proceso', score: '220 g/m²', type: 'Muestreo Lote 14' },
  ];

  const fabricStock = [
    { name: 'Algodón Pima Jersey 24/1', stock: '8,400 m', rolls: '42 Rollos', status: 'Disponible' },
    { name: 'French Terry Perchado', stock: '5,200 m', rolls: '26 Rollos', status: 'Disponible' },
    { name: 'Rib 2x1 Spandex', stock: '3,100 m', rolls: '15 Rollos', status: 'Bajo Stock' },
    { name: 'Popelina 100% Algodón', stock: '12,600 m', rolls: '63 Rollos', status: 'Disponible' },
  ];

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
      {/* Control de Calidad L&M */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            Control de Calidad & Laboratorio L&M
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            99.2% Calidad Total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {qualityChecks.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {item.type}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </h4>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {item.score}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock e Inventario de Telas */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Inventario de Rollos de Tela L&M
          </h4>
          <span className="text-xs text-slate-400 font-medium">Actualizado hace 5m</span>
        </div>

        <div className="space-y-2.5">
          {fabricStock.map((stock, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{stock.name}</p>
                <p className="text-slate-400 text-[11px]">{stock.rolls}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{stock.stock}</p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    stock.status === 'Disponible'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {stock.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
