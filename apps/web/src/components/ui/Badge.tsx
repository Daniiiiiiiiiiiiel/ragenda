import { cn } from '@/lib/utils';

type Status = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

const statusClasses: Record<Status, string> = {
  PENDING:   'badge-pending',
  ACCEPTED:  'badge-accepted',
  REJECTED:  'badge-rejected',
  CANCELLED: 'badge-cancelled',
};

const dots: Record<Status, string> = {
  PENDING:   'bg-amber-500',
  ACCEPTED:  'bg-emerald-500',
  REJECTED:  'bg-red-500',
  CANCELLED: 'bg-slate-400',
};

interface BadgeProps {
  status: Status;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn(statusClasses[status], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[status])} />
      {label}
    </span>
  );
}
