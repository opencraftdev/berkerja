import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary',
        className,
      )}
      {...props}
    />
  );
}
