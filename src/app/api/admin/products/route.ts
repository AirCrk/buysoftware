import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const platformId = searchParams.get('platformId');
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        const where: any = {};

        if (platformId && platformId !== 'all') {
            where.platforms = {
                some: { id: platformId }
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { subtitle: { contains: search, mode: 'insensitive' } },
            ];
        }

        const total = await prisma.product.count({ where });

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                platforms: true,
                channel: true,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json({ success: false, error: '获取商品失败' }, { status: 500 });
    }
}
