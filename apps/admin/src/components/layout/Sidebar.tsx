import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Calendar, CalendarDays, Users,
  Settings, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Panel',          end: true  },
  { to: '/appointments', icon: Calendar,        label: 'Citas',         end: false },
  { to: '/availability', icon: CalendarDays,    label: 'Disponibilidad', end: false },
  { to: '/clients',      icon: Users,           label: 'Clientes',       end: false },
  { to: '/settings',     icon: Settings,        label: 'Configuración',  end: false },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(180deg, #151413 0%, #0d0c0b 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Brand — White Logo */}
        <div
          className="flex flex-col items-center justify-center pt-8 pb-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
            <img
              src="/images/logo-light.png"
              alt="RaGenda Logo"
              style={{ position: 'absolute', left: '-50%', top: '-40%', height: '180%', width: '200%', maxWidth: 'none', objectFit: 'contain' }}
            />
          </div>
          <p
            className="mt-2 text-center"
            style={{
              fontSize: '0.6rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              color: 'rgba(201,177,98,0.4)',
            }}
          >
            Panel Admin
          </p>
        </div>

        {/* Nav section label */}
        <div className="px-5 pt-6 pb-2">
          <p
            style={{
              fontSize: '0.6rem',
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.15em',
              color: '#5e5a55',
            }}
          >
            Navegación
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 group relative',
                isActive
                  ? 'text-brand-400 font-medium'
                  : 'text-surface-500 hover:text-surface-300 font-normal'
              )}
              style={({ isActive }) => ({
                background: isActive ? 'rgba(201,177,98,0.06)' : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: '#c9b162' }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-30 group-hover:translate-x-0" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          className="px-3 py-4"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div className="flex items-center gap-3 px-3 py-3 mb-1 rounded-lg">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium"
              style={{
                background: 'rgba(201,177,98,0.1)',
                color: '#c9b162',
                border: '1px solid rgba(201,177,98,0.15)',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate leading-none" style={{ color: '#dedddb' }}>
                {user?.name}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#5e5a55' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-normal mt-1 transition-colors"
            style={{ color: '#7c7872' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,60,60,0.06)';
              e.currentTarget.style.color = '#e87c7c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#7c7872';
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
