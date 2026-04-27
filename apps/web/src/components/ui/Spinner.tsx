import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('w-6 h-6 animate-spin text-brand-600', className)} />;
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
          <Spinner className="text-white w-6 h-6" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
