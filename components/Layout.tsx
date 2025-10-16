import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-gray-800 p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto flex rounded-3xl shadow-2xl overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
  );
};

export default Layout;
