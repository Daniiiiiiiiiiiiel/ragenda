import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AuthContext';
import {
  Calendar, LayoutDashboard, Users, Settings,
  CalendarDays, LogOut, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/',               icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/appointments',   icon: <Calendar className="w-5 h-5" />,        label: 'Appointments' },
  { to: '/availability',   icon: <CalendarDays className="w-5 h-5" />,    label: 'Availability' },
  { to: '/clients',        icon: <Users className="w-5 h-5" />,           label: 'Clients' },
  { to: '/settings',       icon: <Settings className="w-5 h-5" />,        label: 'Settings' },
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-extrabold text-white text-lg leading-none">
            <span className="text-brand-400">R</span>a<span className="text-brand-400">G</span>enda
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-300 font-bold text-sm">{user?.name.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
