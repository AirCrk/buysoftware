import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
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

        const platformId = searchParams.get('platformId');

        // ...

        if (platformId && platformId !== 'all') {
            // 如果提供了 platformId，优先按 ID 筛选
            where.platforms = {
                some: { id: platformId }
            };
        } else if (platform && platform !== 'all') {
            // 否则按名称筛选（兼容旧逻辑）
            where.platforms = {
                some: { name: { contains: platform, mode: 'insensitive' } } // 模糊匹配更友好
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
// POST - 创建商品
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, subtitle, description, originalPrice, salePrice, cpsLink, downloadUrl, coverImage, logo, images, platformIds, channelId } = body;
        let { slug } = body;

        if (!name || !cpsLink) {
            return NextResponse.json({ success: false, error: '请填写必填项' }, { status: 400 });
        }

        // 自动生成 slug
        if (!slug) {
            const pinyin = require('pinyin');
            try {
                // @ts-ignore
                const py = pinyin(name.trim().toLowerCase(), {
                    style: pinyin.STYLE_NORMAL,
                });
                slug = py.flat().join('-');
            } catch (e) {
                // Fallback to random string if pinyin fails
                console.error('Pinyin generation failed:', e);
                slug = `product-${Date.now().toString(36)}`;
            }
        }

        // 处理 slug 格式
        slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!slug) slug = `product-${Date.now().toString(36)}`;

        // 确保唯一性
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        const product = await prisma.product.create({
            data: {
                name,
                slug: uniqueSlug,
                subtitle,
                description,
                originalPrice: parseFloat(originalPrice) || 0,
                salePrice: parseFloat(salePrice) || 0,
                cpsLink,
                downloadUrl,
                coverImage: images && images.length > 0 ? images[0] : coverImage,
                logo,
                images: images || [],
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
