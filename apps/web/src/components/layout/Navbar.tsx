import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import i18n from '@/i18n';

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
  };

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-all duration-300',
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent',
      )}
    >
      <div className="page-container">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <Calendar className="w-4.5 h-4.5 text-white" />
            </div>
            <span>
              <span className="text-brand-600">R</span>a
              <span className="text-brand-600">G</span>enda
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/portal"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === '/portal' ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {t('nav.portal')}
                </Link>
                <Link
                  to="/agendar"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === '/agendar' ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {t('nav.book')}
                </Link>
                <button
                  onClick={toggleLang}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Switch language"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-700 font-bold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    {t('nav.logout')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={toggleLang}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-slide-down">
          <div className="page-container py-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/portal" className="text-sm font-medium text-slate-700 py-2" onClick={() => setMenuOpen(false)}>{t('nav.portal')}</Link>
                <Link to="/agendar" className="text-sm font-medium text-slate-700 py-2" onClick={() => setMenuOpen(false)}>{t('nav.book')}</Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">{t('nav.logout')}</Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">{t('nav.login')}</Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">{t('nav.register')}</Button>
                </Link>
              </>
            )}
            <button onClick={toggleLang} className="text-sm text-slate-500 text-left py-1 flex items-center gap-2">
              <Globe className="w-4 h-4" /> {i18n.language.startsWith('es') ? 'Switch to English' : 'Cambiar a Español'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
