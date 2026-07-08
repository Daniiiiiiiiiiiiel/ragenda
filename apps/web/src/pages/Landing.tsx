import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle, Calendar, Clock, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Service {
  id: string;
  name: string;
  duration: number;
  description?: string;
  price?: number;
  color: string;
}

export default function Landing() {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get<Service[]>('/services').then(setServices).catch(() => {});
  }, []);

  const steps = [
    { icon: <Sparkles className="w-6 h-6" />, ...t('howItWorks.step1', { returnObjects: true }) as { title: string; desc: string } },
    { icon: <Calendar className="w-6 h-6" />, ...t('howItWorks.step2', { returnObjects: true }) as { title: string; desc: string } },
    { icon: <CheckCircle className="w-6 h-6" />, ...t('howItWorks.step3', { returnObjects: true }) as { title: string; desc: string } },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-violet-50 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="page-container relative">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              {t('hero.badge')}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
              {t('hero.title')}{' '}
              <span className="gradient-text">{t('hero.titleAccent')}</span>
            </h1>

            <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" icon={<Calendar className="w-5 h-5" />}>
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link to="#services">
                <Button variant="secondary" size="lg">
                  {t('hero.ctaSecondary')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Happy clients' },
              { value: '24/7', label: 'Online booking' },
              { value: '< 1 min', label: 'To schedule' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-brand-600">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      <section id="services" className="py-24 bg-white">
        <div className="page-container">
          <div className="text-center mb-14 animate-fade-in">
            <h2 className="section-title">{t('services.title')}</h2>
            <p className="text-slate-500 mt-3">{t('services.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => (
              <div
                key={svc.id}
                className="card group hover:shadow-md hover:-translate-y-1 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white text-lg font-bold"
                  style={{ backgroundColor: svc.color }}
                >
                  {svc.name.charAt(0)}
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{svc.name}</h3>
                {svc.description && <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {t('services.duration', { min: svc.duration })}
                  </div>
                  {svc.price && (
                    <span className="text-xs font-semibold text-brand-600">
                      {t('services.from', { price: svc.price })}
                    </span>
                  )}
                </div>
                <Link to="/agendar" className="mt-4 block">
                  <Button className="w-full" size="sm">{t('services.book')}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-brand-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">{t('howItWorks.title')}</h2>
            <p className="text-slate-500 mt-3">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="text-center animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-brand-500 mb-2">STEP {i + 1}</div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to="/register">
              <Button size="lg">
                {t('hero.cta')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
