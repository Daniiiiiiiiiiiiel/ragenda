import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/portal';

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) { navigate(from, { replace: true }); return null; }

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (e: unknown) {
      setError('root', { message: (e as Error).message ?? t('errors.generic') });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-brand-50 to-white">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 font-extrabold text-2xl text-slate-900 mb-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span><span className="text-brand-600">R</span>a<span className="text-brand-600">G</span>enda</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">{t('auth.login')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">{t('nav.register')}</Link>
          </p>
        </div>

        <div className="card shadow-xl shadow-slate-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              id="login-email"
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              id="login-password"
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
