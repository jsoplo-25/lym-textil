import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNavigation } from '../../widgets/sidebar/SidebarNavigation';
import { AppHeader } from '../../widgets/header/AppHeader';
import { AppFooter } from '../../widgets/footer/AppFooter';
import { useProductionRealtime } from '../../shared/hooks/useProductionRealtime';
import { SessionTimeoutModal } from '../../shared/components/session/SessionTimeoutModal';

interface MainLayoutProps {
  children?: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true,
}) => {
  useProductionRealtime();

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0F1522] text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      {/* Soft Ambient Glows */}
      <div className="fixed top-1/3 -right-20 w-[550px] h-[550px] bg-primary-500/08 dark:bg-primary-500/05 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-24 left-1/3 w-[450px] h-[450px] bg-blue-500/06 dark:bg-blue-500/04 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -top-24 -left-24 w-[500px] h-[500px] bg-purple-500/06 dark:bg-purple-500/04 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Container Viewport */}
      <div className="md:pl-20 flex flex-col min-h-screen relative z-10 min-w-0">
        <div className="max-w-[1400px] 2xl:max-w-[1600px] w-full mx-auto px-4 pb-4 pt-20 md:p-8 flex-1 flex flex-col space-y-6 min-w-0">
          {showHeader && <AppHeader />}
          <main className="flex-1 flex flex-col min-w-0 animate-fadeIn">
            {children || <Outlet />}
          </main>
          {showFooter && <AppFooter />}
        </div>
      </div>

      {/* 15-Minute Inactivity Warning Modal */}
      <SessionTimeoutModal />
    </div>
  );
};
