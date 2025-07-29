'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Home } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: '대시보드',
      href: '/',
      icon: Home,
      active: pathname === '/',
    },
    {
      name: 'KPI',
      href: '/kpi',
      icon: BarChart3,
      active: pathname === '/kpi',
    },
  ];

  return (
    <nav className="flex space-x-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              item.active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}