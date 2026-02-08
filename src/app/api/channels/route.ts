import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 获取所有渠道
export async function GET() {
    try {
        const channels = await prisma.channel.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        return NextResponse.json({ success: true, data: channels });
    } catch (error) {
        console.error('获取渠道失败:', error);
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }
}

// POST - 创建渠道
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, color } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: '请输入渠道名称' }, { status: 400 });
        }

        // 检查是否已存在
        const existing = await prisma.channel.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json({ success: false, error: '该渠道已存在' }, { status: 400 });
        }

        const channel = await prisma.channel.create({
            data: { name, color },
        });

        return NextResponse.json({ success: true, data: channel });
    } catch (error) {
        console.error('创建渠道失败:', error);
        return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
    }
}
