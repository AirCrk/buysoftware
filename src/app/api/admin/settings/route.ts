import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 系统配置 key 列表
const CONFIG_KEYS = {
    OSS_REGION: 'oss_region',
    OSS_ACCESS_KEY_ID: 'oss_access_key_id',
    OSS_ACCESS_KEY_SECRET: 'oss_access_key_secret',
    OSS_BUCKET: 'oss_bucket',
    OSS_ENDPOINT: 'oss_endpoint',
    SMMS_TOKEN: 'smms_token',
    SITE_NAME: 'site_name',
    SITE_DESCRIPTION: 'site_description',
    SITE_LOGO: 'site_logo',
};

// GET - 获取系统设置
export async function GET() {
    try {
        const configs = await prisma.siteConfig.findMany();

        // 转换为对象格式
        const settings: Record<string, string> = {};
        configs.forEach((config: { key: string; value: string }) => {
            // 敏感信息脱敏
            if ((config.key === CONFIG_KEYS.OSS_ACCESS_KEY_SECRET || config.key === CONFIG_KEYS.SMMS_TOKEN) && config.value) {
                settings[config.key] = config.value.replace(/./g, (c: string, i: number) =>
                    i < 4 || i >= config.value.length - 4 ? c : '*'
                );
            } else {
                settings[config.key] = config.value;
            }
        });

        // 获取管理员列表（不返回密码）
        const admins = await prisma.adminUser.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: { settings, admins },
        });
    } catch (error) {
        console.error('获取设置失败:', error);
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }
}

// POST - 更新系统设置
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        switch (action) {
            case 'update_oss': {
                // 更新 OSS 配置
                const ossKeys = [
                    'oss_region', 
                    'oss_access_key_id', 
                    'oss_access_key_secret', 
                    'oss_bucket', 
                    'oss_endpoint',
                    'smms_token'
                ];

                for (const key of ossKeys) {
                    if (data[key] !== undefined) {
                        // 如果是密钥且包含*，说明是脱敏数据，忽略
                        if ((key === 'oss_access_key_secret' || key === 'smms_token') && data[key].includes('*')) {
                            continue;
                        }

                        await prisma.siteConfig.upsert({
                            where: { key },
                            update: { value: data[key] },
                            create: { key, value: data[key] },
                        });
                    }
                }

                return NextResponse.json({ success: true, message: '存储配置已更新' });
            }

            case 'update_site': {
                // 更新站点配置
                const siteKeys = ['site_name', 'site_description', 'site_logo', 'banner_slides', 'footer_copyright', 'footer_description', 'site_title'];

                for (const key of siteKeys) {
                    if (data[key] !== undefined) {
                        await prisma.siteConfig.upsert({
                            where: { key },
                            update: { value: data[key] },
                            create: { key, value: data[key] },
                        });
                    }
                }

                return NextResponse.json({ success: true, message: '站点配置已更新' });
            }

            case 'add_admin': {
                // 添加管理员
                const { email, password, name } = data;

                if (!email || !password) {
                    return NextResponse.json({ success: false, error: '请填写邮箱和密码' }, { status: 400 });
                }

                // 检查邮箱是否已存在
                const existing = await prisma.adminUser.findUnique({ where: { email } });
                if (existing) {
                    return NextResponse.json({ success: false, error: '该邮箱已存在' }, { status: 400 });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const admin = await prisma.adminUser.create({
                    data: { email, password: hashedPassword, name },
                    select: { id: true, email: true, name: true, createdAt: true },
                });

                return NextResponse.json({ success: true, data: admin, message: '管理员已添加' });
            }

            case 'update_admin': {
                // 更新管理员信息
                const { id, email, name, password } = data;

                if (!id) {
                    return NextResponse.json({ success: false, error: '缺少管理员 ID' }, { status: 400 });
                }

                const updateData: any = {};
                if (email) updateData.email = email;
                if (name !== undefined) updateData.name = name;
                if (password) {
                    updateData.password = await bcrypt.hash(password, 10);
                }

                const admin = await prisma.adminUser.update({
                    where: { id },
                    data: updateData,
                    select: { id: true, email: true, name: true, createdAt: true },
                });

                return NextResponse.json({ success: true, data: admin, message: '管理员信息已更新' });
            }

            case 'delete_admin': {
                // 删除管理员
                const { id } = data;

                // 至少保留一个管理员
                const count = await prisma.adminUser.count();
                if (count <= 1) {
                    return NextResponse.json({ success: false, error: '至少保留一个管理员' }, { status: 400 });
                }

                await prisma.adminUser.delete({ where: { id } });
                return NextResponse.json({ success: true, message: '管理员已删除' });
            }

            default:
                return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('更新设置失败:', error);
        return NextResponse.json({
            success: false,
            error: error.message || '操作失败'
        }, { status: 500 });
    }
}
