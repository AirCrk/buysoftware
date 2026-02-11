'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Monitor, Apple, Smartphone, Globe, Home, Terminal, Chrome, LayoutGrid, AppWindow, Tv, Tablet } from 'lucide-react';

const navCategories = [
  { id: '全部', label: '首页', icon: Home, value: null },
  { id: 'Windows', label: 'Windows', icon: LayoutGrid, value: 'Windows' },
  { id: 'macOS', label: 'macOS', icon: AppWindow, value: 'macOS' },
  { id: 'Linux', label: 'Linux', icon: Terminal, value: 'Linux' },
  { id: 'Web', label: 'Web', icon: Globe, value: 'Web' },
  { id: 'iOS', label: 'iOS', icon: Apple, value: 'iOS' },
  { id: 'iPad', label: 'iPad', icon: Tablet, value: 'iPad' },
  { id: 'Android', label: 'Android', icon: Smartphone, value: 'Android' },
  { id: 'TV', label: 'TV', icon: Tv, value: 'TV' },
  { id: 'Chrome', label: 'Chrome 扩展', icon: Chrome, value: 'Chrome' },
];

export default function CategoryNav() {
  const searchParams = useSearchParams();
  const currentPlatform = searchParams.get('platform');

  return (
    <div className="flex flex-wrap items-center gap-1">
      {navCategories.map((cat) => {
        const Icon = cat.icon;
        const isActive = cat.value === currentPlatform || (cat.value === null && !currentPlatform);
        
        return (
          <Link
            key={cat.id}
            href={cat.value ? `/?platform=${cat.value}` : '/'}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md translate-y-[1px]' 
                : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
