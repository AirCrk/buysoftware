'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Package, Plus, Search, Edit, Trash2, Eye, EyeOff,
    LogOut, LayoutDashboard, RefreshCw, Settings, Store
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Platform {
    id: string;
    name: string;
}

interface Channel {
    id: string;
    name: string;
    color: string | null;
}

interface Product {
    id: string;
    name: string;
    subtitle: string | null;
    originalPrice: number;
    salePrice: number;
    coverImage: string | null;
    platforms: Platform[];
    channel: Channel | null;
    isActive: boolean;
    viewCount: number;
    clickCount: number;
    createdAt: string;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // 检查登录状态
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ admin: 'true' });
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('获取商品失败:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProducts();
        }
    }, [status, fetchProducts]);

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除此商品吗？')) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            alert('删除失败');
        }
    };

    const handleToggleActive = async (product: Product) => {
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...product, isActive: !product.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
            }
        } catch (error) {
            alert('操作失败');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* 侧边栏 */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">B</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">BuySoft</h1>
                            <p className="text-xs text-gray-500">管理后台</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        商品管理
                    </Link>
                    <Link
                        href="/admin/channels"
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        <Store className="w-5 h-5" />
                        渠道管理
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        <Settings className="w-5 h-5" />
                        系统设置
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">
                        {session?.user?.email}
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        退出登录
                    </button>
                </div>
            </aside>

            {/* 主内容 */}
            <main className="flex-1 p-8">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
                        <p className="text-gray-500">管理您的软件商品列表</p>
                    </div>
                    <Link
                        href="/admin/products/new"
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        添加商品
                    </Link>
                </div>

                {/* 搜索和操作栏 */}
                <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索商品..."
                            className="search-input pl-10"
                        />
                    </div>
                    <button
                        onClick={() => fetchProducts()}
                        className="p-2 text-gray-500 hover:text-gray-700"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* 商品表格 */}
                <div className="bg-white rounded-xl overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>商品</th>
                                <th>价格</th>
                                <th>渠道</th>
                                <th>平台</th>
                                <th>状态</th>
                                <th>数据</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        暂无商品，
                                        <Link href="/admin/products/new" className="text-blue-600 hover:underline">
                                            点击添加
                                        </Link>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {product.coverImage ? (
                                                        <Image
                                                            src={product.coverImage}
                                                            alt={product.name}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                                                            <Package className="w-6 h-6 text-blue-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-1">
                                                        {product.subtitle || '暂无简介'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-gray-400 line-through text-sm">
                                                ¥{product.originalPrice}
                                            </div>
                                            <div className="text-red-500 font-medium">
                                                ¥{product.salePrice}
                                            </div>
                                        </td>
                                        <td>
                                            {product.channel ? (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                                                    {product.channel.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-1 flex-wrap">
                                                {product.platforms.map((p) => (
                                                    <span
                                                        key={p.id}
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                                    >
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleActive(product)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${product.isActive
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                {product.isActive ? (
                                                    <>
                                                        <Eye className="w-3 h-3" />
                                                        已上架
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-3 h-3" />
                                                        已下架
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <span className="text-gray-500">浏览</span>{' '}
                                                <span className="text-gray-900">{product.viewCount}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-500">点击</span>{' '}
                                                <span className="text-gray-900">{product.clickCount}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/products/${product.id}`}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
