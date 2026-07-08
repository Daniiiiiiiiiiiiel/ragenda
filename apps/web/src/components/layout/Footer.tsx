import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-extrabold text-xl text-white">
                <span className="text-brand-400">R</span>om<span className="text-brand-400">.</span>Code
              </span>
            </div>
            <p className="text-sm leading-relaxed">{t('footer.tagline')}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Quick links</h3>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/login', label: t('nav.login') },
                { to: '/register', label: t('nav.register') },
                { to: '/agendar', label: t('nav.book') },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-sm hover:text-brand-400 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Contact</h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:hello@romcode.com" className="flex items-center gap-2.5 text-sm hover:text-brand-400 transition-colors">
                <Mail className="w-4 h-4" /> hello@romcode.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-2.5 text-sm hover:text-brand-400 transition-colors">
                <Phone className="w-4 h-4" /> +1 (234) 567-890
              </a>
              <span className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4" /> Available online worldwide
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs">© {year} Rom.Code. {t('footer.rights')}</p>
          <p className="text-xs">Built with ❤️ and TypeScript</p>
        </div>
      </div>
    </footer>
  );
}
