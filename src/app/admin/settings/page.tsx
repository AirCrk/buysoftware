'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Settings, LayoutDashboard, LogOut, Save, Loader2,
    CloudCog, Users, Globe, Plus, Edit, Trash2, Eye, EyeOff, X, Store
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Admin {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
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
    const [activeTab, setActiveTab] = useState<'oss' | 'site' | 'admins'>('oss');

    // OSS 配置
    const [ossConfig, setOssConfig] = useState({
        oss_region: '',
        oss_access_key_id: '',
        oss_access_key_secret: '',
        oss_bucket: '',
        oss_endpoint: '',
    });

    // 站点配置
    const [siteConfig, setSiteConfig] = useState({
        site_name: '',
        site_description: '',
        site_logo: '',
    });

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
                    oss_region: settings.oss_region || '',
                    oss_access_key_id: settings.oss_access_key_id || '',
                    oss_access_key_secret: settings.oss_access_key_secret || '',
                    oss_bucket: settings.oss_bucket || '',
                    oss_endpoint: settings.oss_endpoint || '',
                });

                setSiteConfig({
                    site_name: settings.site_name || '',
                    site_description: settings.site_description || '',
                    site_logo: settings.site_logo || '',
                });

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
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        <Store className="w-5 h-5" />
                        渠道管理
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium"
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
                                        配置阿里云 OSS 后，商品封面和富文本图片将上传到您的 OSS 存储桶中。
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            地域 (Region)
                                        </label>
                                        <input
                                            type="text"
                                            value={ossConfig.oss_region}
                                            onChange={(e) => setOssConfig(prev => ({ ...prev, oss_region: e.target.value }))}
                                            placeholder="如：oss-cn-hangzhou"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            存储桶名称 (Bucket)
                                        </label>
                                        <input
                                            type="text"
                                            value={ossConfig.oss_bucket}
                                            onChange={(e) => setOssConfig(prev => ({ ...prev, oss_bucket: e.target.value }))}
                                            placeholder="your-bucket-name"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        访问域名 (Endpoint)
                                    </label>
                                    <input
                                        type="text"
                                        value={ossConfig.oss_endpoint}
                                        onChange={(e) => setOssConfig(prev => ({ ...prev, oss_endpoint: e.target.value }))}
                                        placeholder="https://oss-cn-hangzhou.aliyuncs.com"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Access Key ID
                                    </label>
                                    <input
                                        type="text"
                                        value={ossConfig.oss_access_key_id}
                                        onChange={(e) => setOssConfig(prev => ({ ...prev, oss_access_key_id: e.target.value }))}
                                        placeholder="您的 AccessKey ID"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Access Key Secret
                                    </label>
                                    <input
                                        type="password"
                                        value={ossConfig.oss_access_key_secret}
                                        onChange={(e) => setOssConfig(prev => ({ ...prev, oss_access_key_secret: e.target.value }))}
                                        placeholder="您的 AccessKey Secret"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">保存后密钥将被加密存储</p>
                                </div>

                                <button
                                    onClick={saveOssConfig}
                                    disabled={saving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    保存 OSS 配置
                                </button>
                            </div>
                        )}

                        {/* 站点配置 */}
                        {activeTab === 'site' && (
                            <div className="space-y-5 max-w-2xl">
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
        </div>
    );
}
