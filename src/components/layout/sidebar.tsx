'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Key, Briefcase, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/cv', label: 'CV Manager', icon: FileText, color: 'text-blue-400' },
  { href: '/keywords', label: 'Keywords', icon: Sparkles, color: 'text-purple-400' },
  { href: '/jobs', label: 'Jobs', icon: Briefcase, color: 'text-emerald-400' },
  { href: '/settings', label: 'Settings', icon: Settings, color: 'text-gray-400' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Berkerja
            </h1>
            <p className="text-xs text-slate-500">Job Automation</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isActive ? 'bg-indigo-500/20' : 'bg-slate-800/50'
              )}>
                <Icon className={cn('h-4 w-4', item.color, isActive && 'text-white')} />
              </div>
              {item.label}
              {isActive && (
                <Badge variant="secondary" className="ml-auto bg-indigo-500/20 text-indigo-300 text-xs">
                  Active
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800/50">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-slate-500 truncate">user@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
