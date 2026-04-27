import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 w-full lg:ml-64 min-h-screen overflow-x-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="font-extrabold text-slate-900 text-lg leading-none">
            <span className="text-brand-600">R</span>a<span className="text-brand-600">G</span>enda
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 lg:p-8 animate-fade-in flex-1 overflow-x-auto w-full max-w-[100vw]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
