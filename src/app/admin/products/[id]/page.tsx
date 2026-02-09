'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Upload, X, Save, Loader2, CloudUpload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// 动态导入富文本编辑器（避免 SSR 问题）
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
    ssr: false,
    loading: () => <div className="min-h-[300px] border rounded-lg animate-pulse bg-gray-100" />,
});

interface Platform {
    id: string;
    name: string;
}

interface Channel {
    id: string;
    name: string;
    color: string | null;
}

export default function ProductEditPage() {
    const router = useRouter();
    const params = useParams();
    const { status } = useSession();
    const isNew = params.id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);

    // 表单数据
    const [formData, setFormData] = useState({
        name: '',
        subtitle: '',
        description: '',
        originalPrice: '',
        salePrice: '',
        cpsLink: '',
        downloadUrl: '',
        coverImage: '',
        logo: '',
        images: [] as string[],
        platformIds: [] as string[],
        channelId: '',
        isActive: true,
    });

    // 获取平台和渠道列表
    useEffect(() => {
        // 获取平台
        fetch('/api/platforms')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setPlatforms(data.data);
                }
            });

        // 获取渠道
        fetch('/api/channels')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setChannels(data.data);
                }
            });
    }, []);

    // 获取商品详情（编辑模式）
    const fetchProduct = useCallback(async () => {
        if (isNew) return;

        try {
            const res = await fetch(`/api/products/${params.id}`);
            const data = await res.json();

            if (data.success) {
                const product = data.data;
                setFormData({
                    name: product.name || '',
                    subtitle: product.subtitle || '',
                    description: product.description || '',
                    originalPrice: product.originalPrice?.toString() || '',
                    salePrice: product.salePrice?.toString() || '',
                    cpsLink: product.cpsLink || '',
                    downloadUrl: product.downloadUrl || '',
                    coverImage: product.coverImage || '',
                    logo: product.logo || '',
                    images: product.images || (product.coverImage ? [product.coverImage] : []),
                    platformIds: product.platforms?.map((p: Platform) => p.id) || [],
                    channelId: product.channelId || '',
                    isActive: product.isActive ?? true,
                });
            }
        } catch (error) {
            console.error('获取商品失败:', error);
        } finally {
            setLoading(false);
        }
    }, [isNew, params.id]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProduct();
        } else if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, fetchProduct, router]);

    // 上传 Logo
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'oss' | 'smms' = 'oss') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        if (target === 'oss') {
            formData.append('folder', 'logos');
        }

        try {
            const endpoint = target === 'smms' ? '/api/upload/smms' : '/api/upload';
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.url) {
                setFormData((prev) => ({ ...prev, logo: data.url }));
            } else {
                alert(data.error || '上传失败');
            }
        } catch (error) {
            console.error(error);
            alert('上传失败');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // 上传封面图片
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'oss' | 'smms' = 'oss') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        if (target === 'oss') {
            formData.append('folder', 'covers');
        }

        try {
            const endpoint = target === 'smms' ? '/api/upload/smms' : '/api/upload';
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.url) {
                setFormData((prev) => {
                    const newImages = [...prev.images, data.url];
                    return { 
                        ...prev, 
                        images: newImages,
                        coverImage: newImages[0] // 始终使用第一张作为封面
                    };
                });
            } else {
                alert(data.error || '上传失败');
            }
        } catch (error) {
            console.error(error);
            alert('上传失败');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // 移除图片
    const removeImage = (index: number) => {
        setFormData((prev) => {
            const newImages = prev.images.filter((_, i) => i !== index);
            return {
                ...prev,
                images: newImages,
                coverImage: newImages[0] || ''
            };
        });
    };

    // 设为封面（移动到第一位）
    const setAsCover = (index: number) => {
        setFormData((prev) => {
            const newImages = [...prev.images];
            const [item] = newImages.splice(index, 1);
            newImages.unshift(item);
            return {
                ...prev,
                images: newImages,
                coverImage: newImages[0]
            };
        });
    };

    // 保存商品
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.cpsLink) {
            alert('请填写商品名称和推广链接');
            return;
        }

        setSaving(true);

        try {
            const url = isNew ? '/api/products' : `/api/products/${params.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin');
            } else {
                alert(data.error || '保存失败');
            }
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 切换平台选择
    const togglePlatform = (platformId: string) => {
        setFormData((prev) => ({
            ...prev,
            platformIds: prev.platformIds.includes(platformId)
                ? prev.platformIds.filter((id) => id !== platformId)
                : [...prev.platformIds, platformId],
        }));
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 顶部导航 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold">
                            {isNew ? '添加商品' : '编辑商品'}
                        </h1>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </header>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-6">
                {/* 基本信息 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">基本信息</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                商品名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="如：Office 365"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                副标题/简介
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                                placeholder="一句话描述软件特点"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                原价（元）
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: e.target.value }))}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                促销价（元）
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.salePrice}
                                onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            推广链接 (CPS) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.cpsLink}
                            onChange={(e) => setFormData((prev) => ({ ...prev, cpsLink: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            下载地址 (可选)
                        </label>
                        <input
                            type="url"
                            value={formData.downloadUrl}
                            onChange={(e) => setFormData((prev) => ({ ...prev, downloadUrl: e.target.value }))}
                            placeholder="https://... (提供此链接将显示下载按钮)"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* 软件Logo上传 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">软件Logo (首页展示)</h2>
                    
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {/* 预览 */}
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 border border-gray-200 overflow-hidden relative group">
                            {formData.logo ? (
                                <>
                                    <Image
                                        src={formData.logo}
                                        alt="Logo"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="删除"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-xs">无Logo</span>
                                </div>
                            )}
                        </div>

                        {/* 上传控件 */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                                    {uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    {uploading ? '上传中...' : '上传Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoUpload(e, 'oss')}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                
                                <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                                    {uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CloudUpload className="w-4 h-4" />
                                    )}
                                    {uploading ? '上传中...' : 'SM.MS 图床'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoUpload(e, 'smms')}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                            
                            <input
                                type="url"
                                value={formData.logo}
                                onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                                placeholder="或输入Logo图片链接"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <p className="text-sm text-gray-500">
                                建议尺寸：1:1 或 4:3，用于首页卡片展示。若未设置，将使用默认首字母图标。
                            </p>
                        </div>
                    </div>
                </div>

                {/* 封面上传 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">商品图片 ({formData.images.length}/5)</h2>

                    <div className="space-y-4">
                        {/* 图片列表 */}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group border border-gray-200">
                                        <Image
                                            src={img}
                                            alt={`图片 ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        {/* 操作遮罩 */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            {index === 0 ? (
                                                <span className="text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                                                    主图
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setAsCover(index)}
                                                    className="text-xs bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded"
                                                >
                                                    设为主图
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                title="删除"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 上传区域 */}
                        {formData.images.length < 5 && (
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                                <div className="flex gap-3">
                                    <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        {uploading ? '上传中...' : '上传到服务器'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleCoverUpload(e, 'oss')}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                    
                                    <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CloudUpload className="w-4 h-4" />
                                        )}
                                        {uploading ? '上传中...' : 'SM.MS 图床'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleCoverUpload(e, 'smms')}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                
                                <div className="flex-1 w-full sm:w-auto">
                                    <input
                                        type="url"
                                        placeholder="或输入图片外链地址，回车添加"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val) {
                                                    setFormData(prev => {
                                                        const newImages = [...prev.images, val];
                                                        return {
                                                            ...prev,
                                                            images: newImages,
                                                            coverImage: newImages[0]
                                                        };
                                                    });
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-500">
                            最多上传 5 张图片。第一张将作为商品封面（主图）。支持拖拽排序（暂未实现，请使用"设为主图"功能）。
                        </p>
                    </div>
                </div>

                {/* 平台分类 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">平台分类</h2>

                    <div className="flex flex-wrap gap-3">
                        {platforms.map((platform) => (
                            <label
                                key={platform.id}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${formData.platformIds.includes(platform.id)
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.platformIds.includes(platform.id)}
                                    onChange={() => togglePlatform(platform.id)}
                                    className="sr-only"
                                />
                                <span>{platform.name}</span>
                            </label>
                        ))}
                        {platforms.length === 0 && (
                            <p className="text-gray-500">暂无平台分类，请先在数据库中添加</p>
                        )}
                    </div>
                </div>

                {/* 渠道选择 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">渠道/供应商</h2>

                    <div>
                        <select
                            value={formData.channelId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, channelId: e.target.value }))}
                            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="">请选择渠道</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-2">
                            选择商品的来源渠道/供应商，如金州软件、未来教育、荔枝软件等
                        </p>
                    </div>
                </div>

                {/* 详情描述 */}
                <div className="bg-white rounded-xl p-6 space-y-5">
                    <h2 className="font-bold text-lg text-gray-900">详情描述</h2>

                    <RichTextEditor
                        content={formData.description}
                        onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                    />
                </div>
            </form>
        </div>
    );
}
