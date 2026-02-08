import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 获取商品列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const search = searchParams.get('search') || '';
        const platform = searchParams.get('platform') || '';
        const isAdmin = searchParams.get('admin') === 'true';

        // 构建查询条件
        const where: any = {};

        if (!isAdmin) {
            where.isActive = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { subtitle: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (platform && platform !== 'all') {
            where.platforms = {
                some: { name: platform }
            };
        }

        // 查询总数
        const total = await prisma.product.count({ where });

        // 查询列表
        const products = await prisma.product.findMany({
            where,
            include: {
                platforms: true,
                channel: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return NextResponse.json({
            success: true,
            data: products,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
    } catch (error) {
        console.error('获取商品列表失败:', error);
        return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
    }
}

// POST - 创建商品
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, subtitle, description, originalPrice, salePrice, cpsLink, coverImage, platformIds, channelId } = body;

        if (!name || !cpsLink) {
            return NextResponse.json({ success: false, error: '请填写必填项' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                subtitle,
                description,
                originalPrice: parseFloat(originalPrice) || 0,
                salePrice: parseFloat(salePrice) || 0,
                cpsLink,
                coverImage,
                platforms: platformIds?.length ? {
                    connect: platformIds.map((id: string) => ({ id }))
                } : undefined,
                channelId: channelId || null,
            },
            include: { platforms: true, channel: true },
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('创建商品失败:', error);
        return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
    }
}
