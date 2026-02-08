import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const configs = await prisma.siteConfig.findMany({
            where: {
                key: { in: ['site_name', 'site_description', 'site_logo'] }
            }
        });

        const settings: Record<string, string> = {};
        configs.forEach((config) => {
            settings[config.key] = config.value;
        });

        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('获取站点配置失败:', error);
        return NextResponse.json({ success: false, error: '获取配置失败' }, { status: 500 });
    }
}
