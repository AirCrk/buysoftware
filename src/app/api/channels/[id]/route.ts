import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - 更新渠道
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, color } = body;

        const channel = await prisma.channel.update({
            where: { id },
            data: { name, color },
        });

        return NextResponse.json({ success: true, data: channel });
    } catch (error) {
        console.error('更新渠道失败:', error);
        return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }
}

// DELETE - 删除渠道
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 检查是否有商品使用该渠道
        const productCount = await prisma.product.count({
            where: { channelId: id },
        });

        if (productCount > 0) {
            return NextResponse.json(
                { success: false, error: `该渠道下有 ${productCount} 个商品，无法删除` },
                { status: 400 }
            );
        }

        await prisma.channel.delete({ where: { id } });
        return NextResponse.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除渠道失败:', error);
        return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
}
