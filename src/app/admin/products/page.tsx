'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Edit, Trash2, Plus, Loader2, Filter, Search,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';

interface Platform {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    subtitle: string;
    originalPrice: number;
    salePrice: number;
    coverImage: string;
    logo: string;
    isActive: boolean;
    channel: { name: string } | null;
    platforms: Platform[];
}

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);

    // 筛选与分页状态
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const PAGE_SIZE = 20;

    // 获取平台列表
    useEffect(() => {
        fetch('/api/platforms')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPlatforms(data.data);
                }
            });
    }, []);

    // 获取商品列表
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: PAGE_SIZE.toString(),
            });

            if (selectedPlatform) {
                params.append('platformId', selectedPlatform);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const res = await fetch(`/api/admin/products?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalItems(data.pagination.total);
                }
            } else {
                console.error(data.error);
            }
        } catch (error) {
            console.error('获取失败', error);
        } finally {
            setLoading(false);
        }
    };

    // 当筛选条件变化时，重置页码并重新获取
    useEffect(() => {
        setPage(1);
    }, [selectedPlatform, searchQuery]);

    // 当页码变化时获取数据
    useEffect(() => {
        fetchProducts();
    }, [page, selectedPlatform, searchQuery]); // 注意：这会导致 initial load 触发 fetch

    const handleDelete = async (id: string) => {
        if (!window.confirm('确定要删除这个商品吗？')) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                // 如果当前页删空了，且不是第一页，回到上一页
                if (products.length === 1 && page > 1) {
                    setPage(p => p - 1);
                } else {
                    fetchProducts();
                }
            } else {
                alert(data.error || '删除失败');
            }
        } catch (error) {
            alert('删除失败');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />
            <div className="flex-1 ml-64 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
                            <p className="text-gray-500 mt-1">管理系统中的所有软件商品</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* 搜索框 */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="搜索商品..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-48 sm:w-64"
                                />
                            </div>

                            {/* 平台筛选 */}
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 min-w-[120px]"
                            >
                                <option value="">所有平台</option>
                                {platforms.map((platform) => (
                                    <option key={platform.id} value={platform.id}>
                                        {platform.name}
                                    </option>
                                ))}
                            </select>

                            {/* 添加按钮 */}
                            <Link
                                href="/admin/products/new"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">添加商品</span>
                            </Link>
                        </div>
                    </div>

                    {/* Table & Pagination Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">商品信息</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">价格</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">渠道</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">平台</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center text-gray-500">
                                                <div className="flex justify-center mb-4">
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                                </div>
                                                加载中...
                                            </td>
                                        </tr>
                                    ) : products.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-24 text-center text-gray-500">
                                                暂无符合条件的商品
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                            {(product.logo || product.coverImage) ? (
                                                                <Image
                                                                    src={product.logo || product.coverImage}
                                                                    alt={product.name}
                                                                    width={48}
                                                                    height={48}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                                                    {product.name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">{product.subtitle}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">¥{Number(product.salePrice).toFixed(2)}</div>
                                                        <div className="text-gray-500 line-through text-xs">¥{Number(product.originalPrice).toFixed(2)}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.channel?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {product.platforms?.map((p) => (
                                                            <span key={p.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {product.isActive ? '已上架' : '已下架'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Link
                                                            href={`/admin/products/${product.id}`}
                                                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
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

                        {/* Pagination */}
                        {totalItems > 0 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        上一页
                                    </button>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        下一页
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            显示第 <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> 到 <span className="font-medium">{Math.min(page * PAGE_SIZE, totalItems)}</span> 条，
                                            共 <span className="font-medium">{totalItems}</span> 条
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => setPage(Math.max(1, page - 1))}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">上一页</span>
                                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                            </button>

                                            {/* 页码显示 - 简化版 */}
                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                                {page} / {totalPages}
                                            </span>

                                            <button
                                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                                disabled={page === totalPages}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">下一页</span>
                                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
