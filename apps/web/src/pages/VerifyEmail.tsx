import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Check, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((e: Error) => { setStatus('error'); setMessage(e.message); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center animate-slide-up max-w-sm">
        {status === 'loading' && (
          <>
            <Spinner className="mx-auto mb-4 w-10 h-10" />
            <p className="text-slate-500">{t('verify.title')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">{t('verify.success')}</h1>
            <p className="text-slate-500 mb-8">{t('verify.successDesc')}</p>
            <Link to="/login"><Button size="lg">{t('verify.goLogin')}</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">{t('verify.error')}</h1>
            <p className="text-slate-500 mb-8">{message || t('verify.errorDesc')}</p>
            <Link to="/login"><Button variant="secondary" size="lg">{t('verify.goLogin')}</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}
