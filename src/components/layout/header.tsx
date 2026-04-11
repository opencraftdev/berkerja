import { User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      <div className="flex items-center gap-2">
        <User className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium">User</span>
      </div>
    </header>
  );
}
