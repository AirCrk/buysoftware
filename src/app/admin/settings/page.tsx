'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Settings, Save, Loader2,
    CloudCog, Users, Globe, Plus, Edit, Trash2, Eye, EyeOff, X, Image as ImageIcon, Upload, Link as LinkIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface Admin {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

interface BannerSlide {
    id: string;
    imageUrl: string;
    linkUrl: string;
    title: string;
}

interface SettingsData {
    settings: Record<string, string>;
    admins: Admin[];
}

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'oss' | 'site' | 'banners' | 'admins'>('oss');

    // OSS 配置
    const [ossConfig, setOssConfig] = useState({
        smms_token: '',
    });

    // 站点配置
    const [siteConfig, setSiteConfig] = useState({
        site_name: '',
        site_title: '',
        site_description: '',
        site_logo: '',
        footer_copyright: '',
        footer_description: '',
    });

    // 广告轮播图
    const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
    const [bannerForm, setBannerForm] = useState({
        imageUrl: '',
        linkUrl: '',
        title: '',
    });
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    // 管理员列表
    const [admins, setAdmins] = useState<Admin[]>([]);

    // 管理员弹窗
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [adminForm, setAdminForm] = useState({
        email: '',
        name: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

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
                const { settings, admins: adminList } = data.data as SettingsData;

                setOssConfig({
                    smms_token: settings.smms_token || '',
                });

                setSiteConfig({
                    site_name: settings.site_name || '',
                    site_title: settings.site_title || '',
                    site_description: settings.site_description || '',
                    site_logo: settings.site_logo || '',
                    footer_copyright: settings.footer_copyright || '',
                    footer_description: settings.footer_description || '',
                });

                if (settings.banner_slides) {
                    try {
                        setBannerSlides(JSON.parse(settings.banner_slides));
                    } catch (e) {
                        console.error('Failed to parse banner slides', e);
                        setBannerSlides([]);
                    }
                }

                setAdmins(adminList);
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

    // 保存 OSS 配置
    const saveOssConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_oss', ...ossConfig }),
            });
            const data = await res.json();
            alert(data.success ? 'OSS 配置已保存' : data.error);
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 保存站点配置
    const saveSiteConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_site', ...siteConfig }),
            });
            const data = await res.json();
            alert(data.success ? '站点配置已保存' : data.error);
        } catch (error) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 保存 Banner 配置
    const saveBannerConfig = async (newBanners: BannerSlide[]) => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_site',
                    banner_slides: JSON.stringify(newBanners)
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return true;
        } catch (error: any) {
            alert('保存 Banner 配置失败: ' + (error.message || '未知错误'));
            return false;
        }
    };

    // 上传图片
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBanner(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload/smms', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.success) {
                setBannerForm(prev => ({ ...prev, imageUrl: data.url }));
            } else {
                alert('上传失败: ' + data.error);
            }
        } catch (error) {
            alert('上传出错');
        } finally {
            setUploadingBanner(false);
            if (bannerFileInputRef.current) {
                bannerFileInputRef.current.value = '';
            }
        }
    };

    // 保存单个 Banner
    const saveBanner = async () => {
        if (!bannerForm.imageUrl) {
            alert('请上传图片或输入图片地址');
            return;
        }

        const newBanner: BannerSlide = {
            id: editingBanner?.id || Date.now().toString(),
            imageUrl: bannerForm.imageUrl,
            linkUrl: bannerForm.linkUrl,
            title: bannerForm.title,
        };

        let newBanners: BannerSlide[];
        if (editingBanner) {
            newBanners = bannerSlides.map(b => b.id === editingBanner.id ? newBanner : b);
        } else {
            newBanners = [...bannerSlides, newBanner];
        }

        setSaving(true);
        const success = await saveBannerConfig(newBanners);
        if (success) {
            setBannerSlides(newBanners);
            setShowBannerModal(false);
            setBannerForm({ imageUrl: '', linkUrl: '', title: '' });
            alert(editingBanner ? 'Banner 已更新' : 'Banner 已添加');
        }
        setSaving(false);
    };

    // 删除 Banner
    const deleteBanner = async (id: string) => {
        if (!confirm('确定删除该 Banner 吗？')) return;

        const newBanners = bannerSlides.filter(b => b.id !== id);
        setSaving(true);
        const success = await saveBannerConfig(newBanners);
        if (success) {
            setBannerSlides(newBanners);
        }
        setSaving(false);
    };

    // 打开 Banner 模态框
    const openBannerModal = (banner?: BannerSlide) => {
        if (banner) {
            setEditingBanner(banner);
            setBannerForm({
                imageUrl: banner.imageUrl,
                linkUrl: banner.linkUrl || '',
                title: banner.title || '',
            });
        } else {
            setEditingBanner(null);
            setBannerForm({ imageUrl: '', linkUrl: '', title: '' });
        }
        setShowBannerModal(true);
    };

    // 打开管理员弹窗
    const openAdminModal = (admin?: Admin) => {
        if (admin) {
            setEditingAdmin(admin);
            setAdminForm({ email: admin.email, name: admin.name || '', password: '' });
        } else {
            setEditingAdmin(null);
            setAdminForm({ email: '', name: '', password: '' });
        }
        setShowPassword(false);
        setShowAdminModal(true);
    };

    // 保存管理员
    const saveAdmin = async () => {
        if (!adminForm.email) {
            alert('请填写邮箱');
            return;
        }
        if (!editingAdmin && !adminForm.password) {
            alert('请填写密码');
            return;
        }

        setSaving(true);
        try {
            const action = editingAdmin ? 'update_admin' : 'add_admin';
            const payload = editingAdmin
                ? { action, id: editingAdmin.id, ...adminForm }
                : { action, ...adminForm };

            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                setShowAdminModal(false);
                fetchSettings();
                alert(editingAdmin ? '管理员信息已更新' : '管理员已添加');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('操作失败');
        } finally {
            setSaving(false);
        }
    };

    // 删除管理员
    const deleteAdmin = async (id: string) => {
        if (!confirm('确定删除该管理员吗？')) return;

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_admin', id }),
            });
            const data = await res.json();

            if (data.success) {
                fetchSettings();
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

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* 侧边栏 */}
            <AdminSidebar />

            {/* 主内容 */}
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
                    <p className="text-gray-500">配置文件存储和管理员账号</p>
                </div>

                {/* 选项卡 */}
                <div className="bg-white rounded-xl mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('oss')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'oss'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <CloudCog className="w-5 h-5" />
                            文件存储
                        </button>
                        <button
                            onClick={() => setActiveTab('site')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'site'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Globe className="w-5 h-5" />
                            站点信息
                        </button>
                        <button
                            onClick={() => setActiveTab('banners')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'banners'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ImageIcon className="w-5 h-5" />
                            广告轮播图
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === 'admins'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            管理员账号
                        </button>
                    </div>

                    <div className="p-6">
                        {/* OSS 配置 */}
                        {activeTab === 'oss' && (
                            <div className="space-y-5 max-w-2xl">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-700">
                                        配置 SM.MS 图床后，商品封面和富文本图片将上传到 SM.MS 图床中。
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        SM.MS Token
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={ossConfig.smms_token}
                                            onChange={(e) => setOssConfig({ ...ossConfig, smms_token: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="用于 SM.MS 图床上传鉴权"
                                        />
                                        <CloudCog className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">从 https://sm.ms/home/apitoken 或 https://smms.app/home/apitoken (国内推荐) 获取 Secret Token</p>
                                </div>

                                <button
                                    onClick={saveOssConfig}
                                    disabled={saving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    保存图床配置
                                </button>
                            </div>
                        )}

                        {/* 站点配置 */}
                        {activeTab === 'site' && (
                            <div className="space-y-5 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        浏览器标题 (Title)
                                    </label>
                                    <input
                                        type="text"
                                        value={siteConfig.site_title}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, site_title: e.target.value }))}
                                        placeholder="SoRuan - 正版软件导航平台"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">显示在浏览器标签页上的标题</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        站点名称
                                    </label>
                                    <input
                                        type="text"
                                        value={siteConfig.site_name}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, site_name: e.target.value }))}
                                        placeholder="BuySoft"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        站点描述
                                    </label>
                                    <textarea
                                        value={siteConfig.site_description}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, site_description: e.target.value }))}
                                        placeholder="正版软件导航平台"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        站点 Logo (URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={siteConfig.site_logo}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, site_logo: e.target.value }))}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">留空则显示默认 Logo</p>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        底部版权信息 (Copyright)
                                    </label>
                                    <input
                                        type="text"
                                        value={siteConfig.footer_copyright}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, footer_copyright: e.target.value }))}
                                        placeholder="© 2026 BuySoft. 正版软件导航平台"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        底部描述信息
                                    </label>
                                    <input
                                        type="text"
                                        value={siteConfig.footer_description}
                                        onChange={(e) => setSiteConfig(prev => ({ ...prev, footer_description: e.target.value }))}
                                        placeholder="本站所有软件均为正版授权，点击购买即跳转至官方或授权渠道"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    onClick={saveSiteConfig}
                                    disabled={saving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    保存站点配置
                                </button>
                            </div>
                        )}

                        {/* 广告轮播图 */}
                        {activeTab === 'banners' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-gray-600">管理首页顶部的广告轮播图</p>
                                    <button
                                        onClick={() => openBannerModal()}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        添加轮播图
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    {bannerSlides.map((banner, index) => (
                                        <div
                                            key={banner.id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                                        >
                                            <div className="relative w-32 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                <Image
                                                    src={banner.imageUrl}
                                                    alt={banner.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {banner.title || '无标题'}
                                                    <span className="ml-2 text-xs text-gray-400 font-normal">
                                                        (排序: {index + 1})
                                                    </span>
                                                </h4>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 truncate mt-1">
                                                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                                    {banner.linkUrl || '无链接'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openBannerModal(banner)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    title="编辑"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newBanners = [...bannerSlides];
                                                        if (index > 0) {
                                                            [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
                                                            setBannerSlides(newBanners);
                                                            saveBannerConfig(newBanners);
                                                        }
                                                    }}
                                                    disabled={index === 0}
                                                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30"
                                                    title="上移"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newBanners = [...bannerSlides];
                                                        if (index < newBanners.length - 1) {
                                                            [newBanners[index + 1], newBanners[index]] = [newBanners[index], newBanners[index + 1]];
                                                            setBannerSlides(newBanners);
                                                            saveBannerConfig(newBanners);
                                                        }
                                                    }}
                                                    disabled={index === bannerSlides.length - 1}
                                                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30"
                                                    title="下移"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => deleteBanner(banner.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="删除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {bannerSlides.length === 0 && (
                                        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            暂无轮播图，点击上方按钮添加
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 管理员账号 */}
                        {activeTab === 'admins' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-gray-600">管理可登录后台的管理员账户</p>
                                    <button
                                        onClick={() => openAdminModal()}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        添加管理员
                                    </button>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>邮箱</th>
                                                <th>名称</th>
                                                <th>创建时间</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.map((admin) => (
                                                <tr key={admin.id}>
                                                    <td className="font-medium">{admin.email}</td>
                                                    <td>{admin.name || '-'}</td>
                                                    <td className="text-gray-500">
                                                        {new Date(admin.createdAt).toLocaleDateString('zh-CN')}
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openAdminModal(admin)}
                                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteAdmin(admin.id)}
                                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 管理员弹窗 */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">
                                {editingAdmin ? '编辑管理员' : '添加管理员'}
                            </h3>
                            <button
                                onClick={() => setShowAdminModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    邮箱 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={adminForm.email}
                                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    名称
                                </label>
                                <input
                                    type="text"
                                    value={adminForm.name}
                                    onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="管理员名称（可选）"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    密码 {!editingAdmin && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={adminForm.password}
                                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder={editingAdmin ? '留空则不修改密码' : '设置登录密码'}
                                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAdminModal(false)}
                                className="flex-1 btn-secondary"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveAdmin}
                                disabled={saving}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingAdmin ? '保存修改' : '添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner 弹窗 */}
            {showBannerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">
                                {editingBanner ? '编辑轮播图' : '添加轮播图'}
                            </h3>
                            <button
                                onClick={() => setShowBannerModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    图片 <span className="text-red-500">*</span>
                                </label>

                                <div className="space-y-3">
                                    {/* 预览 */}
                                    {bannerForm.imageUrl && (
                                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            <Image
                                                src={bannerForm.imageUrl}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={bannerForm.imageUrl}
                                            onChange={(e) => setBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                            placeholder="输入图片 URL"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                        <button
                                            onClick={() => bannerFileInputRef.current?.click()}
                                            disabled={uploadingBanner}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 text-sm transition-colors whitespace-nowrap"
                                        >
                                            {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            上传
                                        </button>
                                        <input
                                            ref={bannerFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleBannerUpload}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">建议尺寸: 1200x300 (4:1)，支持 jpg, png, webp</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    跳转链接
                                </label>
                                <input
                                    type="text"
                                    value={bannerForm.linkUrl}
                                    onChange={(e) => setBannerForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                                    placeholder="https://example.com/..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    标题/备注
                                </label>
                                <input
                                    type="text"
                                    value={bannerForm.title}
                                    onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="可选，仅用于后台展示"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowBannerModal(false)}
                                className="flex-1 btn-secondary"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveBanner}
                                disabled={saving || uploadingBanner}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingBanner ? '保存' : '添加')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
