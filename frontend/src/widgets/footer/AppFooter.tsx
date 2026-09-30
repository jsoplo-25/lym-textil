import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 mt-12 py-6 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900 dark:text-slate-100">Textil L&M</span>
        <span>© {new Date().getFullYear()} • Sistema Integral de Producción & Control</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-emerald-500" />
          <span>FSD Modular Architecture</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>JWT & Supabase Sync</span>
        </div>
      </div>
    </footer>
  );
};
