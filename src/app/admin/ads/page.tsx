'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface SettingsData {
    settings: Record<string, string>;
}

export default function AdSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 广告配置
    const [adConfig, setAdConfig] = useState({
        product_sidebar_ad_image: '',
        product_sidebar_ad_link: '',
    });

    // 检查登录
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    // 获取设置
    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();

            if (data.success) {
                const { settings } = data.data as SettingsData;

                setAdConfig({
                    product_sidebar_ad_image: settings.product_sidebar_ad_image || '',
                    product_sidebar_ad_link: settings.product_sidebar_ad_link || '',
                });
            }
        } catch (error) {
            console.error('获取设置失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSettings();
        }
    }, [status, fetchSettings]);

    // 保存配置
    const saveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_site', ...adConfig }),
            });
            const data = await res.json();
            alert(data.success ? '广告配置已保存' : data.error);
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AdminSidebar />
                <main className="flex-1 ml-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">广告设置</h1>
                            <p className="text-gray-500 mt-1">管理站点各个位置的广告展示</p>
                        </div>
                        <button
                            onClick={saveConfig}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            保存配置
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-blue-600" />
                                商品详情页侧边栏广告
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">显示在商品详情页右侧热门软件上方</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    广告图片 (URL)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={adConfig.product_sidebar_ad_image}
                                        onChange={(e) => setAdConfig(prev => ({ ...prev, product_sidebar_ad_image: e.target.value }))}
                                        placeholder="https://example.com/ad.jpg"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {adConfig.product_sidebar_ad_image && (
                                    <div className="mt-3 relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <img 
                                            src={adConfig.product_sidebar_ad_image} 
                                            alt="预览" 
                                            className="w-full h-full object-contain"
                                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    跳转链接 (URL)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={adConfig.product_sidebar_ad_link}
                                        onChange={(e) => setAdConfig(prev => ({ ...prev, product_sidebar_ad_link: e.target.value }))}
                                        placeholder="https://example.com/promotion"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">用户点击广告图片时跳转的目标地址</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
