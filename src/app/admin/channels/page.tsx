'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Settings, LayoutDashboard, LogOut, Plus, Edit, Trash2, X, Loader2, Store
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Channel {
    id: string;
    name: string;
    color: string | null;
    createdAt: string;
    _count?: {
        products: number;
    };
}

export default function ChannelsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);

    // 弹窗状态
    const [showModal, setShowModal] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#8B5CF6',
    });

    // 检查登录
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    // 获取渠道列表
    const fetchChannels = useCallback(async () => {
        try {
            const res = await fetch('/api/channels');
            const data = await res.json();
            if (data.success) {
                setChannels(data.data);
            }
        } catch (error) {
            console.error('获取渠道失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchChannels();
        }
    }, [status, fetchChannels]);

    // 打开弹窗
    const openModal = (channel?: Channel) => {
        if (channel) {
            setEditingChannel(channel);
            setFormData({ name: channel.name, color: channel.color || '#8B5CF6' });
        } else {
            setEditingChannel(null);
            setFormData({ name: '', color: '#8B5CF6' });
        }
        setShowModal(true);
    };

    // 保存渠道
    const saveChannel = async () => {
        if (!formData.name.trim()) {
            alert('请输入渠道名称');
            return;
        }

        setSaving(true);
        try {
            const url = editingChannel ? `/api/channels/${editingChannel.id}` : '/api/channels';
            const method = editingChannel ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                fetchChannels();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 删除渠道
    const deleteChannel = async (id: string) => {
        if (!confirm('确定删除该渠道吗？')) return;

        try {
            const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchChannels();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('删除失败');
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // 预定义颜色
    const colorOptions = [
        '#8B5CF6', // 紫色
        '#3B82F6', // 蓝色
        '#10B981', // 绿色
        '#F59E0B', // 橙色
        '#EF4444', // 红色
        '#EC4899', // 粉色
        '#6366F1', // 靛蓝
        '#14B8A6', // 青色
    ];

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
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        商品管理
                    </Link>
                    <Link
                        href="/admin/channels"
                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">渠道管理</h2>
                        <p className="text-gray-500">管理商品的供应渠道，如金州软件、未来教育、荔枝软件等</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        添加渠道
                    </button>
                </div>

                {/* 渠道列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: channel.color || '#8B5CF6' }}
                                    >
                                        {channel.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {channel._count?.products || 0} 个商品
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openModal(channel)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteChannel(channel.id)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {channels.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            暂无渠道，
                            <button
                                onClick={() => openModal()}
                                className="text-blue-600 hover:underline"
                            >
                                点击添加
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* 添加/编辑弹窗 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">
                                {editingChannel ? '编辑渠道' : '添加渠道'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    渠道名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="如：金州软件"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    标识颜色
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 btn-secondary"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveChannel}
                                disabled={saving}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingChannel ? '保存修改' : '添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
