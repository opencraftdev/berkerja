import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'default' && 'bg-primary text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        variant === 'outline' && 'border border-border bg-white text-slate-900 hover:bg-slate-50',
        className,
      )}
      {...props}
    />
  );
}
