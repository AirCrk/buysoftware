import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Upload to SM.MS
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ success: false, error: '请上传文件' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: '不支持的文件类型' }, { status: 400 });
        }

        // Validate file size (SM.MS limit is usually 5MB for free users)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: '文件大小不能超过 5MB' }, { status: 400 });
        }

        // 优先从数据库读取配置
        const smmsConfig = await prisma.siteConfig.findUnique({
            where: { key: 'smms_token' }
        });
        
        const token = smmsConfig?.value || process.env.SMMS_TOKEN;

        if (!token) {
            return NextResponse.json({ success: false, error: '服务器未配置 SM.MS Token' }, { status: 500 });
        }

        // Create a new FormData for the upstream request
        const upstreamFormData = new FormData();
        upstreamFormData.append('smfile', file);
        upstreamFormData.append('format', 'json');

        const response = await fetch('https://sm.ms/api/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': token,
                // Note: Do NOT set Content-Type header manually for FormData, 
                // fetch will generate it with the correct boundary.
                'User-Agent': 'BuySoft/1.0'
            },
            body: upstreamFormData,
        });

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({ 
                success: true, 
                url: data.data.url,
                delete: data.data.delete // Optional: return delete link if needed
            });
        } else if (data.code === 'image_repeated') {
            // SM.MS returns this code if image already exists
            return NextResponse.json({ 
                success: true, 
                url: data.images // specific field for repeated images in some versions, or check data.data
                || (typeof data.data === 'string' ? data.data : data.data?.url) // fallback
            });
        } else {
            return NextResponse.json({ success: false, error: data.message || 'SM.MS 上传失败' }, { status: 400 });
        }

    } catch (error) {
        console.error('SM.MS 上传失败:', error);
        return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
    }
}
