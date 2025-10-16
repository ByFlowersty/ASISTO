import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-gray-800 bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
            {children}
        </main>
    </div>
  );
};

export default Layout;
