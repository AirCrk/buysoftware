import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 获取所有平台
export async function GET() {
    try {
        const platforms = await prisma.platform.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, data: platforms });
    } catch (error) {
        console.error('获取平台列表失败:', error);
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }
}
