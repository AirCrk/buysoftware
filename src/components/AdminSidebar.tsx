'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Settings, LogOut, Link as LinkIcon, Megaphone } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const menuItems = [
        { name: '商品管理', href: '/admin/products', icon: LayoutDashboard },
        { name: '渠道管理', href: '/admin/channels', icon: Store },
        { name: '友情链接', href: '/admin/friend-links', icon: LinkIcon },
        { name: '广告设置', href: '/admin/ads', icon: Megaphone },
        { name: '系统设置', href: '/admin/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-50">
            <div className="p-6 border-b border-gray-200">
                <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg">SoRuan</h1>
                        <p className="text-xs text-gray-500">管理后台</p>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    // Special case: /admin maps to products for now, or generally admin dashboard
                    // If href is /admin/products, highlight it if path starts with it OR if path is exactly /admin
                    const isActive = pathname.startsWith(item.href) || (item.href === '/admin/products' && pathname === '/admin');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm font-medium text-gray-900 mb-1 truncate px-2">
                    {session?.user?.name || '管理员'}
                </div>
                <div className="text-xs text-gray-500 mb-3 truncate px-2">
                    {session?.user?.email}
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 text-sm w-full px-2 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    退出登录
                </button>
            </div>
        </aside>
    );
}
