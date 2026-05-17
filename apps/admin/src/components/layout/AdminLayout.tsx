import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Bell, Search } from 'lucide-react';

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Panel',           subtitle: 'Resumen de tu sistema de agendamiento' },
  '/appointments': { title: 'Citas',           subtitle: 'Administra y revisa las reservas de clientes' },
  '/availability': { title: 'Disponibilidad',  subtitle: 'Controla tu horario y capacidad' },
  '/clients':      { title: 'Clientes',         subtitle: 'Visualiza y administra clientes registrados' },
  '/settings':     { title: 'Configuración',   subtitle: 'Configura servicios y preferencias' },
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = pageLabels[pathname] ?? { title: 'Admin', subtitle: '' };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#121110' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <main className="flex-1 w-full lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">

        {/* Top Header */}
        <header
          className="sticky top-0 z-20"
          style={{
            background: 'rgba(18,17,16,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-4 px-4 lg:px-8 h-16">

            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg transition-colors"
              style={{ color: '#7c7872' }}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title (desktop) */}
            <div className="hidden lg:block">
              <h1
                className="leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: '#f7f7f6',
                }}
              >
                {meta.title}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>
                {meta.subtitle}
              </p>
            </div>

            {/* Mobile brand */}
            <div className="lg:hidden">
              <img
                src="/images/logo-light.png"
                alt="RaGenda Logo"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="flex-1" />

            {/* Search pill (desktop) */}
            <div
              className="hidden md:flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm w-48 cursor-pointer transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#5e5a55',
              }}
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">Buscar…</span>
              <kbd
                className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#5e5a55',
                  fontSize: '0.6rem',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Bell */}
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: '#5e5a55' }}
            >
              <Bell className="w-4.5 h-4.5" />
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#c9b162',
                  boxShadow: '0 0 0 2px #121110',
                }}
              />
            </button>

          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
