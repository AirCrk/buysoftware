import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 获取单个商品
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { platforms: true, channel: true },
        });

        if (!product) {
            return NextResponse.json({ success: false, error: '商品不存在' }, { status: 404 });
        }

        // 增加浏览次数
        await prisma.product.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('获取商品失败:', error);
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }
}

// PUT - 更新商品
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, subtitle, description, originalPrice, salePrice, cpsLink, downloadUrl, coverImage, platformIds, channelId, isActive } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                subtitle,
                description,
                originalPrice: parseFloat(originalPrice) || 0,
                salePrice: parseFloat(salePrice) || 0,
                cpsLink,
                downloadUrl,
                coverImage,
                isActive,
                channelId: channelId || null,
                platforms: {
                    set: platformIds?.map((pid: string) => ({ id: pid })) || [],
                },
            },
            include: { platforms: true, channel: true },
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('更新商品失败:', error);
        return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }
}

// DELETE - 删除商品
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除商品失败:', error);
        return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
}
