import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 mt-12 py-6 px-0 md:px-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 text-xs text-center sm:text-left text-slate-500 dark:text-slate-400">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2">
        <span className="font-bold text-slate-900 dark:text-slate-100">Textil L&M</span>
        <span>© {new Date().getFullYear()} • Sistema Integral de Producción - Área operativa</span>
      </div>
    </footer>
  );
};
