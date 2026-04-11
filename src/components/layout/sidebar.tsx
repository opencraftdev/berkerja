'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, KeyRound, Settings } from 'lucide-react';

import { cn } from '@/utils/cn';

const navItems = [
  { href: '/cv', label: 'CV', icon: FileText },
  { href: '/keywords', label: 'Keywords', icon: KeyRound },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-50 lg:block">
      <div className="border-b border-slate-800 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.32em] text-blue-300">Berkerja</p>
        <h1 className="mt-2 text-2xl font-semibold">Automated job aggregation</h1>
      </div>
      <nav className="space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition',
                active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
