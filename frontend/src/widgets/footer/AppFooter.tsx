import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 mt-12 py-6 px-0 md:px-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 text-xs text-center sm:text-left text-slate-500 dark:text-slate-400">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2">
        <span className="font-bold text-slate-900 dark:text-slate-100">Textil L&M</span>
        <span>© {new Date().getFullYear()} • Sistema Integral de Producción & Control</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary-500" />
          <span>FSD Modular Architecture</span>
        </div>
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
          <span>JWT & Supabase Sync</span>
        </div>
      </div>
    </footer>
  );
};
