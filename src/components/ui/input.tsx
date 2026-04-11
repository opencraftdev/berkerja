import type { InputHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-blue-100',
        className,
      )}
      {...props}
    />
  );
}
